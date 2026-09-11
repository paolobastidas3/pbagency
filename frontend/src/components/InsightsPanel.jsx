import { STATUS_CSS } from '../lib/palette';

const ICONS = {
  positivo: '▲',
  oportunidad: '★',
  alerta: '▼',
};

const TITLES = {
  positivo: 'Tendencia positiva',
  oportunidad: 'Oportunidad',
  alerta: 'Alerta',
};

export default function InsightsPanel({ insights }) {
  if (!insights.length) {
    return <p className="empty-state">No hay suficientes datos en este rango para generar recomendaciones.</p>;
  }

  return (
    <div className="insights-list">
      {insights.map((insight, i) => (
        <div className="insight-card" key={i} style={{ borderLeftColor: STATUS_CSS[insight.type] }}>
          <p className="insight-title">
            <span aria-hidden="true" style={{ color: STATUS_CSS[insight.type] }}>
              {ICONS[insight.type] || '•'}
            </span>
            {insight.title}
            <span className="badge" style={{ marginLeft: 'auto' }}>
              {TITLES[insight.type] || insight.type}
            </span>
          </p>
          <p>{insight.detail}</p>
        </div>
      ))}
    </div>
  );
}
