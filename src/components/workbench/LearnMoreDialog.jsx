import React, { useMemo } from 'react';
import { useI18n } from '@/lib/I18nContext';
import { classifyCompromise } from '@/lib/qcr/compromiseTypes';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { BookOpen, Newspaper, Sparkles } from 'lucide-react';

// "Learn more" screen for a scenario: classifies the scenario (by name) into
// one of the known compromise types and shows a brief primer. The deeper
// write-up and recent-incident citations are stubbed for now — this is the
// initial screen we grow later.
export default function LearnMoreDialog({ open, scenario, onClose }) {
  const { t } = useI18n();
  const type = useMemo(() => classifyCompromise(scenario), [scenario]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary shrink-0" /> {type.name}
          </DialogTitle>
          <DialogDescription>
            {t('learn.typeLabel')}
            {type.matched ? '' : ` — ${t('learn.unclassified')}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <p className="text-sm leading-relaxed">{type.brief}</p>

          {type.matched && (
            <p className="text-xs text-muted-foreground">{t('learn.classifiedFrom')}</p>
          )}

          <section className="border border-border rounded-xl p-4">
            <h3 className="text-sm font-medium flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> {t('learn.inDepthTitle')}
            </h3>
            <p className="text-xs text-muted-foreground">{t('learn.comingSoon')}</p>
          </section>

          <section className="border border-border rounded-xl p-4">
            <h3 className="text-sm font-medium flex items-center gap-1.5 mb-1">
              <Newspaper className="w-3.5 h-3.5 text-primary" /> {t('learn.incidentsTitle')}
            </h3>
            <p className="text-xs text-muted-foreground">{t('learn.incidentsSoon')}</p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
