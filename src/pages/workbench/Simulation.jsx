import React, { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useI18n } from '@/lib/I18nContext';
import {
  simulateAnnualLoss, exceedanceCurve, histogramBins,
  ITERATION_CHOICES, DEFAULT_ITERATIONS, DEFAULT_SEED,
} from '@/lib/qcr/simulation';
import { saveSimulation } from '@/lib/qcr/scenarioStore';
import { formatCurrency, formatPercent } from '@/lib/qcr/format';
import MetricCardRow from '@/components/workbench/MetricCardRow';
import ChartCard from '@/components/charts/ChartCard';
import LossHistogram from '@/components/charts/LossHistogram';
import ExceedanceCurveChart from '@/components/charts/ExceedanceCurve';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ArrowRight, Play, Loader2, Info } from 'lucide-react';

// Step 5 — Monte Carlo simulation (port of v0 page 05). The summary,
// histogram bins, and exceedance points persist on the scenario; the raw loss
// array stays in memory only (recomputable from {fair, iterations, seed}).
export default function Simulation() {
  const { scenario, reload } = /** @type {{scenario: any, reload: () => void}} */ (useOutletContext());
  const { t } = useI18n();
  const { toast } = useToast();
  const persisted = scenario.simulation;
  const [iterations, setIterations] = useState(persisted?.params?.iterations || DEFAULT_ITERATIONS);
  const [seed, setSeed] = useState(persisted?.params?.seed ?? DEFAULT_SEED);
  const [running, setRunning] = useState(false);

  const handleRun = async () => {
    setRunning(true);
    // Yield a frame so the spinner paints before the synchronous simulation.
    await new Promise((resolve) => setTimeout(resolve, 30));
    try {
      const result = simulateAnnualLoss(scenario.fair, iterations, seed);
      const { annualLosses, ...summary } = result;
      await saveSimulation(
        scenario,
        { iterations, seed },
        summary,
        histogramBins(annualLosses, 60),
        exceedanceCurve(annualLosses, 100),
      );
      reload();
    } catch (err) {
      toast({ title: t('simulation.runFailed'), description: err.message, variant: 'destructive' });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t('simulation.intro')}</p>

      <div className="border border-border rounded-xl p-5 flex flex-wrap items-end gap-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">{t('simulation.iterations')}</label>
          <Select value={String(iterations)} onValueChange={(v) => setIterations(Number(v))}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ITERATION_CHOICES.map((n) => (
                <SelectItem key={n} value={String(n)}>{n.toLocaleString()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">{t('simulation.seed')}</label>
          <Input
            type="number" min="0" step="1" className="w-28 tabular-nums"
            value={seed}
            onChange={(e) => setSeed(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
          />
        </div>
        <Button onClick={handleRun} disabled={running} className="gap-2">
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? t('simulation.running') : t('simulation.run')}
        </Button>
      </div>

      {!persisted ? (
        <div className="border border-border bg-muted/40 rounded-xl p-4 flex gap-3 text-sm">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-muted-foreground">{t('simulation.emptyGuidance')}</p>
        </div>
      ) : (
        <>
          <MetricCardRow
            items={[
              { label: t('simulation.mean'), value: formatCurrency(persisted.summary.mean) },
              { label: t('simulation.median'), value: formatCurrency(persisted.summary.median) },
              { label: t('simulation.p95'), value: formatCurrency(persisted.summary.percentile_95) },
              { label: t('simulation.zeroLoss'), value: formatPercent(persisted.summary.probability_of_zero_loss) },
            ]}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title={t('simulation.histogramTitle')} subtitle={t('simulation.histogramSubtitle')}>
              <LossHistogram histogram={persisted.histogram} />
            </ChartCard>
            <ChartCard title={t('simulation.exceedanceTitle')} subtitle={t('simulation.exceedanceSubtitle')}>
              <ExceedanceCurveChart exceedance={persisted.exceedance} />
            </ChartCard>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('simulation.runStamp', {
              iterations: persisted.params.iterations.toLocaleString(),
              seed: persisted.params.seed,
              date: new Date(persisted.computed_at).toLocaleString(),
            })}
          </p>
        </>
      )}

      <div className="flex justify-end">
        <Button asChild className="gap-2" variant={persisted ? 'default' : 'outline'}>
          <Link to={`/scenarios/${scenario.id}/treatments`}>
            {t('simulation.next')} <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
