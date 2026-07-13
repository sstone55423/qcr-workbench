import React from 'react';
import { Outlet, useParams, Link, useLocation } from 'react-router-dom';
import useScenario from '@/hooks/useScenario';
import { useI18n } from '@/lib/I18nContext';
import WorkflowStepper from '@/components/workbench/WorkflowStepper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

// Route shell for /scenarios/:scenarioId/*: loads the scenario once and hands
// {scenario, reload} to the step pages via outlet context. Navigating to a
// different scenario remounts everything, which is exactly v0's "scenario
// switch clears downstream state" rule.
export default function WorkbenchLayout() {
  const { scenarioId } = useParams();
  const { pathname } = useLocation();
  const { scenario, loading, reload } = useScenario(scenarioId);
  const { t } = useI18n();
  const activeStep = pathname.split('/').pop();

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }
  if (!scenario) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <p className="text-muted-foreground mb-4">{t('workbench.notFound')}</p>
        <Button variant="outline" asChild><Link to="/scenarios">{t('workbench.backToScenarios')}</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <Link to="/scenarios" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-1">
            <ArrowLeft className="w-3 h-3" /> {t('workbench.backToScenarios')}
          </Link>
          <h1 className="text-2xl font-heading font-bold tracking-tight truncate">{scenario.name}</h1>
        </div>
        <div className="flex gap-2 shrink-0 mt-5">
          <Badge variant="secondary">{scenario.owner}</Badge>
          {scenario.sample_id && <Badge variant="outline">{t('scenarios.sampleBadge')}</Badge>}
        </div>
      </div>
      <WorkflowStepper activeStep={activeStep} />
      <Outlet context={{ scenario, reload }} />
    </div>
  );
}
