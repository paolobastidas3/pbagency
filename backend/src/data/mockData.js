// Datos simulados de clientes y publicaciones de Instagram/Facebook.
// Pensado para reemplazarse por llamadas reales a la Graph API de Meta
// manteniendo la misma forma de datos (ver services/metaApi.js).

const CONTENT_TYPES = ['reel', 'carrusel', 'imagen', 'video', 'historia'];
const PLATFORMS = ['instagram', 'facebook'];

const CLIENTS = [
  { id: 'nova-fitness', name: 'Nova Fitness', industry: 'Salud y bienestar', avatarColor: '#2a78d6' },
  { id: 'la-taberna', name: 'La Taberna del Puerto', industry: 'Restaurante', avatarColor: '#eb6834' },
  { id: 'urbanwear', name: 'UrbanWear', industry: 'Moda', avatarColor: '#1baf7a' },
  { id: 'clinica-sonrisa', name: 'Clínica Sonrisa', industry: 'Salud dental', avatarColor: '#eda100' },
];

// PRNG determinista para que los datos sean estables entre reinicios del servidor.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function pick(rand, arr) {
  return arr[Math.floor(rand() * arr.length)];
}

// Cada tipo de contenido tiene un multiplicador base de alcance/engagement
// distinto, para que los insights generados tengan una señal real que detectar.
const TYPE_PERFORMANCE = {
  reel: { reachMult: 2.6, engMult: 1.8 },
  carrusel: { reachMult: 1.4, engMult: 1.5 },
  video: { reachMult: 1.7, engMult: 1.2 },
  imagen: { reachMult: 1.0, engMult: 1.0 },
  historia: { reachMult: 0.6, engMult: 0.8 },
};

const PLATFORM_PERFORMANCE = {
  instagram: { reachMult: 1.2, engMult: 1.3 },
  facebook: { reachMult: 1.0, engMult: 1.0 },
};

function generatePosts(clientId, days = 90) {
  const rand = mulberry32(seedFromString(clientId));
  const posts = [];
  const now = new Date('2026-09-11T00:00:00Z');
  const baseFollowers = 8000 + Math.floor(rand() * 40000);

  let postId = 0;
  for (let d = days; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    // No todos los días hay publicación (frecuencia ~ cada 1.5 días por plataforma).
    for (const platform of PLATFORMS) {
      if (rand() > 0.62) continue;

      const type = pick(rand, CONTENT_TYPES);
      const typePerf = TYPE_PERFORMANCE[type];
      const platPerf = PLATFORM_PERFORMANCE[platform];

      const baseReach = baseFollowers * (0.08 + rand() * 0.1);
      const reach = Math.round(baseReach * typePerf.reachMult * platPerf.reachMult);
      const impressions = Math.round(reach * (1.15 + rand() * 0.35));

      const baseEngRate = 0.02 + rand() * 0.02;
      const engagementRate = +(baseEngRate * typePerf.engMult * platPerf.engMult).toFixed(4);

      const engagements = Math.round(reach * engagementRate);
      const likes = Math.round(engagements * (0.72 + rand() * 0.1));
      const comments = Math.round(engagements * (0.08 + rand() * 0.06));
      const saves = Math.round(engagements * (0.05 + rand() * 0.06));
      const shares = Math.max(0, engagements - likes - comments - saves);

      posts.push({
        id: `${clientId}-${platform}-${postId++}`,
        clientId,
        platform,
        type,
        date: date.toISOString().slice(0, 10),
        reach,
        impressions,
        likes,
        comments,
        shares,
        saves,
        engagementRate,
      });
    }
  }
  return posts;
}

const POSTS_BY_CLIENT = Object.fromEntries(
  CLIENTS.map((c) => [c.id, generatePosts(c.id)])
);

export function getClients() {
  return CLIENTS;
}

export function getClientById(id) {
  return CLIENTS.find((c) => c.id === id);
}

export function getPostsByClient(id) {
  return POSTS_BY_CLIENT[id] || [];
}
