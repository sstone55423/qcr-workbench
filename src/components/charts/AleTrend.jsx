import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency, formatCompactCurrency } from '@/lib/qcr/format';
import { AXIS_PROPS, TOOLTIP_STYLE } from '@/components/charts/chartTheme';

// Total deterministic ALE at each snapshot, oldest first.
export default function AleTrend({ snapshots }) {
  const data = useMemo(
    () => snapshots.map((s) => ({
      date: new Date(s.taken_at).toLocaleDateString(),
      total: s.total_ale,
    })),
    [snapshots],
  );
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="date" {...AXIS_PROPS} />
        <YAxis tickFormatter={formatCompactCurrency} domain={[0, 'auto']} {...AXIS_PROPS} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [formatCurrency(value), null]} />
        <Line type="monotone" dataKey="total" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
