import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/I18nContext';
import { formatPercent } from '@/lib/qcr/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';

const REDUCTIONS = [
  { key: 'frequency_reduction', labelKey: 'treatments.frequencyReduction' },
  { key: 'vulnerability_reduction', labelKey: 'treatments.vulnerabilityReduction' },
  { key: 'primary_loss_reduction', labelKey: 'treatments.primaryLossReduction' },
  { key: 'secondary_loss_reduction', labelKey: 'treatments.secondaryLossReduction' },
];

// v0 page 06 defaults
const DEFAULTS = {
  name: '',
  annual_cost: 150000,
  frequency_reduction: 0.15,
  vulnerability_reduction: 0.35,
  primary_loss_reduction: 0.2,
  secondary_loss_reduction: 0.1,
};

// `draft` optionally pre-fills create mode (e.g. an AI-suggested treatment the
// user chose to review); the user still adjusts and explicitly saves it.
export default function TreatmentForm({ open, treatment, draft = null, onClose, onSubmit, saving }) {
  const { t } = useI18n();
  const [form, setForm] = useState(DEFAULTS);

  useEffect(() => {
    if (open) {
      setForm(treatment ? { ...treatment }
        : draft ? { ...DEFAULTS, ...draft }
        : { ...DEFAULTS, name: t('treatments.defaultName') });
    }
  }, [open, treatment, draft, t]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{treatment ? t('treatments.editTitle') : t('treatments.newTitle')}</DialogTitle>
          <DialogDescription>{t('treatments.formDesc')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('treatments.name')}</label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('treatments.annualCost')}</label>
            <Input
              type="number" min="0" step="10000" className="tabular-nums"
              value={form.annual_cost}
              onChange={(e) => setForm((f) => ({ ...f, annual_cost: Math.max(0, Number(e.target.value) || 0) }))}
            />
          </div>
          {REDUCTIONS.map(({ key, labelKey }) => (
            <div key={key}>
              <div className="flex items-baseline justify-between mb-1.5">
                <label className="text-sm font-medium">{t(labelKey)}</label>
                <span className="text-xs text-muted-foreground tabular-nums">{formatPercent(form[key] || 0, 0)}</span>
              </div>
              <Slider
                value={[Math.round((form[key] || 0) * 100)]}
                min={0} max={100} step={1}
                onValueChange={([v]) => setForm((f) => ({ ...f, [key]: v / 100 }))}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={() => onSubmit(form)} disabled={!form.name?.trim() || saving}>
            {saving ? t('common.saving') : (treatment ? t('common.save') : t('treatments.compare'))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
