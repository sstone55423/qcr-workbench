import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '@/lib/ProjectContext';
import { useI18n } from '@/lib/I18nContext';
import useScenarios from '@/hooks/useScenarios';
import {
  createScenario, updateScenarioMeta, deleteScenario, loadSampleScenarios,
} from '@/lib/qcr/scenarioStore';
import { expectedLoss } from '@/lib/qcr/fair';
import { formatCurrency } from '@/lib/qcr/format';
import NoProject from '@/components/NoProject';
import ScenarioFormDialog from '@/components/scenarios/ScenarioFormDialog';
import { Crosshair, Plus, Trash2, Pencil, Sparkles, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

// Sensible neutral starting estimates for a hand-created scenario; the user
// refines them on the Assumptions step.
const DEFAULT_FAIR = {
  threat_event_frequency: { minimum: 0.1, most_likely: 1, maximum: 5, unit: 'events/year' },
  vulnerability: { minimum: 0.05, most_likely: 0.2, maximum: 0.5, unit: 'probability' },
  primary_loss: { minimum: 10000, most_likely: 100000, maximum: 1000000, unit: 'USD/event' },
  secondary_loss: { minimum: 0, most_likely: 25000, maximum: 500000, unit: 'USD/event' },
  secondary_loss_probability: { minimum: 0.05, most_likely: 0.2, maximum: 0.5, unit: 'probability' },
};

export default function Scenarios() {
  const { currentProject } = useProject();
  const { scenarios, loading, reload } = useScenarios(currentProject?.id);
  const { t } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingSamples, setLoadingSamples] = useState(false);

  if (!currentProject) return <NoProject />;

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      const created = await createScenario(currentProject.id, { ...form, fair: structuredClone(DEFAULT_FAIR) });
      setShowCreate(false);
      reload();
      navigate(`/scenarios/${created.id}/scoping`);
    } catch (err) {
      toast({ title: t('scenarios.createFailed'), description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (form) => {
    setSaving(true);
    try {
      await updateScenarioMeta(editTarget, form);
      setEditTarget(null);
      reload();
    } catch (err) {
      toast({ title: t('scenarios.saveFailed'), description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteScenario(deleteTarget);
      reload();
    } catch (err) {
      toast({ title: t('scenarios.deleteFailed'), description: err.message, variant: 'destructive' });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleLoadSamples = async () => {
    setLoadingSamples(true);
    try {
      const added = await loadSampleScenarios(currentProject.id);
      toast({
        title: added.length > 0
          ? t('scenarios.samplesLoaded', { count: added.length })
          : t('scenarios.samplesAlreadyLoaded'),
      });
      reload();
    } catch (err) {
      toast({ title: t('scenarios.samplesFailed'), description: err.message, variant: 'destructive' });
    } finally {
      setLoadingSamples(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">{t('scenarios.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('scenarios.subtitle', { project: currentProject.name })}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleLoadSamples} disabled={loadingSamples} className="gap-2">
            {loadingSamples ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {t('scenarios.loadSamples')}
          </Button>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" /> {t('scenarios.newScenario')}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : scenarios.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-border rounded-xl">
          <Crosshair className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-lg font-medium mb-2">{t('scenarios.emptyTitle')}</h2>
          <p className="text-muted-foreground text-sm mb-6">{t('scenarios.emptyDesc')}</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={handleLoadSamples} disabled={loadingSamples} className="gap-2">
              <Sparkles className="w-4 h-4" /> {t('scenarios.loadSamples')}
            </Button>
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="w-4 h-4" /> {t('scenarios.newScenario')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((s) => (
            <div
              key={s.id}
              className="group border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-xs transition-all cursor-pointer flex flex-col"
              onClick={() => navigate(`/scenarios/${s.id}/scoping`)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium leading-snug">{s.name}</h3>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEditTarget(s); }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(s); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              {s.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-3">{s.description}</p>}
              <div className="mt-auto space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <User className="w-3 h-3" /> {s.owner || '—'}
                </div>
                <div className="flex items-center justify-between">
                  <Badge className="text-xs" variant="secondary" title={t('scenarios.aleBadgeTitle')}>
                    {t('scenarios.aleBadge', { value: formatCurrency(expectedLoss(s.fair).ale) })}
                  </Badge>
                  {s.sample_id && <Badge className="text-xs" variant="outline">{t('scenarios.sampleBadge')}</Badge>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ScenarioFormDialog
        open={showCreate}
        scenario={null}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        saving={saving}
      />
      <ScenarioFormDialog
        open={!!editTarget}
        scenario={editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEdit}
        saving={saving}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('scenarios.deleteTitle', { name: deleteTarget?.name })}</AlertDialogTitle>
            <AlertDialogDescription>{t('scenarios.deleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
