import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCompactCurrency, formatPercent } from '@/lib/qcr/format';
import { AXIS_PROPS, TOOLTIP_STYLE } from '@/components/charts/chartTheme';

// Loss exceedance curve from persisted {thresholds, probabilities}.
export default function ExceedanceCurve({ exceedance }) {
  const data = useMemo(
    () => exceedance.thresholds.map((threshold, i) => ({
      threshold,
      probability: exceedance.probabilities[i],
    })),
    [exceedance],
  );
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="threshold" tickFormatter={formatCompactCurrency} {...AXIS_PROPS} />
        <YAxis tickFormatter={(v) => formatPercent(v, 0)} domain={[0, 1]} {...AXIS_PROPS} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value) => [formatPercent(value), null]}
          labelFormatter={(threshold) => `> ${formatCompactCurrency(threshold)}`}
        />
        <Line type="monotone" dataKey="probability" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
