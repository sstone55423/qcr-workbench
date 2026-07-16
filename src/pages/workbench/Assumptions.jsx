import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useI18n } from '@/lib/I18nContext';
import { FAIR_FACTORS } from '@/lib/qcr/models';
import { updateScenarioFair, updateScenarioAssumptions, localizeSample, fairNumbersEqual } from '@/lib/qcr/scenarioStore';
import { findSampleById } from '@/data/sampleLibraries';
import EstimateEditor from '@/components/workbench/EstimateEditor';
import AssumptionSuggestions from '@/components/workbench/AssumptionSuggestions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { ArrowRight, Info, RotateCcw, Save, Plus, X } from 'lucide-react';

const FACTOR_LABELS = {
  threat_event_frequency: 'fair.factorTef',
  vulnerability: 'fair.factorVulnerability',
  primary_loss: 'fair.factorPrimaryLoss',
  secondary_loss: 'fair.factorSecondaryLoss',
  secondary_loss_probability: 'fair.factorSlp',
};

// Step 3 — assumptions: edit the five three-point estimates (invalidates the
// persisted simulation, like v0 page 03) and maintain the scoping-assumption
// text list.
export default function Assumptions() {
  const { scenario, reload } = /** @type {{scenario: any, reload: () => void}} */ (useOutletContext());
  const { t } = useI18n();
  const { toast } = useToast();
  const [fair, setFair] = useState(() => structuredClone(scenario.fair));
  const [assumptions, setAssumptions] = useState(() => [...(scenario.assumptions || [])]);
  const [newAssumption, setNewAssumption] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFair(structuredClone(scenario.fair));
    setAssumptions([...(scenario.assumptions || [])]);
  }, [scenario]);

  const fairDirty = JSON.stringify(fair) !== JSON.stringify(scenario.fair);
  const listDirty = JSON.stringify(assumptions) !== JSON.stringify(scenario.assumptions || []);
  const sample = scenario.sample_id ? findSampleById(scenario.sample_id) : null;

  const handleApply = async () => {
    setSaving(true);
    try {
      const numbersDirty = fairDirty && !fairNumbersEqual(fair, scenario.fair);
      if (fairDirty) await updateScenarioFair(scenario, fair);
      if (listDirty) await updateScenarioAssumptions(scenario, assumptions);
      toast({
        title: t('assumptions.appliedToast'),
        description: numbersDirty ? t('assumptions.invalidatedToast') : undefined,
      });
      reload();
    } catch (err) {
      toast({ title: t('assumptions.applyFailed'), description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!sample) return;
    const localized = localizeSample(sample, t);
    setFair(structuredClone(localized.fair));
    setAssumptions([...localized.assumptions]);
  };

  const addAssumption = () => {
    const text = newAssumption.trim();
    if (!text) return;
    setAssumptions((list) => [...list, text]);
    setNewAssumption('');
  };

  return (
    <div className="space-y-6">
      <div className="border border-border bg-muted/40 rounded-xl p-4 flex gap-3 text-sm">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-muted-foreground">{t('assumptions.guidance')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {FAIR_FACTORS.map((factor) => (
          <EstimateEditor
            key={factor}
            labelKey={FACTOR_LABELS[factor]}
            estimate={fair[factor]}
            onChange={(next) => setFair((f) => ({ ...f, [factor]: next }))}
          />
        ))}
      </div>

      <div className="border border-border rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-medium">{t('assumptions.listTitle')}</h3>
        {assumptions.length === 0 && (
          <p className="text-xs text-muted-foreground">{t('assumptions.listEmpty')}</p>
        )}
        <ul className="space-y-2">
          {assumptions.map((a, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="flex-1">{a}</span>
              <Button
                variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground"
                onClick={() => setAssumptions((list) => list.filter((_, j) => j !== i))}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Input
            value={newAssumption}
            onChange={(e) => setNewAssumption(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addAssumption(); }}
            placeholder={t('assumptions.addPlaceholder')}
          />
          <Button variant="outline" onClick={addAssumption} disabled={!newAssumption.trim()} className="gap-1.5 shrink-0">
            <Plus className="w-3.5 h-3.5" /> {t('common.add')}
          </Button>
        </div>
        <AssumptionSuggestions
          scenario={scenario}
          onAccept={(text) => setAssumptions((list) => [...list, text])}
        />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <Button onClick={handleApply} disabled={saving || (!fairDirty && !listDirty)} className="gap-2">
            <Save className="w-4 h-4" /> {saving ? t('common.saving') : t('assumptions.apply')}
          </Button>
          {sample && (
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" /> {t('assumptions.reset')}
            </Button>
          )}
        </div>
        <Button variant="outline" asChild className="gap-2">
          <Link to={`/scenarios/${scenario.id}/expected-loss`}>
            {t('assumptions.next')} <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
