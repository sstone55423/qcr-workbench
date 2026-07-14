import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useI18n } from '@/lib/I18nContext';
import { expectedLoss, decompositionRows } from '@/lib/qcr/fair';
import { formatCurrency } from '@/lib/qcr/format';
import { FAIR_INSTITUTE_URL } from '@/lib/citation';
import { Button } from '@/components/ui/button';
import { ArrowRight, Repeat, Banknote, ExternalLink } from 'lucide-react';

// Step 2 — FAIR decomposition: frequency and magnitude sides of the model
// plus the five-factor estimate table (port of v0 page 02).
export default function FairDecomposition() {
  const { scenario } = /** @type {{scenario: any, reload: () => void}} */ (useOutletContext());
  const { t } = useI18n();
  const expected = expectedLoss(scenario.fair);
  const rows = decompositionRows(scenario.fair);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t('fair.intro')}</p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="border border-border rounded-xl p-5 bg-card">
          <div className="flex items-center gap-2 text-sm font-medium mb-3">
            <Repeat className="w-4 h-4 text-primary" /> {t('fair.frequencyTitle')}
          </div>
          <p className="text-3xl font-heading font-bold tracking-tight mb-1">{expected.lef.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mb-3">{t('fair.lefLabel')}</p>
          <code className="text-xs text-muted-foreground block bg-muted rounded-md px-3 py-2">
            {t('fair.lefFormula')}
          </code>
        </div>
        <div className="border border-border rounded-xl p-5 bg-card">
          <div className="flex items-center gap-2 text-sm font-medium mb-3">
            <Banknote className="w-4 h-4 text-primary" /> {t('fair.magnitudeTitle')}
          </div>
          <p className="text-3xl font-heading font-bold tracking-tight mb-1">{formatCurrency(expected.lossMagnitude)}</p>
          <p className="text-xs text-muted-foreground mb-3">{t('fair.magnitudeLabel')}</p>
          <code className="text-xs text-muted-foreground block bg-muted rounded-md px-3 py-2">
            {t('fair.magnitudeFormula')}
          </code>
        </div>
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">{t('fair.colFactor')}</th>
              <th className="px-4 py-2.5 font-medium text-right">{t('fair.colMinimum')}</th>
              <th className="px-4 py-2.5 font-medium text-right">{t('fair.colMostLikely')}</th>
              <th className="px-4 py-2.5 font-medium text-right">{t('fair.colMaximum')}</th>
              <th className="px-4 py-2.5 font-medium">{t('fair.colUnit')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.labelKey}>
                <td className="px-4 py-2.5 font-medium">{t(row.labelKey)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{row.estimate.minimum.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{row.estimate.most_likely.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{row.estimate.maximum.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{row.estimate.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-xs text-muted-foreground">
          {t('fair.attribution')}{' '}
          <a
            href={FAIR_INSTITUTE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            {t('fair.attributionLink')} <ExternalLink className="w-3 h-3" />
          </a>
        </p>
        <Button asChild className="gap-2">
          <Link to={`/scenarios/${scenario.id}/assumptions`}>
            {t('fair.next')} <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
