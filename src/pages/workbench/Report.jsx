import React, { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useI18n } from '@/lib/I18nContext';
import { useProject } from '@/lib/ProjectContext';
import useTreatments from '@/hooks/useTreatments';
import { expectedLoss } from '@/lib/qcr/fair';
import { compareTreatment } from '@/lib/qcr/treatments';
import { executiveSummary } from '@/lib/qcr/reporting';
import { downloadText } from '@/lib/download';
import { logAudit } from '@/lib/auditLog';
import ChartCard from '@/components/charts/ChartCard';
import LossMeasuresBar from '@/components/charts/LossMeasuresBar';
import AINarrativePanel from '@/components/workbench/AINarrativePanel';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Info } from 'lucide-react';

// Step 7 — executive report (port of v0 page 07): the markdown report
// rendered alongside the annual-loss-measures chart, downloadable as .md.
export default function Report() {
  const { scenario, reload } = /** @type {{scenario: any, reload: () => void}} */ (useOutletContext());
  const { treatments } = useTreatments(scenario.id);
  const { currentProject } = useProject();
  const { t } = useI18n();
  const [treatmentId, setTreatmentId] = useState('best');

  const expected = expectedLoss(scenario.fair);
  const simulation = scenario.simulation?.summary || null;

  const compared = treatments.map((x) => ({ treatment: x, comparison: compareTreatment(scenario.fair, x) }));
  const best = compared.length
    ? compared.reduce((a, b) => (b.comparison.netBenefit > a.comparison.netBenefit ? b : a))
    : null;
  const selected = treatmentId === 'none' ? null
    : treatmentId === 'best' ? best
    : compared.find((x) => x.treatment.id === treatmentId) || best;

  const markdown = executiveSummary(scenario, expected, simulation, selected?.comparison || null, scenario.ai_narrative);

  const handleDownload = () => {
    downloadText(`${scenario.sample_id || scenario.id}-risk-report.md`, markdown, 'text/markdown');
    logAudit(currentProject?.id || scenario.project_id, 'report', `Downloaded executive report for "${scenario.name}"`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-muted-foreground">{t('report.intro')}</p>
        <div className="flex gap-2 items-center">
          {treatments.length > 0 && (
            <Select value={treatmentId} onValueChange={setTreatmentId}>
              <SelectTrigger className="w-56 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="best">{t('report.treatmentBest')}</SelectItem>
                <SelectItem value="none">{t('report.treatmentNone')}</SelectItem>
                {treatments.map((x) => (
                  <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={handleDownload} className="gap-2">
            <Download className="w-4 h-4" /> {t('report.download')}
          </Button>
        </div>
      </div>

      {!simulation && (
        <div className="border border-border bg-muted/40 rounded-xl p-4 flex gap-3 text-sm">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-muted-foreground">
            {t('report.noSimulation')}{' '}
            <Link to={`/scenarios/${scenario.id}/simulation`} className="text-primary hover:underline">
              {t('report.goSimulate')}
            </Link>
          </p>
        </div>
      )}

      <div className={`grid gap-6 ${simulation ? 'lg:grid-cols-2' : ''}`}>
        <div className="border border-border rounded-xl p-6 prose prose-sm dark:prose-invert max-w-none
          [&_h1]:text-xl [&_h1]:font-heading [&_h1]:font-bold [&_h1]:mb-3
          [&_h2]:text-base [&_h2]:font-heading [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2
          [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1.5
          [&_p]:text-sm [&_p]:leading-relaxed [&_p]:my-2
          [&_li]:text-sm [&_ul]:my-2 [&_ul]:pl-5 [&_ul]:list-disc
          [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground
          [&_table]:w-full [&_table]:text-xs [&_table]:my-3
          [&_th]:text-left [&_th]:border-b [&_th]:border-border [&_th]:px-2 [&_th]:py-1.5
          [&_td]:border-b [&_td]:border-border/50 [&_td]:px-2 [&_td]:py-1.5
          [&_em]:text-muted-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </div>
        {simulation && (
          <div className="space-y-4">
            <ChartCard title={t('report.chartTitle')} subtitle={t('report.chartSubtitle')}>
              <LossMeasuresBar expected={expected} simulation={simulation} />
            </ChartCard>
            <AINarrativePanel scenario={scenario} expected={expected} simulation={simulation} comparison={selected?.comparison || null} reload={reload} />
          </div>
        )}
      </div>
      {!simulation && (
        <AINarrativePanel scenario={scenario} expected={expected} simulation={null} comparison={selected?.comparison || null} reload={reload} />
      )}
    </div>
  );
}
