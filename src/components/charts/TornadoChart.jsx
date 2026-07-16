import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { useI18n } from '@/lib/I18nContext';
import { formatCurrency, formatCompactCurrency } from '@/lib/qcr/format';
import { AXIS_PROPS, TOOLTIP_STYLE } from '@/components/charts/chartTheme';

// Tornado chart from sensitivityRows(): each factor's bar spans the ALE at
// its minimum to the ALE at its maximum, with a dashed line at the baseline.
// Rendered as a stacked horizontal bar (invisible offset + visible span).
export default function TornadoChart({ baseline, rows }) {
  const { t } = useI18n();
  const data = useMemo(
    () => rows.map((row) => ({
      label: t(row.labelKey),
      offset: row.low,
      span: row.high - row.low,
      low: row.low,
      high: row.high,
    })),
    [rows, t],
  );
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
        <XAxis type="number" tickFormatter={formatCompactCurrency} {...AXIS_PROPS} />
        <YAxis type="category" dataKey="label" width={200} {...AXIS_PROPS} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value, name, item) =>
            name === 'span' ? [`${formatCurrency(item?.payload?.low || 0)} – ${formatCurrency(item?.payload?.high || 0)}`, null] : null}
        />
        <ReferenceLine
          x={baseline}
          stroke="hsl(var(--destructive))"
          strokeDasharray="6 4"
          label={{ value: 'ALE', fill: 'hsl(var(--destructive))', fontSize: 11, position: 'insideTopRight' }}
        />
        <Bar dataKey="offset" stackId="swing" fill="transparent" isAnimationActive={false} />
        <Bar dataKey="span" stackId="swing" fill="hsl(var(--chart-1))" radius={[4, 4, 4, 4]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
