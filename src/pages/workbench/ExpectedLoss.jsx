import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useI18n } from '@/lib/I18nContext';
import { expectedLoss } from '@/lib/qcr/fair';
import { sensitivityRows } from '@/lib/qcr/sensitivity';
import { formatCurrency, formatPercent } from '@/lib/qcr/format';
import MetricCardRow from '@/components/workbench/MetricCardRow';
import ChartCard from '@/components/charts/ChartCard';
import TornadoChart from '@/components/charts/TornadoChart';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

// Step 4 — deterministic expected loss: metric cards plus the calculation
// trace with actual numbers substituted (port of v0 page 04).
export default function ExpectedLoss() {
  const { scenario } = /** @type {{scenario: any, reload: () => void}} */ (useOutletContext());
  const { t } = useI18n();
  const e = expectedLoss(scenario.fair);
  const sensitivity = sensitivityRows(scenario.fair);

  const trace = [
    `LEF  = TEF × Vulnerability = ${e.tef.toFixed(2)} × ${e.vulnerability.toFixed(2)} = ${e.lef.toFixed(2)}`,
    `LM   = Primary + Secondary × P(Secondary) = ${formatCurrency(e.primaryLoss)} + ${formatCurrency(e.expectedSecondaryLoss)} = ${formatCurrency(e.lossMagnitude)}`,
    `ALE  = LEF × LM = ${e.lef.toFixed(2)} × ${formatCurrency(e.lossMagnitude)} = ${formatCurrency(e.ale)}`,
  ].join('\n');

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t('expectedLoss.intro')}</p>

      <MetricCardRow
        items={[
          { label: t('expectedLoss.tef'), value: e.tef.toFixed(2), hint: t('expectedLoss.tefHint') },
          { label: t('expectedLoss.vulnerability'), value: formatPercent(e.vulnerability), hint: t('expectedLoss.vulnerabilityHint') },
          { label: t('expectedLoss.lef'), value: e.lef.toFixed(2), hint: t('expectedLoss.lefHint') },
          { label: t('expectedLoss.ale'), value: formatCurrency(e.ale), hint: t('expectedLoss.aleHint') },
        ]}
      />

      <div className="border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium mb-3">{t('expectedLoss.traceTitle')}</h3>
        <pre className="text-xs bg-muted rounded-md px-4 py-3 overflow-x-auto leading-relaxed">{trace}</pre>
      </div>

      <ChartCard title={t('sensitivity.title')} subtitle={t('sensitivity.subtitle')}>
        <TornadoChart baseline={sensitivity.baseline} rows={sensitivity.rows} />
        <p className="text-xs text-muted-foreground mt-2">
          {t('sensitivity.baselineLabel', { value: formatCurrency(sensitivity.baseline) })}
        </p>
      </ChartCard>

      <div className="flex justify-end">
        <Button asChild className="gap-2">
          <Link to={`/scenarios/${scenario.id}/simulation`}>
            {t('expectedLoss.next')} <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
