import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList } from 'recharts';
import { ResponsiveContainer } from 'recharts';
import { CONTENT_TYPE_LABELS, formatPercent } from '../lib/format';
import { contentTypeColor } from '../lib/palette';
import { useChartTheme } from '../lib/theme';

function CustomTooltip({ active, payload, theme }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
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
      <div style={{ color: theme.textPrimary || theme.textSecondary, fontWeight: 600, marginBottom: 4 }}>
        {CONTENT_TYPE_LABELS[item.type]}
      </div>
      <div style={{ color: theme.textSecondary }}>Engagement promedio: {formatPercent(item.avgEngagementRate)}</div>
      <div style={{ color: theme.textMuted }}>{item.posts} publicaciones</div>
    </div>
  );
}

export default function ContentTypeChart({ data }) {
  const theme = useChartTheme();

  if (!data.length) return <p className="empty-state">Sin datos para este rango.</p>;

  const sorted = [...data].sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={sorted} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={theme.gridline} vertical={false} />
        <XAxis
          dataKey="type"
          tickFormatter={(t) => CONTENT_TYPE_LABELS[t] || t}
          tick={{ fill: theme.textMuted, fontSize: 11 }}
          axisLine={{ stroke: theme.baseline }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatPercent}
          tick={{ fill: theme.textMuted, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <Tooltip content={<CustomTooltip theme={theme} />} cursor={{ fill: theme.gridline, opacity: 0.4 }} />
        <Bar dataKey="avgEngagementRate" radius={[4, 4, 0, 0]} maxBarSize={48}>
          {sorted.map((entry) => (
            <Cell key={entry.type} fill={contentTypeColor(entry.type, theme)} />
          ))}
          <LabelList
            dataKey="avgEngagementRate"
            position="top"
            formatter={formatPercent}
            style={{ fill: theme.textSecondary, fontSize: 11 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
