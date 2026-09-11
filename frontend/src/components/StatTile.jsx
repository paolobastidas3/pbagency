export default function StatTile({ label, value }) {
  return (
    <div className="stat-tile">
      <p className="label">{label}</p>
      <p className="value">{value}</p>
    </div>
  );
}
