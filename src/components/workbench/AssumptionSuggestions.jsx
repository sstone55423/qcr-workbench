import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/I18nContext';
import { resolveAIDescription } from '@/lib/ai';
import { suggestScenarioAssumptions } from '@/lib/qcr/aiFeatures';
import AIDisclosure from '@/components/AIDisclosure';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Sparkles, Loader2, Plus } from 'lucide-react';

// AI-suggested scoping assumptions. Suggestions are staged here and enter the
// scenario ONLY when the user accepts them individually (human-in-the-loop).
export default function AssumptionSuggestions({ scenario, onAccept }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState([]);
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
      const result = await suggestScenarioAssumptions({ scenario });
      setSuggestions(result.suggestions);
      if (result.suggestions.length === 0) toast({ title: t('ai.noSuggestions') });
    } catch (err) {
      toast({ title: t('ai.generateFailed'), description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const accept = (i) => {
    onAccept(suggestions[i].text);
    setSuggestions((list) => list.filter((_, j) => j !== i));
  };

  return (
    <div className="pt-2 border-t border-border space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> {t('ai.suggestionsHint')}
        </span>
        <Button variant="ghost" size="sm" onClick={handleSuggest} disabled={loading} className="gap-1.5 text-xs">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {loading ? t('ai.generating') : t('ai.suggest')}
        </Button>
      </div>
      {suggestions.length > 0 && (
        <>
          <AIDisclosure />
          <ul className="space-y-2">
            {suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm border border-border rounded-lg p-2.5">
                <div className="flex-1 min-w-0">
                  <p>{s.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.rationale}</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1 shrink-0 text-xs" onClick={() => accept(i)}>
                  <Plus className="w-3 h-3" /> {t('ai.accept')}
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
