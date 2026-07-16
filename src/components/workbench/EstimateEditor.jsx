import React from 'react';
import { useI18n } from '@/lib/I18nContext';
import { Input } from '@/components/ui/input';

// Three number inputs (min / most likely / max) for one FAIR factor —
// the React equivalent of v0's edit_estimate helper.
export default function EstimateEditor({ labelKey, estimate, onChange }) {
  const { t } = useI18n();

  const set = (field) => (e) => {
    const value = e.target.value === '' ? '' : Number(e.target.value);
    onChange({ ...estimate, [field]: value });
  };

  const ordered =
    typeof estimate.minimum === 'number' && typeof estimate.most_likely === 'number' &&
    typeof estimate.maximum === 'number' &&
    estimate.minimum >= 0 && estimate.minimum <= estimate.most_likely && estimate.most_likely <= estimate.maximum;

  return (
    <div className="border border-border rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h4 className="text-sm font-medium">{t(labelKey)}</h4>
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
    </div>
  );
}
