import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { useI18n } from '@/lib/I18nContext';
import { Progress } from '@/components/ui/progress';

export const WORKFLOW_STEPS = [
  { path: 'scoping', labelKey: 'stepper.scoping' },
  { path: 'fair', labelKey: 'stepper.fair' },
  { path: 'assumptions', labelKey: 'stepper.assumptions' },
  { path: 'expected-loss', labelKey: 'stepper.expectedLoss' },
  { path: 'simulation', labelKey: 'stepper.simulation' },
  { path: 'treatments', labelKey: 'stepper.treatments' },
  { path: 'report', labelKey: 'stepper.report' },
];

// The 7-step guided flow indicator — the React equivalent of v0's sidebar
// progress bar plus page links.
export default function WorkflowStepper({ activeStep }) {
  const { scenarioId } = useParams();
  const { t } = useI18n();
  const stepIndex = WORKFLOW_STEPS.findIndex((s) => s.path === activeStep);

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-1 mb-2">
        {WORKFLOW_STEPS.map((step, i) => (
          <NavLink
            key={step.path}
            to={`/scenarios/${scenarioId}/${step.path}`}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`
            }
          >
            <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center shrink-0 ${
              i <= stepIndex ? 'bg-primary-foreground/20' : 'bg-muted'
            }`}>{i + 1}</span>
            <span className="hidden md:inline">{t(step.labelKey)}</span>
          </NavLink>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Progress value={((stepIndex + 1) / WORKFLOW_STEPS.length) * 100} className="h-1.5 flex-1" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {t('stepper.stepOf', { n: stepIndex + 1, total: WORKFLOW_STEPS.length })}
        </span>
      </div>
    </div>
  );
}
