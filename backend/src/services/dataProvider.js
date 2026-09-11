import { getPostsByClient as getMockPosts } from '../data/mockData.js';
import { getConnection } from '../data/connectionStore.js';
import { fetchAllPosts } from './metaApi.js';

const CACHE_TTL_MS = 15 * 60 * 1000; // La Graph API tiene límites de tasa; no vale la pena pedir en cada request.
const cache = new Map();

function cacheKey(clientId, days) {
  return `${clientId}:${days}`;
}

export async function getPostsForClient(clientId, { days = 90 } = {}) {
  const connection = getConnection(clientId);
  if (!connection) {
    return { posts: getMockPosts(clientId), source: 'mock' };
  }

  const key = cacheKey(clientId, days);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return { posts: cached.posts, source: 'live' };
  }

  try {
    const posts = await fetchAllPosts(clientId, connection, days);
    cache.set(key, { posts, at: Date.now() });
    return { posts, source: 'live' };
  } catch (err) {
    console.error(`Error obteniendo datos reales de Meta para ${clientId}:`, err.message);
    // Degrada a datos de ejemplo en vez de romper el dashboard si el token
    // expiró o la Graph API falla momentáneamente.
    return { posts: getMockPosts(clientId), source: 'mock', error: err.message };
  }
}

export function invalidateClientCache(clientId) {
  for (const key of [...cache.keys()]) {
    if (key.startsWith(`${clientId}:`)) cache.delete(key);
  }
}
