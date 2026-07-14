import React, { useState, useEffect } from 'react';
import { useProject } from '@/lib/ProjectContext';
import { useI18n } from '@/lib/I18nContext';
import { db } from '@/lib/localdb/store';
import { exportAuditTxt, exportAuditDoc, resolveAuditMessage } from '@/lib/auditLog';
import NoProject from '@/components/NoProject';
import { ClipboardList, Download, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AuditLog() {
  const { currentProject } = useProject();
  const { t } = useI18n();
  const [events, setEvents] = useState(null);

  useEffect(() => {
    if (!currentProject) return;
    let stale = false;
    db.entities.AuditEvent.filter({ project_id: currentProject.id }, '-created_date')
      .then(data => { if (!stale) setEvents(data); })
      .catch(() => { if (!stale) setEvents([]); });
    return () => { stale = true; };
  }, [currentProject?.id]);

  if (!currentProject) return <NoProject />;

  // Chronological order (oldest first) for the exported document
  const chronological = events ? [...events].reverse() : [];

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-heading font-bold tracking-tight">{t('nav.auditLog')}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('audit.subtitle')}
          </p>
        </div>
        <div className="flex gap-2 shrink-0 ml-4">
          <Button variant="outline" size="sm" className="gap-2" disabled={!events?.length}
            onClick={() => exportAuditTxt(currentProject, chronological, t)}>
            <Download className="w-3.5 h-3.5" /> {t('audit.exportTxt')}
          </Button>
          <Button variant="outline" size="sm" className="gap-2" disabled={!events?.length}
            onClick={() => exportAuditDoc(currentProject, chronological, t)}>
            <FileText className="w-3.5 h-3.5" /> {t('audit.exportDoc')}
          </Button>
        </div>
      </div>

      {!events ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          {t('audit.empty')}
        </p>
      ) : (
        <div className="border border-border rounded-xl divide-y divide-border">
          {events.map(e => (
            <div key={e.id} className="px-4 py-3 flex items-start gap-3">
              <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap mt-0.5">
                {new Date(e.created_date).toLocaleString()}
              </span>
              <Badge variant="secondary" className="shrink-0 text-[10px]">{t(`auditCat.${e.category}`)}</Badge>
              <span className="text-sm flex-1">{resolveAuditMessage(e, t)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}