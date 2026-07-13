import React, { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useI18n } from '@/lib/I18nContext';
import useTreatments from '@/hooks/useTreatments';
import { compareTreatment } from '@/lib/qcr/treatments';
import { createTreatment, updateTreatment, deleteTreatment } from '@/lib/qcr/scenarioStore';
import { formatCurrency, formatPercent } from '@/lib/qcr/format';
import MetricCardRow from '@/components/workbench/MetricCardRow';
import TreatmentForm from '@/components/workbench/TreatmentForm';
import ChartCard from '@/components/charts/ChartCard';
import TreatmentComparisonBar from '@/components/charts/TreatmentComparisonBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ArrowRight, Plus, Trash2, Pencil, Shield, Loader2 } from 'lucide-react';

// Step 6 — treatment comparison (port of v0 page 06, upgraded to a persisted
// list). Economics are recomputed from the CURRENT FAIR model on every render,
// so a treatment can never show stale numbers.
export default function Treatments() {
  const { scenario } = /** @type {{scenario: any, reload: () => void}} */ (useOutletContext());
  const { treatments, loading, reload } = useTreatments(scenario.id);
  const { t } = useI18n();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);

  const selected = treatments.find((x) => x.id === selectedId) || treatments[0] || null;
  const comparison = selected ? compareTreatment(scenario.fair, selected) : null;

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      const created = await createTreatment(scenario, form);
      setShowCreate(false);
      setSelectedId(created.id);
      reload();
    } catch (err) {
      toast({ title: t('treatments.saveFailed'), description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (form) => {
    setSaving(true);
    try {
      const { id, created_date, updated_date, ...patch } = form;
      await updateTreatment(scenario, editTarget.id, patch);
      setEditTarget(null);
      reload();
    } catch (err) {
      toast({ title: t('treatments.saveFailed'), description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (treatment) => {
    try {
      await deleteTreatment(scenario, treatment);
      if (selectedId === treatment.id) setSelectedId(null);
      reload();
    } catch (err) {
      toast({ title: t('treatments.deleteFailed'), description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground">{t('treatments.intro')}</p>
        <Button onClick={() => setShowCreate(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> {t('treatments.newTreatment')}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : treatments.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
          <Shield className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground text-sm mb-4">{t('treatments.emptyDesc')}</p>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" /> {t('treatments.newTreatment')}
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {treatments.map((treatment) => {
              const c = compareTreatment(scenario.fair, treatment);
              const active = selected?.id === treatment.id;
              return (
                <div
                  key={treatment.id}
                  className={`group border rounded-xl p-4 cursor-pointer transition-all ${
                    active ? 'border-primary shadow-xs' : 'border-border hover:border-primary/30'
                  }`}
                  onClick={() => setSelectedId(treatment.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium leading-snug">{treatment.name}</h4>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setEditTarget(treatment); }}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(treatment); }}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {t('treatments.cardCost', { cost: formatCurrency(treatment.annual_cost) })}
                  </p>
                  <Badge className="text-xs" variant={c.netBenefit >= 0 ? 'secondary' : 'destructive'}>
                    {t('treatments.cardNet', { value: formatCurrency(c.netBenefit) })}
                  </Badge>
                </div>
              );
            })}
          </div>

          {comparison && (
            <>
              <MetricCardRow
                items={[
                  { label: t('treatments.baselineAle'), value: formatCurrency(comparison.baselineAle) },
                  { label: t('treatments.residualAle'), value: formatCurrency(comparison.residualAle) },
                  { label: t('treatments.riskReduction'), value: formatCurrency(comparison.riskReduction) },
                  { label: t('treatments.netBenefit'), value: formatCurrency(comparison.netBenefit) },
                ]}
              />
              <ChartCard title={t('treatments.chartTitle', { name: selected.name })}>
                <TreatmentComparisonBar comparison={comparison} />
              </ChartCard>
              {comparison.returnOnControl !== null && (
                <p className="text-sm text-muted-foreground">
                  {t('treatments.roc', { value: formatPercent(comparison.returnOnControl, 0) })}
                </p>
              )}
            </>
          )}
        </>
      )}

      <div className="flex justify-end">
        <Button asChild className="gap-2">
          <Link to={`/scenarios/${scenario.id}/report`}>
            {t('treatments.next')} <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      <TreatmentForm open={showCreate} treatment={null} onClose={() => setShowCreate(false)} onSubmit={handleCreate} saving={saving} />
      <TreatmentForm open={!!editTarget} treatment={editTarget} onClose={() => setEditTarget(null)} onSubmit={handleEdit} saving={saving} />
    </div>
  );
}
