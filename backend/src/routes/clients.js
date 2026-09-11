import { Router } from 'express';
import { getClients, getClientById, getPostsByClient } from '../data/mockData.js';
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

function getFilteredPosts(req, clientId) {
  const posts = getPostsByClient(clientId);
  const byPlatform = filterByPlatform(posts, req.query.platform);
  return filterByRange(byPlatform, req.query.days);
}

router.get('/', (req, res) => {
  res.json(getClients());
});

router.get('/:id', (req, res) => {
  const client = getClientById(req.params.id);
  if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
  res.json(client);
});

router.get('/:id/summary', (req, res) => {
  const client = getClientById(req.params.id);
  if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
  const posts = getFilteredPosts(req, req.params.id);
  res.json(buildSummary(posts));
});

router.get('/:id/timeseries', (req, res) => {
  const client = getClientById(req.params.id);
  if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
  const posts = getFilteredPosts(req, req.params.id);
  res.json(buildTimeSeries(posts));
});

router.get('/:id/content-types', (req, res) => {
  const client = getClientById(req.params.id);
  if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
  const posts = getFilteredPosts(req, req.params.id);
  res.json(buildContentTypeBreakdown(posts));
});

router.get('/:id/top-posts', (req, res) => {
  const client = getClientById(req.params.id);
  if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
  const posts = getFilteredPosts(req, req.params.id);
  const limit = Number(req.query.limit) || 5;
  res.json(topPosts(posts, limit));
});

router.get('/:id/insights', (req, res) => {
  const client = getClientById(req.params.id);
  if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
  const posts = getFilteredPosts(req, req.params.id);
  res.json(buildInsights(posts));
});

export default router;
