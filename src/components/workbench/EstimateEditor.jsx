import React, { useState } from 'react';
import { useI18n } from '@/lib/I18nContext';
import { ciToEstimate } from '@/lib/qcr/calibration';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import InfoTip from '@/components/InfoTip';
import { Target } from 'lucide-react';

// Three number inputs (min / most likely / max) for one FAIR factor —
// the React equivalent of v0's edit_estimate helper — plus a calibrated-
// estimator entry mode: a 90% confidence interval that fills the three
// points so the distribution's 5th–95th percentile range matches.
export default function EstimateEditor({ labelKey, helpKey, estimate, onChange }) {
  const { t } = useI18n();
  const [ciOpen, setCiOpen] = useState(false);
  const [ciLower, setCiLower] = useState('');
  const [ciUpper, setCiUpper] = useState('');
  const [ciError, setCiError] = useState(false);

  const set = (field) => (e) => {
    const value = e.target.value === '' ? '' : Number(e.target.value);
    onChange({ ...estimate, [field]: value });
  };

  const applyCi = () => {
    const filled = ciToEstimate(Number(ciLower), Number(ciUpper));
    if (!filled) {
      setCiError(true);
      return;
    }
    setCiError(false);
    onChange({ ...estimate, ...filled });
    setCiOpen(false);
  };

  const ordered =
    typeof estimate.minimum === 'number' && typeof estimate.most_likely === 'number' &&
    typeof estimate.maximum === 'number' &&
    estimate.minimum >= 0 && estimate.minimum <= estimate.most_likely && estimate.most_likely <= estimate.maximum;

  return (
    <div className="border border-border rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          {t(labelKey)}
          {helpKey && <InfoTip text={t(helpKey)} className="self-center" />}
        </h4>
        {estimate.unit && <span className="text-xs text-muted-foreground">{estimate.unit}</span>}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          ['minimum', 'assumptions.minimum'],
          ['most_likely', 'assumptions.mostLikely'],
          ['maximum', 'assumptions.maximum'],
        ].map(([field, key]) => (
          <div key={field}>
            <label className="text-xs text-muted-foreground mb-1 block">{t(key)}</label>
            <Input
              type="number"
              min="0"
              step="any"
              value={estimate[field]}
              onChange={set(field)}
              className="tabular-nums"
            />
          </div>
        ))}
      </div>
      {!ordered && (
        <p className="text-xs text-destructive mt-2">{t('assumptions.orderError')}</p>
      )}
      <div className="mt-3">
        <label className="text-xs text-muted-foreground mb-1 block">{t('assumptions.rationaleLabel')}</label>
        <Input
          value={estimate.rationale || ''}
          onChange={(e) => onChange({ ...estimate, rationale: e.target.value })}
          placeholder={t('assumptions.rationalePlaceholder')}
        />
      </div>
      {!ciOpen ? (
        <div className="mt-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCiOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <Target className="w-3.5 h-3.5" /> {t('assumptions.ciToggle')}
          </button>
          <InfoTip text={t('assumptions.ciTooltip')} />
        </div>
      ) : (
        <div className="mt-3 border-t border-border pt-3 space-y-2">
          <p className="text-xs text-muted-foreground">{t('assumptions.ciHint')}</p>
          <div className="flex items-end gap-2 flex-wrap">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('assumptions.ciLower')}</label>
              <Input type="number" min="0" step="any" className="w-32 tabular-nums" value={ciLower} onChange={(e) => setCiLower(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('assumptions.ciUpper')}</label>
              <Input type="number" min="0" step="any" className="w-32 tabular-nums" value={ciUpper} onChange={(e) => setCiUpper(e.target.value)} />
            </div>
            <Button variant="outline" size="sm" onClick={applyCi} className="text-xs">
              {t('assumptions.ciApply')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setCiOpen(false); setCiError(false); }} className="text-xs">
              {t('common.cancel')}
            </Button>
          </div>
          {ciError && <p className="text-xs text-destructive">{t('assumptions.ciError')}</p>}
        </div>
      )}
    </div>
  );
}
