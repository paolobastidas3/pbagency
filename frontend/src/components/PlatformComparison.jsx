import { PLATFORM_LABELS, formatNumber, formatPercent } from '../lib/format';
import { platformColor } from '../lib/palette';
import { useChartTheme } from '../lib/theme';

export default function PlatformComparison({ byPlatform }) {
  const theme = useChartTheme();
  const platforms = Object.keys(byPlatform);

  if (!platforms.length) return <p className="empty-state">Sin datos para este rango.</p>;

  return (
    <div className="platform-compare">
      {platforms.map((platform) => {
        const stats = byPlatform[platform];
        return (
          <div className="platform-card" key={platform}>
            <div className="platform-name">
              <span className="dot" style={{ background: platformColor(platform, theme) }} />
              {PLATFORM_LABELS[platform] || platform}
            </div>
            <div className="metric-row">
              <span>Publicaciones</span>
              <strong>{stats.posts}</strong>
            </div>
            <div className="metric-row">
              <span>Alcance</span>
              <strong>{formatNumber(stats.reach)}</strong>
            </div>
            <div className="metric-row">
              <span>Engagement prom.</span>
              <strong>{formatPercent(stats.avgEngagementRate)}</strong>
            </div>
          </div>
        );
      })}
    </div>
  );
}
