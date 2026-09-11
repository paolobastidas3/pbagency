import { useEffect, useState } from 'react';

// recharts pinta en SVG y necesita valores de color resueltos (no var()),
// así que espejamos aquí los mismos tokens definidos en index.css.
const LIGHT = {
  surface: '#fcfcfb',
  textSecondary: '#52514e',
  textMuted: '#898781',
  gridline: '#e1e0d9',
  baseline: '#c3c2b7',
  blue: '#2a78d6',
  orange: '#eb6834',
  aqua: '#1baf7a',
  yellow: '#eda100',
  magenta: '#e87ba4',
  good: '#0ca30c',
  serious: '#ec835a',
};

const DARK = {
  surface: '#1a1a19',
  textSecondary: '#c3c2b7',
  textMuted: '#898781',
  gridline: '#2c2c2a',
  baseline: '#383835',
  blue: '#3987e5',
  orange: '#d95926',
  aqua: '#199e70',
  yellow: '#c98500',
  magenta: '#d55181',
  good: '#0ca30c',
  serious: '#ec835a',
};

function prefersDark() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function useChartTheme() {
  const [isDark, setIsDark] = useState(prefersDark());

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isDark ? DARK : LIGHT;
}
