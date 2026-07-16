import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/I18nContext';
import { takeSnapshot, deleteSnapshot, listSnapshots } from '@/lib/qcr/snapshotStore';
import { formatCurrency } from '@/lib/qcr/format';
import AleTrend from '@/components/charts/AleTrend';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Camera, Trash2, History } from 'lucide-react';

// Point-in-time snapshots of the portfolio and the ALE trend they build up.
export default function SnapshotTrend({ project, scenarios }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [snapshots, setSnapshots] = useState([]);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    listSnapshots(project.id).then(setSnapshots).catch(() => setSnapshots([]));
  }, [project.id]);

  useEffect(() => { reload(); }, [reload]);

  const handleTake = async () => {
    setBusy(true);
    try {
      await takeSnapshot(project, scenarios);
      toast({ title: t('snapshots.taken') });
      reload();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (snapshot) => {
    await deleteSnapshot(snapshot);
    toast({ title: t('snapshots.deleted') });
    reload();
  };

  return (
    <div className="border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium flex items-center gap-2 mb-1">
            <History className="w-4 h-4 text-primary" /> {t('snapshots.title')}
          </h3>
          <p className="text-xs text-muted-foreground">{t('snapshots.desc')}</p>
        </div>
        <Button variant="outline" onClick={handleTake} disabled={busy || scenarios.length === 0} className="gap-2 shrink-0">
          <Camera className="w-4 h-4" /> {t('snapshots.take')}
        </Button>
      </div>

      {snapshots.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">{t('snapshots.empty')}</p>
      ) : (
        <>
          {snapshots.length >= 2 && (
            <div>
              <h4 className="text-xs font-medium mb-0.5">{t('snapshots.chartTitle')}</h4>
              <p className="text-xs text-muted-foreground mb-2">{t('snapshots.chartSubtitle')}</p>
              <AleTrend snapshots={snapshots} />
            </div>
          )}
          <ul className="divide-y divide-border">
            {[...snapshots].reverse().map((snapshot) => (
              <li key={snapshot.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                  {new Date(snapshot.taken_at).toLocaleString()}
                </span>
                <span className="flex-1 text-xs text-muted-foreground">
                  {t('snapshots.entry', { count: snapshot.scenario_count, total: formatCurrency(snapshot.total_ale) })}
                </span>
                <Button
                  variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0"
                  title={t('snapshots.delete')} aria-label={t('snapshots.delete')}
                  onClick={() => handleDelete(snapshot)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
