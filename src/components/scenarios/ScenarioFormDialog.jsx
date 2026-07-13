import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/I18nContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';

const FIELDS = [
  { key: 'name', labelKey: 'scenarios.fieldName', required: true },
  { key: 'asset', labelKey: 'scenarios.fieldAsset' },
  { key: 'threat', labelKey: 'scenarios.fieldThreat' },
  { key: 'effect', labelKey: 'scenarios.fieldEffect' },
  { key: 'owner', labelKey: 'scenarios.fieldOwner' },
];

// Create/edit dialog for a scenario's scoping metadata. New scenarios start
// from neutral placeholder estimates the user refines on the Assumptions step.
export default function ScenarioFormDialog({ open, scenario, onClose, onSubmit, saving }) {
  const { t } = useI18n();
  const [form, setForm] = useState(/** @type {Record<string, string>} */ ({}));

  useEffect(() => {
    if (open) {
      setForm({
        name: scenario?.name || '',
        description: scenario?.description || '',
        asset: scenario?.asset || '',
        threat: scenario?.threat || '',
        effect: scenario?.effect || '',
        owner: scenario?.owner || '',
      });
    }
  }, [open, scenario]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{scenario ? t('scenarios.editTitle') : t('scenarios.newTitle')}</DialogTitle>
          <DialogDescription>{t('scenarios.formDesc')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {FIELDS.map((field) => (
            <div key={field.key}>
              <label className="text-sm font-medium mb-1.5 block">{t(field.labelKey)}</label>
              <Input value={form[field.key] || ''} onChange={set(field.key)} placeholder={t(`${field.labelKey}Ph`)} />
            </div>
          ))}
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('scenarios.fieldDescription')}</label>
            <Textarea value={form.description || ''} onChange={set('description')} placeholder={t('scenarios.fieldDescriptionPh')} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={() => onSubmit(form)} disabled={!form.name?.trim() || saving}>
            {saving ? t('common.saving') : (scenario ? t('common.save') : t('common.create'))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
