// Paleta validada (ver skill dataviz / references/palette.md). Orden fijo:
// nunca reasignar por ranking, siempre por identidad de la categoría.
export function contentTypeColor(type, theme) {
  const map = {
    reel: theme.blue,
    carrusel: theme.orange,
    imagen: theme.aqua,
    video: theme.yellow,
    historia: theme.magenta,
  };
  return map[type] || theme.textMuted;
}

export function platformColor(platform, theme) {
  return platform === 'instagram' ? theme.blue : theme.orange;
}

export const STATUS_CSS = {
  positivo: 'var(--status-good)',
  oportunidad: 'var(--series-blue)',
  alerta: 'var(--status-serious)',
};
