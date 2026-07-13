import React, { useState } from 'react';
import { LogOut, Loader2, Save, Eye, EyeOff } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/I18nContext';
import { useVault } from '@/lib/VaultContext';
import { performBackup, backupStatus, getSessionPassphrase, setSessionPassphrase } from '@/lib/backupService';

// Graceful "leave the app" flow: your data is already saved to the encrypted
// vault, so this invites a backup (in case this browser's storage is later
// cleared) and then locks back to the sign-in screen.
export default function ExitButton({ collapsed }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const { lock } = useVault();

  const [open, setOpen] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(() => backupStatus());

  const openDialog = () => {
    setPassphrase(getSessionPassphrase());
    setStatus(backupStatus());
    setOpen(true);
  };

  const backupAndExit = async () => {
    if (passphrase.length < 8) { toast({ title: t('exit.passTooShort'), variant: 'destructive' }); return; }
    setBusy(true);
    try {
      await performBackup(passphrase, {});
      setSessionPassphrase(passphrase);
      toast({ title: t('exit.backedUp') });
      lock(); // unmounts back to the lock screen
    } catch (e) {
      if (e?.name === 'AbortError') { setBusy(false); return; } // save dialog cancelled
      toast({ title: t('exit.backupFailed'), description: e.message, variant: 'destructive' });
      setBusy(false);
    }
  };

  const signOutNoBackup = () => lock();

  const lastText = status.last
    ? t('exit.lastBackup', { date: new Date(status.last).toLocaleDateString() })
    : t('exit.never');

  return (
    <>
      <Button
        variant="ghost"
        size={collapsed ? 'icon' : 'sm'}
        onClick={openDialog}
        title={collapsed ? t('exit.button') : undefined}
        className={collapsed ? '' : 'w-full justify-start gap-2'}
      >
        <LogOut className="w-4 h-4" />
        {!collapsed && t('exit.button')}
      </Button>

      <Dialog open={open} onOpenChange={(o) => { if (!busy) setOpen(o); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('exit.title')}</DialogTitle>
            <DialogDescription>{t('exit.saved')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <p className={`text-xs ${status.overdue ? 'text-amber-500' : 'text-muted-foreground'}`}>{lastText}</p>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('exit.passphrase')}</label>
              <div className="relative">
                <Input
                  type={show ? 'text' : 'password'}
                  value={passphrase}
                  onChange={e => setPassphrase(e.target.value)}
                  placeholder={t('br.passphrasePlaceholder')}
                  className="pr-9"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={show ? t('br.hidePassphrase') : t('br.showPassphrase')}
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={signOutNoBackup} disabled={busy} className="text-muted-foreground">
              {t('exit.noBackup')}
            </Button>
            <Button onClick={backupAndExit} disabled={busy} className="gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t('exit.backupExit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
