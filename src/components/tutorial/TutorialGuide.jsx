import React, { useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/I18nContext';
import { getTutorialState, setTutorialState, subscribeTutorial, TUTORIAL_STEPS } from '@/lib/tutorial';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, X, ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';

let cached = getTutorialState();
const getSnapshot = () => cached;
const subscribe = (notify) => subscribeTutorial((next) => { cached = next; notify(); });

// Floating, non-modal guided tour. It never blocks the app — the point is to
// use the real UI while the card explains what to do and why.
export default function TutorialGuide() {
  const { t } = useI18n();
  const state = useSyncExternalStore(subscribe, getSnapshot);
  if (!state.active) return null;

  const stepIndex = Math.min(state.step, TUTORIAL_STEPS.length - 1);
  const step = TUTORIAL_STEPS[stepIndex];
  const last = stepIndex === TUTORIAL_STEPS.length - 1;

  const close = () => setTutorialState({ active: false, step: stepIndex });
  const go = (delta) => setTutorialState({ active: true, step: stepIndex + delta });
  const finish = () => setTutorialState({ active: false, step: 0 });

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[22rem] max-w-[calc(100vw-2rem)] border border-border rounded-xl bg-card shadow-lg p-4 space-y-3 print:hidden">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-primary" /> {t('tut.title')}
        </h3>
        <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1" onClick={close} aria-label={t('tut.close')} title={t('tut.close')}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div>
        <p className="text-sm font-medium mb-1">{t(step.titleKey)}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{t(step.bodyKey)}</p>
        {step.to && (
          <Link to={step.to} className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
            {t('tut.go')} <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Progress value={((stepIndex + 1) / TUTORIAL_STEPS.length) * 100} className="h-1.5 flex-1" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {t('stepper.stepOf', { n: stepIndex + 1, total: TUTORIAL_STEPS.length })}
        </span>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={() => go(-1)} disabled={stepIndex === 0} className="gap-1.5 text-xs">
          <ArrowLeft className="w-3.5 h-3.5" /> {t('tut.back')}
        </Button>
        {last ? (
          <Button size="sm" onClick={finish} className="gap-1.5 text-xs">
            {t('tut.finish')}
          </Button>
        ) : (
          <Button size="sm" onClick={() => go(1)} className="gap-1.5 text-xs">
            {t('tut.next')} <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
