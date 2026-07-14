import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/I18nContext';
import { resolveAIDescription } from '@/lib/ai';
import { suggestScenarioTreatments } from '@/lib/qcr/aiFeatures';
import { logAudit } from '@/lib/auditLog';
import { formatCurrency, formatPercent } from '@/lib/qcr/format';
import AIDisclosure from '@/components/AIDisclosure';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Sparkles, Loader2, Pencil } from 'lucide-react';

const REDUCTIONS = [
  { key: 'frequency_reduction', labelKey: 'treatments.frequencyReduction' },
  { key: 'vulnerability_reduction', labelKey: 'treatments.vulnerabilityReduction' },
  { key: 'primary_loss_reduction', labelKey: 'treatments.primaryLossReduction' },
  { key: 'secondary_loss_reduction', labelKey: 'treatments.secondaryLossReduction' },
];

// AI-suggested candidate treatments. A suggestion never becomes a treatment
// directly: accepting one opens it pre-filled in the treatment form, where the
// analyst reviews and adjusts the draft cost and reductions before saving
// (human-in-the-loop). The economics are always computed deterministically
// from whatever is saved.
export default function TreatmentSuggestions({ scenario, expected, treatments, onUse }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState([]);
  const [provenance, setProvenance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(null);

  useEffect(() => {
    let stale = false;
    resolveAIDescription().then((d) => { if (!stale) setAiAvailable(d); }).catch(() => { if (!stale) setAiAvailable(null); });
    return () => { stale = true; };
  }, []);

  if (aiAvailable === null && suggestions.length === 0) return null;

  const handleSuggest = async () => {
    setLoading(true);
    try {
      const result = await suggestScenarioTreatments({ scenario, expected, treatments });
      setSuggestions(result.suggestions);
      setProvenance(result.provenance);
      if (result.suggestions.length === 0) toast({ title: t('ai.noSuggestions') });
    } catch (err) {
      toast({ title: t('ai.generateFailed'), description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const use = (i) => {
    const { rationale, ...draft } = suggestions[i];
    logAudit(scenario.project_id, 'ai', 'auditMsg.treatmentSuggested', {
      treatment: draft.name,
      label: provenance?.label || 'AI',
      scenario: scenario.name,
    });
    onUse(draft);
    setSuggestions((list) => list.filter((_, j) => j !== i));
  };

  return (
    <div className="border border-border rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> {t('ai.treatmentsHint')}
        </span>
        <Button variant="ghost" size="sm" onClick={handleSuggest} disabled={loading} className="gap-1.5 text-xs">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {loading ? t('ai.generating') : t('ai.suggestTreatments')}
        </Button>
      </div>
      {suggestions.length > 0 && (
        <>
          <AIDisclosure />
          <ul className="space-y-2">
            {suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm border border-border rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.rationale}</p>
                  <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">
                    {t('treatments.cardCost', { cost: formatCurrency(s.annual_cost) })}
                    {REDUCTIONS.map(({ key, labelKey }) => (
                      <span key={key}> · {t(labelKey)} −{formatPercent(s[key], 0)}</span>
                    ))}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="gap-1 shrink-0 text-xs" onClick={() => use(i)}>
                  <Pencil className="w-3 h-3" /> {t('ai.reviewAdd')}
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
