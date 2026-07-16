import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProject } from '@/lib/ProjectContext';
import { useI18n } from '@/lib/I18nContext';
import useScenarios from '@/hooks/useScenarios';
import { portfolioAle, simulatePortfolio } from '@/lib/qcr/portfolio';
import { ITERATION_CHOICES, DEFAULT_ITERATIONS, DEFAULT_SEED } from '@/lib/qcr/simulation';
import { formatCurrency, formatPercent } from '@/lib/qcr/format';
import NoProject from '@/components/NoProject';
import MetricCardRow from '@/components/workbench/MetricCardRow';
import ChartCard from '@/components/charts/ChartCard';
import ScenarioAleBars from '@/components/charts/ScenarioAleBars';
import ExceedanceCurveChart from '@/components/charts/ExceedanceCurve';
import ToleranceStatus from '@/components/workbench/ToleranceStatus';
import ToleranceEditor from '@/components/portfolio/ToleranceEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ChartPie, Play, Loader2, Info } from 'lucide-react';

// Project-level portfolio view: scenarios ranked by deterministic ALE, an
// aggregate Monte Carlo loss distribution, and the risk-tolerance check.
// Portfolio results are recomputed on demand and never persisted, so they
// can't go stale when a scenario changes.
export default function Portfolio() {
  const { currentProject, refreshProject } = useProject();
  const { scenarios, loading } = useScenarios(currentProject?.id);
  const { t } = useI18n();
  const { toast } = useToast();
  const [iterations, setIterations] = useState(DEFAULT_ITERATIONS);
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  // Scenario edits invalidate an in-memory portfolio run.
  useEffect(() => { setResult(null); }, [scenarios]);

  if (!currentProject) return <NoProject />;

  const { total, rows } = portfolioAle(scenarios);
  const tolerance = currentProject.tolerance || null;

  const handleRun = async () => {
    setRunning(true);
    // Yield a frame so the spinner paints before the synchronous simulation.
    await new Promise((resolve) => setTimeout(resolve, 30));
    try {
      setResult(simulatePortfolio(scenarios, iterations, seed));
    } catch (err) {
      toast({ title: t('simulation.runFailed'), description: err.message, variant: 'destructive' });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight">{t('portfolio.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('portfolio.subtitle', { project: currentProject.name })}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : scenarios.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-border rounded-xl">
          <ChartPie className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground text-sm mb-6">{t('portfolio.empty')}</p>
          <Button asChild><Link to="/scenarios">{t('portfolio.goScenarios')}</Link></Button>
        </div>
      ) : (
        <>
          <MetricCardRow
            items={[
              { label: t('portfolio.totalAle'), value: formatCurrency(total) },
              { label: t('portfolio.scenarioCount'), value: String(rows.length) },
              {
                label: t('portfolio.topRisk'),
                value: rows[0].name,
                hint: t('portfolio.shareOfTotal', { share: formatPercent(rows[0].share, 0) }),
              },
            ]}
          />

          <ChartCard title={t('portfolio.aleChartTitle')} subtitle={t('portfolio.aleChartSubtitle')}>
            <ScenarioAleBars rows={rows} />
          </ChartCard>

          <ToleranceEditor project={currentProject} onSaved={refreshProject} />

          <div className="border border-border rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-1">{t('portfolio.simTitle')}</h3>
              <p className="text-xs text-muted-foreground">{t('portfolio.simSubtitle')}</p>
            </div>
            <div className="flex flex-wrap items-end gap-4">
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
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" /> {t('portfolio.independenceNote')}
            </p>

            {result && (
              <>
                <MetricCardRow
                  items={[
                    { label: t('simulation.mean'), value: formatCurrency(result.summary.mean) },
                    { label: t('simulation.median'), value: formatCurrency(result.summary.median) },
                    { label: t('simulation.p95'), value: formatCurrency(result.summary.percentile_95) },
                    { label: t('simulation.zeroLoss'), value: formatPercent(result.summary.probability_of_zero_loss) },
                  ]}
                />
                <ChartCard title={t('portfolio.exceedanceTitle')} subtitle={t('portfolio.exceedanceSubtitle')}>
                  <ExceedanceCurveChart exceedance={result.exceedance} tolerance={tolerance} />
                </ChartCard>
                <ToleranceStatus exceedance={result.exceedance} tolerance={tolerance} />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
