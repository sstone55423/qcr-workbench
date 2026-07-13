import React from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { useI18n } from '@/lib/I18nContext';
import { formatCurrency, formatCompactCurrency } from '@/lib/qcr/format';
import { AXIS_PROPS, TOOLTIP_STYLE } from '@/components/charts/chartTheme';

const COLORS = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5', '--chart-1'];

// Annual loss measures (ALE, mean, median, p90/p95/p99) with a dashed
// reference line at the 95th percentile — port of the v0 report chart.
export default function LossMeasuresBar({ expected, simulation }) {
  const { t } = useI18n();
  const data = [
    { label: t('report.measureAle'), value: expected.ale },
    { label: t('report.measureMean'), value: simulation.mean },
    { label: t('report.measureMedian'), value: simulation.median },
    { label: 'P90', value: simulation.percentile_90 },
    { label: 'P95', value: simulation.percentile_95 },
    { label: 'P99', value: simulation.percentile_99 },
  ];
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="label" {...AXIS_PROPS} />
        <YAxis tickFormatter={formatCompactCurrency} {...AXIS_PROPS} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [formatCurrency(value), null]} />
        <ReferenceLine
          y={simulation.percentile_95}
          stroke="hsl(var(--destructive))"
          strokeDasharray="6 4"
          label={{ value: 'P95', fill: 'hsl(var(--destructive))', fontSize: 11, position: 'insideTopRight' }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={entry.label} fill={`hsl(var(${COLORS[i]}))`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
