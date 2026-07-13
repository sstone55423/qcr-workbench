import React, { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/I18nContext';
import { APP_NAME } from '@/lib/citation';

// One-time, dismissible welcome shown the first time the app is opened on this
// device. Never repeats (a localStorage flag records that it was seen).
const SEEN_KEY = 'qcr-welcomed';

export default function WelcomeNotice() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN_KEY)) setOpen(true);
    } catch { /* storage unavailable */ }
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) dismiss(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            {t('welcome.title', { name: APP_NAME })}
          </DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
          <p>{t('welcome.free')}</p>
          <p>{t('welcome.cite')}</p>
        </div>
        <DialogFooter>
          <Button onClick={dismiss}>{t('welcome.start')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
