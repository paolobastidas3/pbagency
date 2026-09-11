const BASE = '/api';

async function getJSON(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    throw new Error(`Error ${res.status} al llamar ${path}`);
  }
  return res.json();
}

function buildParams({ platform, days } = {}) {
  const params = new URLSearchParams();
  if (platform && platform !== 'all') params.set('platform', platform);
  if (days) params.set('days', days);
  return params;
}

function buildQuery(filters) {
  const qs = buildParams(filters).toString();
  return qs ? `?${qs}` : '';
}

export function fetchClients() {
  return getJSON('/clients');
}

export function fetchSummary(clientId, filters) {
  return getJSON(`/clients/${clientId}/summary${buildQuery(filters)}`);
}

export function fetchTimeSeries(clientId, filters) {
  return getJSON(`/clients/${clientId}/timeseries${buildQuery(filters)}`);
}

export function fetchContentTypes(clientId, filters) {
  return getJSON(`/clients/${clientId}/content-types${buildQuery(filters)}`);
}

export function fetchTopPosts(clientId, filters, limit = 5) {
  const params = buildParams(filters);
  params.set('limit', limit);
  return getJSON(`/clients/${clientId}/top-posts?${params.toString()}`);
}

export function fetchInsights(clientId, filters) {
  return getJSON(`/clients/${clientId}/insights${buildQuery(filters)}`);
}
