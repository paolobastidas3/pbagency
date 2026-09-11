const BASE = '/api';

async function getJSON(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status} al llamar ${path}`);
  }
  return res.json();
}

async function postJSON(path, data) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status} al llamar ${path}`);
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

export function fetchConnectionStatus(clientId) {
  return getJSON(`/auth/status/${clientId}`);
}

export function getConnectUrl(clientId) {
  return `${BASE}/auth/facebook/login?clientId=${encodeURIComponent(clientId)}`;
}

export function fetchPendingSelection(token) {
  return getJSON(`/auth/pending/${token}`);
}

export function selectPage(token, pageId) {
  return postJSON('/auth/select', { token, pageId });
}

export function disconnectClient(clientId) {
  return postJSON(`/auth/disconnect/${clientId}`, {});
}
