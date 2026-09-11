export default function FilterBar({ platform, onPlatformChange, days, onDaysChange }) {
  return (
    <div className="filters">
      <select value={platform} onChange={(e) => onPlatformChange(e.target.value)} aria-label="Plataforma">
        <option value="all">Todas las plataformas</option>
        <option value="instagram">Instagram</option>
        <option value="facebook">Facebook</option>
      </select>
      <select value={days} onChange={(e) => onDaysChange(e.target.value)} aria-label="Rango de fechas">
        <option value="7">Últimos 7 días</option>
        <option value="30">Últimos 30 días</option>
        <option value="90">Últimos 90 días</option>
      </select>
    </div>
  );
}
