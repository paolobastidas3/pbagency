import { Router } from 'express';
import { getClients, getClientById } from '../data/mockData.js';
import { getPostsForClient } from '../services/dataProvider.js';
import {
  buildSummary,
  buildTimeSeries,
  buildContentTypeBreakdown,
  topPosts,
  buildInsights,
} from '../services/insights.js';

const router = Router();

function filterByPlatform(posts, platform) {
  if (!platform || platform === 'all') return posts;
  return posts.filter((p) => p.platform === platform);
}

function filterByRange(posts, rangeDays) {
  if (!rangeDays) return posts;
  const days = Number(rangeDays);
  if (!Number.isFinite(days) || days <= 0) return posts;
  const sorted = [...posts].sort((a, b) => (a.date < b.date ? -1 : 1));
  if (sorted.length === 0) return posts;
  const lastDate = new Date(sorted[sorted.length - 1].date);
  const cutoff = new Date(lastDate);
  cutoff.setDate(cutoff.getDate() - days);
  return posts.filter((p) => new Date(p.date) > cutoff);
}

async function getFilteredPosts(req, clientId) {
  const days = Number(req.query.days) || 90;
  const { posts, source } = await getPostsForClient(clientId, { days });
  const byPlatform = filterByPlatform(posts, req.query.platform);
  return { posts: filterByRange(byPlatform, req.query.days), source };
}

function asyncRoute(handler) {
  return (req, res, next) => handler(req, res).catch(next);
}

router.get('/', (req, res) => {
  res.json(getClients());
});

router.get('/:id', (req, res) => {
  const client = getClientById(req.params.id);
  if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
  res.json(client);
});

router.get(
  '/:id/summary',
  asyncRoute(async (req, res) => {
    const client = getClientById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    const { posts, source } = await getFilteredPosts(req, req.params.id);
    res.json({ ...buildSummary(posts), source });
  })
);

router.get(
  '/:id/timeseries',
  asyncRoute(async (req, res) => {
    const client = getClientById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    const { posts } = await getFilteredPosts(req, req.params.id);
    res.json(buildTimeSeries(posts));
  })
);

router.get(
  '/:id/content-types',
  asyncRoute(async (req, res) => {
    const client = getClientById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    const { posts } = await getFilteredPosts(req, req.params.id);
    res.json(buildContentTypeBreakdown(posts));
  })
);

router.get(
  '/:id/top-posts',
  asyncRoute(async (req, res) => {
    const client = getClientById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    const { posts } = await getFilteredPosts(req, req.params.id);
    const limit = Number(req.query.limit) || 5;
    res.json(topPosts(posts, limit));
  })
);

router.get(
  '/:id/insights',
  asyncRoute(async (req, res) => {
    const client = getClientById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    const { posts } = await getFilteredPosts(req, req.params.id);
    res.json(buildInsights(posts));
  })
);

export default router;
