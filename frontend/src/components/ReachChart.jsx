import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDate, formatNumber } from '../lib/format';
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
        Alcance: <strong style={{ color: theme.blue }}>{formatNumber(payload[0].value)}</strong>
      </div>
    </div>
  );
}

export default function ReachChart({ data }) {
  const theme = useChartTheme();

  if (!data.length) return <p className="empty-state">Sin datos para este rango.</p>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="reachFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.blue} stopOpacity={0.28} />
            <stop offset="100%" stopColor={theme.blue} stopOpacity={0.02} />
          </linearGradient>
        </defs>
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
          tickFormatter={formatNumber}
          tick={{ fill: theme.textMuted, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip theme={theme} />} />
        <Area
          type="monotone"
          dataKey="reach"
          stroke={theme.blue}
          strokeWidth={2}
          fill="url(#reachFill)"
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
