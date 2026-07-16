import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/I18nContext';
import { db } from '@/lib/localdb/store';
import { logAudit } from '@/lib/auditLog';
import { formatCurrency, formatPercent } from '@/lib/qcr/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Gauge, Save, X } from 'lucide-react';

// Project-level risk tolerance: "at most a {probability} chance per year of
// losing more than {threshold}". Persisted on the Project record and applied
// wherever an exceedance curve is shown.
export default function ToleranceEditor({ project, onSaved }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [threshold, setThreshold] = useState(project.tolerance?.threshold ?? '');
  const [probabilityPct, setProbabilityPct] = useState(
    project.tolerance ? project.tolerance.probability * 100 : '',
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setThreshold(project.tolerance?.threshold ?? '');
    setProbabilityPct(project.tolerance ? project.tolerance.probability * 100 : '');
  }, [project.id, project.tolerance]);

  const save = async () => {
    const thresholdValue = Number(threshold);
    const probabilityValue = Number(probabilityPct) / 100;
    if (!(thresholdValue > 0) || !(probabilityValue > 0) || probabilityValue > 1) {
      toast({ title: t('tolerance.invalid'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await db.entities.Project.update(project.id, { tolerance: { threshold: thresholdValue, probability: probabilityValue } });
      logAudit(project.id, 'assumptions', 'auditMsg.toleranceSet', {
        threshold: formatCurrency(thresholdValue),
        probability: formatPercent(probabilityValue),
      });
      toast({ title: t('tolerance.saved') });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const clear = async () => {
    setSaving(true);
    try {
      await db.entities.Project.update(project.id, { tolerance: null });
      logAudit(project.id, 'assumptions', 'auditMsg.toleranceCleared');
      toast({ title: t('tolerance.cleared') });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-border rounded-xl p-5 space-y-3">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <Gauge className="w-4 h-4 text-primary" /> {t('tolerance.title')}
      </h3>
      <p className="text-xs text-muted-foreground">{t('tolerance.desc')}</p>
      {!project.tolerance && <p className="text-xs text-muted-foreground italic">{t('tolerance.notSet')}</p>}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">{t('tolerance.threshold')}</label>
          <Input
            type="number" min="0" step="10000" className="w-40 tabular-nums"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">{t('tolerance.probability')}</label>
          <Input
            type="number" min="0" max="100" step="1" className="w-40 tabular-nums"
            value={probabilityPct}
            onChange={(e) => setProbabilityPct(e.target.value)}
          />
        </div>
        <Button onClick={save} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" /> {t('tolerance.save')}
        </Button>
        {project.tolerance && (
          <Button variant="outline" onClick={clear} disabled={saving} className="gap-2">
            <X className="w-4 h-4" /> {t('tolerance.clear')}
          </Button>
        )}
      </div>
    </div>
  );
}
