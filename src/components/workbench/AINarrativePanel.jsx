import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useI18n } from '@/lib/I18nContext';
import { resolveAIDescription } from '@/lib/ai';
import { draftExecutiveNarrative, inputsHash } from '@/lib/qcr/aiFeatures';
import { saveAiNarrative } from '@/lib/qcr/scenarioStore';
import AIDisclosure from '@/components/AIDisclosure';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Sparkles, Loader2, AlertTriangle, Copy, Check } from 'lucide-react';

// Generates (and regenerates) the AI-drafted executive narrative, persists it
// on the scenario, and renders it with disclosure + provenance. The narrative
// is a labeled draft — it never alters any computed figure.
export default function AINarrativePanel({ scenario, expected, simulation, comparison, reload }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let stale = false;
    resolveAIDescription().then((d) => { if (!stale) setAiAvailable(d); }).catch(() => { if (!stale) setAiAvailable(null); });
    return () => { stale = true; };
  }, []);

  const narrative = scenario.ai_narrative;
  const isStale = narrative && narrative.inputs_hash !== inputsHash(scenario, scenario.simulation?.params);

  const provenanceLine = narrative && t('ai.provenance', {
    label: narrative.provenance?.label || 'AI',
    model: narrative.provenance?.model || '—',
    date: narrative.provenance?.at ? new Date(narrative.provenance.at).toLocaleString() : '—',
  });

  // Copies the whole narrative with its provenance line, so the AI disclosure
  // travels with the text wherever it is pasted.
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${narrative.text}\n\n— ${provenanceLine}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast({ title: t('ai.copied') });
    } catch {
      toast({ title: t('cite.copyFailed'), variant: 'destructive' });
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const draft = await draftExecutiveNarrative({ scenario, expected, simulation, comparison });
      await saveAiNarrative(scenario, draft);
      reload();
    } catch (err) {
      toast({ title: t('ai.generateFailed'), description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="border border-border rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> {t('ai.narrativeTitle')}
        </h3>
        <div className="flex gap-1.5">
          {narrative && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy} title={t('ai.copy')} aria-label={t('ai.copy')}>
              {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating || aiAvailable === null} className="gap-2">
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {generating ? t('ai.generating') : narrative ? t('ai.regenerate') : t('ai.generate')}
          </Button>
        </div>
      </div>

      {aiAvailable === null && !narrative && (
        <p className="text-xs text-muted-foreground">{t('ai.noProvider')}</p>
      )}
      {aiAvailable && !narrative && (
        <p className="text-xs text-muted-foreground">{t('ai.narrativeEmpty', { provider: aiAvailable.label })}</p>
      )}

      {narrative && (
        <>
          <AIDisclosure />
          {isStale && (
            <div className="flex items-start gap-1.5 text-xs text-destructive">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {t('ai.narrativeStale')}
            </div>
          )}
          <div className="text-sm leading-relaxed [&_p]:my-2 [&_ul]:my-2 [&_ul]:pl-5 [&_ul]:list-disc [&_li]:my-0.5">
            <ReactMarkdown>{narrative.text}</ReactMarkdown>
          </div>
          <p className="text-xs text-muted-foreground">{provenanceLine}</p>
        </>
      )}
    </div>
  );
}
