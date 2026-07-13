import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCompactCurrency } from '@/lib/qcr/format';
import { AXIS_PROPS, TOOLTIP_STYLE } from '@/components/charts/chartTheme';

// Annual loss distribution from persisted histogram bins {binWidth, counts}.
export default function LossHistogram({ histogram }) {
  const data = useMemo(
    () => histogram.counts.map((count, i) => ({
      loss: (i + 0.5) * histogram.binWidth,
      count,
    })),
    [histogram],
  );
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barCategoryGap={0}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="loss" tickFormatter={formatCompactCurrency} {...AXIS_PROPS} />
        <YAxis {...AXIS_PROPS} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value) => [value.toLocaleString(), null]}
          labelFormatter={(loss) => `≈ ${formatCompactCurrency(loss)}`}
        />
        <Bar dataKey="count" fill="hsl(var(--chart-1))" />
      </BarChart>
    </ResponsiveContainer>
  );
}
