export function formatNumber(n) {
  return new Intl.NumberFormat('es', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

export function formatPercent(n) {
  return `${(n * 100).toFixed(1)}%`;
}

export function formatDate(dateStr) {
  return new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short' }).format(new Date(dateStr));
}

export const CONTENT_TYPE_LABELS = {
  reel: 'Reel',
  carrusel: 'Carrusel',
  imagen: 'Imagen',
  video: 'Video',
  historia: 'Historia',
};

export const PLATFORM_LABELS = {
  instagram: 'Instagram',
  facebook: 'Facebook',
};
