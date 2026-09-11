import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { config, isMetaConfigured } from '../config.js';
import { getClientById } from '../data/mockData.js';
import { saveConnection, removeConnection, getConnection } from '../data/connectionStore.js';
import { invalidateClientCache } from '../services/dataProvider.js';
import { getOAuthDialogUrl, exchangeCodeForUserToken, getLongLivedUserToken, getUserPages } from '../services/metaApi.js';

const router = Router();

// Selecciones pendientes cuando el usuario administra más de una página de
// Facebook: se guarda en memoria un momento mientras el usuario elige cuál
// va con este cliente. No necesita persistir en disco.
const pendingSelections = new Map();
const PENDING_TTL_MS = 10 * 60 * 1000;

function redirectToFrontend(res, params) {
  const url = new URL(config.frontendUrl);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  res.redirect(url.toString());
}

router.get('/facebook/login', (req, res) => {
  const { clientId } = req.query;
  if (!clientId || !getClientById(clientId)) {
    return res.status(400).json({ error: 'clientId inválido' });
  }
  if (!isMetaConfigured()) {
    return res.status(500).json({
      error: 'Faltan META_APP_ID / META_APP_SECRET en backend/.env. Ver README para crear la app en Meta.',
    });
  }
  res.redirect(getOAuthDialogUrl(clientId));
});

router.get('/facebook/callback', async (req, res) => {
  const { code, state: clientId, error: oauthError } = req.query;

  if (oauthError) {
    return redirectToFrontend(res, { connect_error: 'denied' });
  }
  if (!code || !clientId || !getClientById(clientId)) {
    return redirectToFrontend(res, { connect_error: 'invalid_request' });
  }

  try {
    const shortLivedToken = await exchangeCodeForUserToken(code);
    const longLivedToken = await getLongLivedUserToken(shortLivedToken);
    const pages = await getUserPages(longLivedToken);

    if (pages.length === 0) {
      return redirectToFrontend(res, { connect_error: 'no_pages', client: clientId });
    }

    if (pages.length === 1) {
      const [page] = pages;
      saveConnection(clientId, {
        pageId: page.id,
        pageName: page.name,
        pageAccessToken: page.accessToken,
        igUserId: page.instagram?.id || null,
        igUsername: page.instagram?.username || null,
      });
      invalidateClientCache(clientId);
      return redirectToFrontend(res, { connected: '1', client: clientId });
    }

    const token = randomUUID();
    pendingSelections.set(token, { clientId, pages });
    setTimeout(() => pendingSelections.delete(token), PENDING_TTL_MS);
    return redirectToFrontend(res, { select: token, client: clientId });
  } catch (err) {
    console.error('Error en el callback de OAuth de Meta:', err.message);
    return redirectToFrontend(res, { connect_error: 'meta_error', client: clientId });
  }
});

router.get('/pending/:token', (req, res) => {
  const pending = pendingSelections.get(req.params.token);
  if (!pending) return res.status(404).json({ error: 'Selección expirada o inválida' });
  res.json({
    clientId: pending.clientId,
    pages: pending.pages.map((p) => ({
      id: p.id,
      name: p.name,
      igUsername: p.instagram?.username || null,
    })),
  });
});

router.post('/select', (req, res) => {
  const { token, pageId } = req.body;
  const pending = pendingSelections.get(token);
  if (!pending) return res.status(404).json({ error: 'Selección expirada o inválida' });

  const page = pending.pages.find((p) => p.id === pageId);
  if (!page) return res.status(400).json({ error: 'Página no encontrada en la selección' });

  saveConnection(pending.clientId, {
    pageId: page.id,
    pageName: page.name,
    pageAccessToken: page.accessToken,
    igUserId: page.instagram?.id || null,
    igUsername: page.instagram?.username || null,
  });
  invalidateClientCache(pending.clientId);
  pendingSelections.delete(token);
  res.json({ ok: true, clientId: pending.clientId });
});

router.get('/status/:clientId', (req, res) => {
  const connection = getConnection(req.params.clientId);
  res.json({
    metaConfigured: isMetaConfigured(),
    connected: Boolean(connection),
    pageName: connection?.pageName || null,
    igUsername: connection?.igUsername || null,
    connectedAt: connection?.connectedAt || null,
  });
});

router.post('/disconnect/:clientId', (req, res) => {
  removeConnection(req.params.clientId);
  invalidateClientCache(req.params.clientId);
  res.json({ ok: true });
});

export default router;
