import React, { useState, useEffect } from 'react';
import { Save, Loader2, Eye, EyeOff, FolderOpen, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/I18nContext';
import { supportsDirectorySave, getBackupDir } from '@/lib/backupTarget';
import {
  performBackup, chooseBackupFolder, backupStatus,
  getSessionPassphrase, setSessionPassphrase,
} from '@/lib/backupService';

// Sidebar quick-backup: an always-visible "Back up" button that doubles as a
// reminder (amber dot + last-backup line when overdue). Writes an encrypted
// backup — to a remembered folder on Chromium, or via picker/download elsewhere.
export default function QuickBackup({ collapsed }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const canDir = supportsDirectorySave();

  const [open, setOpen] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dirName, setDirName] = useState('');
  const [plain, setPlain] = useState(false);
  const [status, setStatus] = useState(() => backupStatus());

  // First backup of the session needs a confirmed passphrase; after that the
  // in-memory one is reused so repeat backups are one click.
  const hasSession = !!getSessionPassphrase();

  useEffect(() => {
    if (!open) return;
    setPassphrase(getSessionPassphrase());
    setConfirm('');
    setPlain(false);
    if (canDir) getBackupDir().then(d => setDirName(d?.name || ''));
  }, [open, canDir]);

  const handleChooseFolder = async () => {
    try {
      const name = await chooseBackupFolder();
      if (name) setDirName(name);
    } catch (e) {
      if (e?.name !== 'AbortError') toast({ title: t('qb.folderFailed'), variant: 'destructive' });
    }
  };

  const handleBackup = async () => {
    if (!plain) {
      if (passphrase.length < 8) { toast({ title: t('qb.passTooShort'), variant: 'destructive' }); return; }
      if (!hasSession && passphrase !== confirm) { toast({ title: t('br.mismatch'), variant: 'destructive' }); return; }
    }
    setBusy(true);
    try {
      const res = await performBackup(passphrase, { plain });
      if (!plain) setSessionPassphrase(passphrase);
      setStatus(backupStatus());
      toast({
        title: plain ? t('br.plainSaved') : t('qb.done'),
        description: res.target === 'folder' ? t('qb.doneFolder', { name: res.name }) : t('qb.doneFile'),
      });
      setOpen(false);
    } catch (e) {
      if (e?.name !== 'AbortError') toast({ title: t('qb.failed'), description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const lastText = status.last
    ? `${t('qb.lastLabel')}: ${new Date(status.last).toLocaleDateString()}`
    : t('qb.never');

  return (
    <>
      <Button
        variant="ghost"
        size={collapsed ? 'icon' : 'sm'}
        onClick={() => setOpen(true)}
        title={collapsed ? t('qb.button') : undefined}
        className={`relative ${collapsed ? '' : 'w-full justify-start gap-2'}`}
      >
        <span className="relative">
          <Save className="w-4 h-4" />
          {status.overdue && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />}
        </span>
        {!collapsed && <span className="flex-1 text-left">{t('qb.button')}</span>}
      </Button>
      {!collapsed && (
        <p className={`px-2 text-[10px] leading-tight ${status.overdue ? 'text-amber-500' : 'text-muted-foreground'}`}>
          {lastText}
        </p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('qb.title')}</DialogTitle>
            <DialogDescription>{t('qb.desc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            {!plain && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t('br.passphrase')}</label>
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
            )}

            {!plain && !hasSession && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t('br.confirmPassphrase')}</label>
                <Input
                  type={show ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder={t('br.confirmPassphrase')}
                />
              </div>
            )}

            {plain && (
              <div className="border border-destructive/40 bg-destructive/5 rounded-lg p-3">
                <div className="flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">{t('br.plainWarnTitle')}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t('br.plainWarn')}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 text-sm">
              <Checkbox id="qb-plain" checked={plain} onCheckedChange={v => setPlain(!!v)} className="mt-0.5" />
              <label htmlFor="qb-plain" className="cursor-pointer">{t('qb.plainOption')}</label>
            </div>

            {canDir ? (
              <div>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-2.5">
                  <div className="min-w-0 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">
                      {dirName ? t('qb.savesTo', { name: dirName }) : t('qb.noFolderNote')}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleChooseFolder} className="shrink-0">
                    {dirName ? t('qb.changeFolder') : t('qb.chooseFolder')}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{t('qb.folderTip')}</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t('qb.downloadNote')}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>{t('common.cancel')}</Button>
            <Button onClick={handleBackup} disabled={busy} variant={plain ? 'destructive' : 'default'} className="gap-2">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {plain ? t('br.plainConfirm') : t('qb.backupNow')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
