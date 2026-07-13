import React from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useI18n } from '@/lib/I18nContext';
import { formatCurrency, formatCompactCurrency } from '@/lib/qcr/format';
import { AXIS_PROPS, TOOLTIP_STYLE } from '@/components/charts/chartTheme';

// Baseline ALE vs residual ALE vs annual treatment cost.
export default function TreatmentComparisonBar({ comparison }) {
  const { t } = useI18n();
  const data = [
    { label: t('treatments.baselineAle'), value: comparison.baselineAle, color: '--chart-1' },
    { label: t('treatments.residualAle'), value: comparison.residualAle, color: '--chart-2' },
    { label: t('treatments.annualCost'), value: comparison.annualCost, color: '--chart-3' },
  ];
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="label" {...AXIS_PROPS} />
        <YAxis tickFormatter={formatCompactCurrency} {...AXIS_PROPS} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [formatCurrency(value), null]} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.label} fill={`hsl(var(${entry.color}))`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
