import { config } from '../config.js';

const GRAPH_VERSION = 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

async function graphGet(path, params = {}) {
  const url = new URL(`${GRAPH_BASE}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  }
  const res = await fetch(url);
  const json = await res.json();
  if (json.error) {
    const err = new Error(json.error.message || 'Error de la Graph API de Meta');
    err.graphError = json.error;
    throw err;
  }
  return json;
}

export function getOAuthDialogUrl(state) {
  const url = new URL(`https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`);
  url.searchParams.set('client_id', config.metaAppId);
  url.searchParams.set('redirect_uri', config.metaRedirectUri);
  url.searchParams.set('state', state);
  url.searchParams.set('response_type', 'code');
  // Permisos mínimos para leer páginas, sus posts/insights y la cuenta de
  // Instagram profesional vinculada. Requieren modo Desarrollo (probadores)
  // o pasar App Review para usarse con cuentas ajenas a la app.
  url.searchParams.set(
    'scope',
    [
      'pages_show_list',
      'pages_read_engagement',
      'read_insights',
      'instagram_basic',
      'instagram_manage_insights',
      'business_management',
    ].join(',')
  );
  return url.toString();
}

export async function exchangeCodeForUserToken(code) {
  const json = await graphGet('oauth/access_token', {
    client_id: config.metaAppId,
    client_secret: config.metaAppSecret,
    redirect_uri: config.metaRedirectUri,
    code,
  });
  return json.access_token;
}

export async function getLongLivedUserToken(shortLivedToken) {
  const json = await graphGet('oauth/access_token', {
    grant_type: 'fb_exchange_token',
    client_id: config.metaAppId,
    client_secret: config.metaAppSecret,
    fb_exchange_token: shortLivedToken,
  });
  return json.access_token;
}

// Páginas administradas por el usuario que autorizó la app, cada una con su
// propio token de página y (si existe) la cuenta de Instagram profesional
// vinculada — así es como Meta modela la relación Página <-> Instagram.
export async function getUserPages(userAccessToken) {
  const json = await graphGet('me/accounts', {
    fields: 'id,name,access_token,instagram_business_account{id,username}',
    access_token: userAccessToken,
    limit: 100,
  });
  return (json.data || []).map((page) => ({
    id: page.id,
    name: page.name,
    accessToken: page.access_token,
    instagram: page.instagram_business_account
      ? { id: page.instagram_business_account.id, username: page.instagram_business_account.username }
      : null,
  }));
}

function daysAgoUnix(days) {
  return Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;
}

function mapInstagramType(mediaType, mediaProductType) {
  if (mediaProductType === 'REELS') return 'reel';
  if (mediaProductType === 'STORY') return 'historia';
  if (mediaType === 'CAROUSEL_ALBUM') return 'carrusel';
  if (mediaType === 'VIDEO') return 'video';
  return 'imagen';
}

// Distintos tipos de publicación de Instagram exponen distintas métricas de
// insights (p. ej. los reels ya no reportan "impressions"). Se intenta con
// el set correcto y, si Meta igual lo rechaza, se degrada con ceros en vez
// de tumbar el dashboard completo.
function insightsMetricsFor(mediaProductType) {
  if (mediaProductType === 'REELS') return ['reach', 'likes', 'comments', 'shares', 'saved', 'plays'];
  if (mediaProductType === 'STORY') return ['reach', 'replies', 'taps_forward', 'taps_back'];
  return ['reach', 'impressions', 'saved'];
}

async function safeMediaInsights(mediaId, mediaProductType, accessToken) {
  const metrics = insightsMetricsFor(mediaProductType);
  try {
    const json = await graphGet(`${mediaId}/insights`, {
      metric: metrics.join(','),
      access_token: accessToken,
    });
    const values = {};
    for (const entry of json.data || []) {
      values[entry.name] = entry.values?.[0]?.value ?? 0;
    }
    return values;
  } catch {
    return {};
  }
}

export async function fetchInstagramPosts(clientId, igUserId, pageAccessToken, days) {
  const json = await graphGet(`${igUserId}/media`, {
    fields: 'id,caption,media_type,media_product_type,timestamp,like_count,comments_count',
    since: daysAgoUnix(days),
    access_token: pageAccessToken,
    limit: 100,
  });

  const posts = [];
  for (const media of json.data || []) {
    const insights = await safeMediaInsights(media.id, media.media_product_type, pageAccessToken);
    const reach = insights.reach || 0;
    const impressions = insights.impressions || reach;
    const likes = media.like_count || 0;
    const comments = media.comments_count || 0;
    const shares = insights.shares || 0;
    const saves = insights.saved || 0;
    const engagements = likes + comments + shares + saves;

    posts.push({
      id: `ig-${media.id}`,
      clientId,
      platform: 'instagram',
      type: mapInstagramType(media.media_type, media.media_product_type),
      date: media.timestamp?.slice(0, 10),
      reach,
      impressions,
      likes,
      comments,
      shares,
      saves,
      engagementRate: reach > 0 ? +(engagements / reach).toFixed(4) : 0,
    });
  }
  return posts;
}

function mapFacebookType(attachments) {
  const mediaType = attachments?.data?.[0]?.media_type;
  if (mediaType === 'video') return 'video';
  if (mediaType === 'album') return 'carrusel';
  return 'imagen';
}

async function safePostInsights(postId, accessToken) {
  try {
    const json = await graphGet(`${postId}/insights`, {
      metric: 'post_impressions,post_impressions_unique',
      access_token: accessToken,
    });
    const values = {};
    for (const entry of json.data || []) {
      values[entry.name] = entry.values?.[0]?.value ?? 0;
    }
    return values;
  } catch {
    return {};
  }
}

export async function fetchFacebookPosts(clientId, pageId, pageAccessToken, days) {
  const json = await graphGet(`${pageId}/posts`, {
    fields: 'id,created_time,attachments{media_type},shares,likes.summary(true),comments.summary(true)',
    since: daysAgoUnix(days),
    access_token: pageAccessToken,
    limit: 100,
  });

  const posts = [];
  for (const post of json.data || []) {
    const insights = await safePostInsights(post.id, pageAccessToken);
    const reach = insights.post_impressions_unique || 0;
    const impressions = insights.post_impressions || reach;
    const likes = post.likes?.summary?.total_count || 0;
    const comments = post.comments?.summary?.total_count || 0;
    const shares = post.shares?.count || 0;
    const saves = 0; // Facebook no expone "guardados" a nivel de publicación vía Graph API.
    const engagements = likes + comments + shares + saves;

    posts.push({
      id: `fb-${post.id}`,
      clientId,
      platform: 'facebook',
      type: mapFacebookType(post.attachments),
      date: post.created_time?.slice(0, 10),
      reach,
      impressions,
      likes,
      comments,
      shares,
      saves,
      engagementRate: reach > 0 ? +(engagements / reach).toFixed(4) : 0,
    });
  }
  return posts;
}

export async function fetchAllPosts(clientId, connection, days) {
  const [igPosts, fbPosts] = await Promise.all([
    connection.igUserId
      ? fetchInstagramPosts(clientId, connection.igUserId, connection.pageAccessToken, days)
      : Promise.resolve([]),
    connection.pageId
      ? fetchFacebookPosts(clientId, connection.pageId, connection.pageAccessToken, days)
      : Promise.resolve([]),
  ]);
  return [...igPosts, ...fbPosts];
}
