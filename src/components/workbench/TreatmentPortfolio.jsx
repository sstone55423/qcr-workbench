import React, { useState, useMemo } from 'react';
import { useI18n } from '@/lib/I18nContext';
import { compareTreatmentSet, optimizeTreatments } from '@/lib/qcr/treatments';
import { formatCurrency, formatPercent } from '@/lib/qcr/format';
import MetricCardRow from '@/components/workbench/MetricCardRow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Layers, Wand2 } from 'lucide-react';

// Combined economics for a SELECTED SET of treatments plus a budget optimizer.
// Selection and results live only in memory — like individual treatment
// results, combined economics are recomputed from the current FAIR model.
export default function TreatmentPortfolio({ scenario, treatments }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState([]);
  const [budget, setBudget] = useState('');

  const selected = useMemo(
    () => treatments.filter((x) => selectedIds.includes(x.id)),
    [treatments, selectedIds],
  );
  const combined = selected.length >= 2 ? compareTreatmentSet(scenario.fair, selected) : null;

  const toggle = (id) => setSelectedIds((ids) =>
    ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);

  const handleOptimize = () => {
    const cap = Number(budget);
    if (!(cap > 0)) return;
    const { best, affordableExists } = optimizeTreatments(scenario.fair, treatments, cap);
    if (!affordableExists) {
      toast({ title: t('tp.noneAffordable'), variant: 'destructive' });
      return;
    }
    if (!best) {
      toast({ title: t('tp.noneBeneficial') });
      return;
    }
    setSelectedIds(best.ids);
    toast({
      title: t('tp.optimized', {
        budget: formatCurrency(cap),
        names: best.treatments.map((x) => x.name).join(' + '),
      }),
    });
  };

  if (treatments.length < 2) return null;

  return (
    <div className="border border-border rounded-xl p-5 space-y-4">
      <div>
        <h3 className="text-sm font-medium flex items-center gap-2 mb-1">
          <Layers className="w-4 h-4 text-primary" /> {t('tp.title')}
        </h3>
        <p className="text-xs text-muted-foreground">{t('tp.desc')}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {treatments.map((treatment) => (
          <label key={treatment.id} className="flex items-center gap-2.5 text-sm border border-border rounded-lg px-3 py-2 cursor-pointer hover:border-primary/30">
            <Checkbox
              checked={selectedIds.includes(treatment.id)}
              onCheckedChange={() => toggle(treatment.id)}
            />
            <span className="flex-1 min-w-0 truncate">{treatment.name}</span>
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">
              {t('treatments.cardCost', { cost: formatCurrency(treatment.annual_cost) })}
            </span>
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">{t('tp.budgetLabel')}</label>
          <Input
            type="number" min="0" step="10000" className="w-44 tabular-nums"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={handleOptimize} disabled={!(Number(budget) > 0)} className="gap-2">
          <Wand2 className="w-4 h-4" /> {t('tp.optimize')}
        </Button>
        <span className="text-xs text-muted-foreground pb-2.5">{t('tp.selected', { count: selectedIds.length })}</span>
      </div>

      {combined ? (
        <>
          <MetricCardRow
            items={[
              { label: t('tp.combinedCost'), value: formatCurrency(combined.annualCost) },
              { label: t('treatments.residualAle'), value: formatCurrency(combined.residualAle) },
              { label: t('treatments.riskReduction'), value: formatCurrency(combined.riskReduction) },
              { label: t('treatments.netBenefit'), value: formatCurrency(combined.netBenefit) },
            ]}
          />
          {combined.returnOnControl !== null && (
            <p className="text-sm text-muted-foreground">
              {t('treatments.roc', { value: formatPercent(combined.returnOnControl, 0) })}
            </p>
          )}
        </>
      ) : (
        <p className="text-xs text-muted-foreground">{t('tp.selectHint')}</p>
      )}
    </div>
  );
}
