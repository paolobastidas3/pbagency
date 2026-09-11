const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function avg(nums) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function sum(nums) {
  return nums.reduce((a, b) => a + b, 0);
}

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

export function buildSummary(posts) {
  const totalReach = sum(posts.map((p) => p.reach));
  const totalImpressions = sum(posts.map((p) => p.impressions));
  const totalEngagements = sum(posts.map((p) => p.likes + p.comments + p.shares + p.saves));
  const avgEngagementRate = avg(posts.map((p) => p.engagementRate));

  const byPlatform = {};
  for (const [platform, group] of groupBy(posts, (p) => p.platform)) {
    byPlatform[platform] = {
      posts: group.length,
      reach: sum(group.map((p) => p.reach)),
      avgEngagementRate: +avg(group.map((p) => p.engagementRate)).toFixed(4),
    };
  }

  return {
    totalPosts: posts.length,
    totalReach,
    totalImpressions,
    totalEngagements,
    avgEngagementRate: +avgEngagementRate.toFixed(4),
    byPlatform,
  };
}

export function buildTimeSeries(posts) {
  const byDate = groupBy(posts, (p) => p.date);
  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, group]) => ({
      date,
      reach: sum(group.map((p) => p.reach)),
      engagementRate: +avg(group.map((p) => p.engagementRate)).toFixed(4),
    }));
}

export function buildContentTypeBreakdown(posts) {
  const byType = groupBy(posts, (p) => p.type);
  return [...byType.entries()].map(([type, group]) => ({
    type,
    posts: group.length,
    avgReach: Math.round(avg(group.map((p) => p.reach))),
    avgEngagementRate: +avg(group.map((p) => p.engagementRate)).toFixed(4),
  }));
}

export function topPosts(posts, limit = 5) {
  return [...posts]
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, limit);
}

// Genera recomendaciones accionables en lenguaje natural comparando el
// rendimiento reciente (últimos 30 días) contra el histórico y detectando
// qué formato/plataforma/día de la semana funciona mejor.
export function buildInsights(posts) {
  if (posts.length === 0) return [];

  const insights = [];
  const byTypeRate = buildContentTypeBreakdown(posts).sort(
    (a, b) => b.avgEngagementRate - a.avgEngagementRate
  );

  if (byTypeRate.length >= 2) {
    const best = byTypeRate[0];
    const worst = byTypeRate[byTypeRate.length - 1];
    if (best.avgEngagementRate > worst.avgEngagementRate * 1.2) {
      const liftPct = Math.round((best.avgEngagementRate / worst.avgEngagementRate - 1) * 100);
      insights.push({
        type: 'oportunidad',
        title: `Los ${best.type}s son tu formato más fuerte`,
        detail: `Los ${best.type}s tienen ${liftPct}% más engagement promedio que los ${worst.type}s (${(best.avgEngagementRate * 100).toFixed(1)}% vs ${(worst.avgEngagementRate * 100).toFixed(1)}%). Considera aumentar su frecuencia de publicación.`,
      });
    }
  }

  const byPlatform = groupBy(posts, (p) => p.platform);
  if (byPlatform.size === 2) {
    const platformRates = [...byPlatform.entries()]
      .map(([platform, group]) => ({ platform, rate: avg(group.map((p) => p.engagementRate)) }))
      .sort((a, b) => b.rate - a.rate);
    const [betterEntry, worseEntry] = platformRates;
    const better = betterEntry.platform;
    const worse = worseEntry.platform;
    const betterRate = betterEntry.rate;
    const worseRate = worseEntry.rate;
    if (betterRate > worseRate * 1.15) {
      const liftPct = Math.round((betterRate / worseRate - 1) * 100);
      insights.push({
        type: 'oportunidad',
        title: `${capitalize(better)} está superando a ${capitalize(worse)}`,
        detail: `El engagement promedio en ${capitalize(better)} es ${liftPct}% mayor que en ${capitalize(worse)}. Evalúa redistribuir presupuesto o esfuerzo creativo hacia ${capitalize(better)}.`,
      });
    }
  }

  const sortedByDate = [...posts].sort((a, b) => (a.date < b.date ? -1 : 1));
  const lastDate = new Date(sortedByDate[sortedByDate.length - 1].date);
  const cutoffRecent = new Date(lastDate);
  cutoffRecent.setDate(cutoffRecent.getDate() - 30);
  const cutoffPrev = new Date(lastDate);
  cutoffPrev.setDate(cutoffPrev.getDate() - 60);

  const recent = posts.filter((p) => new Date(p.date) > cutoffRecent);
  const previous = posts.filter((p) => new Date(p.date) <= cutoffRecent && new Date(p.date) > cutoffPrev);

  if (recent.length >= 3 && previous.length >= 3) {
    const recentRate = avg(recent.map((p) => p.engagementRate));
    const prevRate = avg(previous.map((p) => p.engagementRate));
    const deltaPct = Math.round((recentRate / prevRate - 1) * 100);
    if (Math.abs(deltaPct) >= 10) {
      insights.push({
        type: deltaPct > 0 ? 'positivo' : 'alerta',
        title: deltaPct > 0
          ? `El engagement subió ${deltaPct}% en los últimos 30 días`
          : `El engagement bajó ${Math.abs(deltaPct)}% en los últimos 30 días`,
        detail: deltaPct > 0
          ? 'La estrategia reciente está funcionando mejor que el periodo anterior. Identifica qué publicaciones impulsaron el alza y repite ese patrón.'
          : 'Revisa qué cambió en el contenido reciente (formato, frecuencia, horarios) para corregir la tendencia antes de que afecte el alcance orgánico.',
      });
    }
  }

  const byDay = groupBy(posts, (p) => DAY_NAMES[new Date(p.date).getUTCDay()]);
  const dayStats = [...byDay.entries()]
    .filter(([, group]) => group.length >= 3)
    .map(([day, group]) => ({ day, avgEngagementRate: avg(group.map((p) => p.engagementRate)) }))
    .sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);

  if (dayStats.length >= 2) {
    const bestDay = dayStats[0];
    const overallAvg = avg(posts.map((p) => p.engagementRate));
    if (bestDay.avgEngagementRate > overallAvg * 1.15) {
      insights.push({
        type: 'oportunidad',
        title: `Los ${bestDay.day}s generan más interacción`,
        detail: `Las publicaciones en ${bestDay.day} promedian ${(bestDay.avgEngagementRate * 100).toFixed(1)}% de engagement, por encima del ${(overallAvg * 100).toFixed(1)}% general. Prioriza ese día para tu contenido más importante.`,
      });
    }
  }

  const savesHeavy = posts.filter((p) => p.saves > p.likes * 0.3);
  if (savesHeavy.length / posts.length > 0.25) {
    insights.push({
      type: 'positivo',
      title: 'Tu contenido se está guardando mucho',
      detail: 'Una parte importante de tus publicaciones recibe muchos guardados, señal de contenido de valor/referencia. Considera convertir esos temas en una serie o guía descargable.',
    });
  }

  return insights;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
