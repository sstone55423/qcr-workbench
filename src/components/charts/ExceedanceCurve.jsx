import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { formatCompactCurrency, formatPercent } from '@/lib/qcr/format';
import { AXIS_PROPS, TOOLTIP_STYLE } from '@/components/charts/chartTheme';

// Loss exceedance curve from persisted {thresholds, probabilities}. When the
// project defines a risk tolerance, dashed reference lines mark the tolerated
// loss (vertical) and the acceptable exceedance probability (horizontal) —
// the curve should pass below/left of their crossing to be within appetite.
export default function ExceedanceCurve({ exceedance, tolerance = null }) {
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
        <XAxis dataKey="threshold" type="number" domain={[0, 'dataMax']} tickFormatter={formatCompactCurrency} {...AXIS_PROPS} />
        <YAxis tickFormatter={(v) => formatPercent(v, 0)} domain={[0, 1]} {...AXIS_PROPS} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value) => [formatPercent(value), null]}
          labelFormatter={(threshold) => `> ${formatCompactCurrency(threshold)}`}
        />
        {tolerance?.threshold > 0 && (
          <ReferenceLine
            x={tolerance.threshold}
            stroke="hsl(var(--destructive))"
            strokeDasharray="6 4"
            label={{ value: formatCompactCurrency(tolerance.threshold), fill: 'hsl(var(--destructive))', fontSize: 11, position: 'insideTopRight' }}
          />
        )}
        {tolerance?.threshold > 0 && (
          <ReferenceLine
            y={tolerance.probability}
            stroke="hsl(var(--destructive))"
            strokeDasharray="6 4"
            label={{ value: formatPercent(tolerance.probability, 0), fill: 'hsl(var(--destructive))', fontSize: 11, position: 'insideBottomRight' }}
          />
        )}
        <Line type="monotone" dataKey="probability" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
