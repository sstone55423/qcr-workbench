import React, { useMemo } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useI18n } from '@/lib/I18nContext';
import { formatCurrency, formatCompactCurrency, formatPercent } from '@/lib/qcr/format';
import { AXIS_PROPS, TOOLTIP_STYLE } from '@/components/charts/chartTheme';

const COLORS = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'];

// Horizontal ranking of scenarios by deterministic ALE, from portfolioAle()
// rows (already sorted descending).
export default function ScenarioAleBars({ rows }) {
  const { t } = useI18n();
  const data = useMemo(() => rows.map((row) => ({ ...row })), [rows]);
  const height = Math.max(160, 44 * data.length + 40);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
        <XAxis type="number" tickFormatter={formatCompactCurrency} {...AXIS_PROPS} />
        <YAxis type="category" dataKey="name" width={180} {...AXIS_PROPS} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value, name, item) => [
            `${formatCurrency(value)} — ${t('portfolio.shareOfTotal', { share: formatPercent(item?.payload?.share || 0, 0) })}`,
            null,
          ]}
        />
        <Bar dataKey="ale" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => (
            <Cell key={entry.id} fill={`hsl(var(${COLORS[i % COLORS.length]}))`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
