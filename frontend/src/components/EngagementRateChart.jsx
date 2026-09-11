import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDate, formatPercent } from '../lib/format';
import { useChartTheme } from '../lib/theme';

function CustomTooltip({ active, payload, label, theme }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: theme.surface,
        border: `1px solid ${theme.gridline}`,
        borderRadius: 8,
        padding: '8px 10px',
        fontSize: 12,
      }}
    >
      <div style={{ color: theme.textMuted, marginBottom: 4 }}>{formatDate(label)}</div>
      <div style={{ color: theme.textSecondary }}>
        Engagement: <strong style={{ color: theme.blue }}>{formatPercent(payload[0].value)}</strong>
      </div>
    </div>
  );
}

export default function EngagementRateChart({ data }) {
  const theme = useChartTheme();

  if (!data.length) return <p className="empty-state">Sin datos para este rango.</p>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={theme.gridline} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fill: theme.textMuted, fontSize: 11 }}
          axisLine={{ stroke: theme.baseline }}
          tickLine={false}
          minTickGap={30}
        />
        <YAxis
          tickFormatter={formatPercent}
          tick={{ fill: theme.textMuted, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <Tooltip content={<CustomTooltip theme={theme} />} />
        <Line
          type="monotone"
          dataKey="engagementRate"
          stroke={theme.blue}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
