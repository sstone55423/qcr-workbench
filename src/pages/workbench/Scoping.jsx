import React, { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useI18n } from '@/lib/I18nContext';
import { updateScenarioMeta } from '@/lib/qcr/scenarioStore';
import ScenarioFormDialog from '@/components/scenarios/ScenarioFormDialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Server, UserX, Zap, UserCheck, Pencil, ArrowRight, CheckCircle2 } from 'lucide-react';

// Step 1 — scenario scoping: the four scoping cards, the FAIR-style risk
// statement, and the scoping assumptions (port of v0 page 01).
export default function Scoping() {
  const { scenario, reload } = /** @type {{scenario: any, reload: () => void}} */ (useOutletContext());
  const { t } = useI18n();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const cards = [
    { labelKey: 'scoping.asset', value: scenario.asset, icon: Server },
    { labelKey: 'scoping.threat', value: scenario.threat, icon: UserX },
    { labelKey: 'scoping.effect', value: scenario.effect, icon: Zap },
    { labelKey: 'scoping.owner', value: scenario.owner, icon: UserCheck },
  ];

  const handleEdit = async (form) => {
    setSaving(true);
    try {
      await updateScenarioMeta(scenario, form);
      setEditing(false);
      reload();
    } catch (err) {
      toast({ title: t('scenarios.saveFailed'), description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground">{t('scoping.intro')}</p>
        <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={() => setEditing(true)}>
          <Pencil className="w-3.5 h-3.5" /> {t('scoping.edit')}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.labelKey} className="border border-border rounded-xl p-4 bg-card">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <card.icon className="w-3.5 h-3.5" /> {t(card.labelKey)}
            </div>
            <p className="text-sm font-medium">{card.value || '—'}</p>
          </div>
        ))}
      </div>

      <div className="border border-primary/30 bg-primary/5 rounded-xl p-5">
        <div className="flex items-center gap-2 text-sm font-medium mb-1.5">
          <CheckCircle2 className="w-4 h-4 text-primary" /> {t('scoping.riskStatement')}
        </div>
        <p className="text-sm">
          {t('scoping.riskStatementText', {
            threat: scenario.threat || '…',
            asset: scenario.asset || '…',
            effect: (scenario.effect || '…').toLowerCase(),
          })}
        </p>
      </div>

      {scenario.assumptions?.length > 0 && (
        <div className="border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium mb-3">{t('scoping.assumptionsTitle')}</h3>
          <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
            {scenario.assumptions.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}

      <div className="flex justify-end">
        <Button asChild className="gap-2">
          <Link to={`/scenarios/${scenario.id}/fair`}>
            {t('scoping.next')} <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      <ScenarioFormDialog
        open={editing}
        scenario={scenario}
        onClose={() => setEditing(false)}
        onSubmit={handleEdit}
        saving={saving}
      />
    </div>
  );
}
