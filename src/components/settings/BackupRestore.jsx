import React, { useState, useRef } from 'react';
import { useProject } from '@/lib/ProjectContext';
import { createBackup, createPlainBackup, restoreBackup, backupFilename } from '@/lib/backup';
import { setStoreHint } from '@/lib/localdb/store';
import { useVault } from '@/lib/VaultContext';
import { Download, Upload, Loader2, Eye, EyeOff, ShieldAlert, AlertTriangle, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/I18nContext';

export default function BackupRestore() {
  const { loadProjects } = useProject();
  const { toast } = useToast();
  const { t } = useI18n();
  const { currentStore } = useVault();
  const fileRef = useRef(null);
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [hint, setHint] = useState(() => currentStore?.hint || '');
  const [plainConfirm, setPlainConfirm] = useState(false);
  const [plainExporting, setPlainExporting] = useState(false);

  const mismatch = confirm.length > 0 && passphrase !== confirm;
  const canExport = passphrase.length >= 8 && passphrase === confirm;

  // Shared file writer: uses the save-picker where available, else a download.
  // Returns null if the user cancels the picker.
  const writeFile = async (content, filename) => {
    if (window.showSaveFilePicker) {
      try {
        // Start in Downloads: OneDrive-synced Documents/Desktop are blocked by
        // the browser as "system files" on Known-Folder-Move setups.
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          startIn: 'downloads',
          types: [{ description: 'QCR Workbench backup', accept: { 'application/json': ['.json'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        return { picked: true, name: handle.name };
      } catch (err) {
        if (err.name === 'AbortError') return null; // user cancelled
        // Blocked folder / security error → fall through to a plain download.
      }
    }
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    return { picked: false, name: filename };
  };

  const savedToast = (res) =>
    res.picked
      ? { title: t('br.backupSaved'), description: t('br.backupSavedDesc', { name: res.name }) }
      : { title: t('br.backupDownloaded'), description: t('br.backupDownloadedDesc') };

  const handleExport = async () => {
    setExporting(true);
    try {
      const content = await createBackup(passphrase);
      const res = await writeFile(content, backupFilename(false));
      if (res) toast(savedToast(res));
    } catch (err) {
      toast({ title: t('br.backupFailed'), description: err.message, variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const handlePlainExport = async () => {
    setPlainExporting(true);
    try {
      const content = await createPlainBackup();
      const res = await writeFile(content, backupFilename(true));
      if (res) {
        setPlainConfirm(false);
        toast(res.picked ? { title: t('br.plainSaved'), description: t('br.backupSavedDesc', { name: res.name }) } : { title: t('br.plainSaved'), description: t('br.backupDownloadedDesc') });
      }
    } catch (err) {
      toast({ title: t('br.backupFailed'), description: err.message, variant: 'destructive' });
    } finally {
      setPlainExporting(false);
    }
  };

  const handleSaveHint = () => {
    if (currentStore?.id) setStoreHint(currentStore.id, hint.trim());
    toast({ title: t('br.hintSaved') });
  };

  const handleRestoreFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoring(true);
    try {
      const text = await file.text();
      const result = await restoreBackup(text, passphrase);
      await loadProjects();
      toast({
        title: t('br.restored'),
        description: t('br.restoredDesc', { projects: result.projects, scenarios: result.scenarios }),
      });
    } catch (err) {
      toast({ title: t('br.restoreFailed'), description: err.message, variant: 'destructive' });
    }
    setRestoring(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="border border-border rounded-xl p-5">
      <h2 className="text-sm font-medium mb-4">{t('br.title')}</h2>
      <p className="text-xs text-muted-foreground mb-3">
        {t('br.desc')}
      </p>

      {/* Why backups matter — honest recovery framing (Option B). */}
      <div className="flex gap-2 text-xs bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
        <ShieldAlert className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <span className="text-muted-foreground leading-relaxed">{t('br.safetyNote')}</span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium mb-1.5 block">{t('br.passphrase')}</label>
          <div className="relative">
            <Input
              type={showPassphrase ? 'text' : 'password'}
              value={passphrase}
              onChange={e => setPassphrase(e.target.value)}
              placeholder={t('br.passphrasePlaceholder')}
              className="pr-9"
            />
            <button
              type="button"
              onClick={() => setShowPassphrase(s => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassphrase ? t('br.hidePassphrase') : t('br.showPassphrase')}
              title={showPassphrase ? t('br.hidePassphrase') : t('br.showPassphrase')}
            >
              {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            {t('br.confirmPassphrase')} <span className="text-muted-foreground font-normal">{t('br.confirmRequired')}</span>
          </label>
          <Input
            type={showPassphrase ? 'text' : 'password'}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder={t('br.confirmPassphrase')}
          />
          {mismatch && <p className="text-xs text-destructive mt-1">{t('br.mismatch')}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting || !canExport} className="gap-2">
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {exporting ? t('common.exporting') : t('br.exportBackup')}
          </Button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleRestoreFile} className="hidden" id="restore-file" />
          <Button variant="outline" size="sm" disabled={restoring} className="gap-2" asChild>
            <label htmlFor="restore-file" className={restoring ? 'pointer-events-none' : 'cursor-pointer'}>
              {restoring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {restoring ? t('br.restoring') : t('br.restoreBackup')}
            </label>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('br.restoreNote')}
        </p>
      </div>

      {/* Passphrase hint — non-secret memory aid shown on the unlock screen. */}
      <div className="mt-5 pt-5 border-t border-border">
        <label className="text-sm font-medium mb-1.5 block">{t('br.hintLabel')}</label>
        <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{t('br.hintDesc')}</p>
        <div className="flex gap-2">
          <Input value={hint} onChange={e => setHint(e.target.value)} placeholder={t('br.hintPlaceholder')} />
          <Button variant="outline" size="sm" onClick={handleSaveHint} className="gap-2 shrink-0">
            <Save className="w-3.5 h-3.5" /> {t('br.saveHint')}
          </Button>
        </div>
      </div>

      {/* Unencrypted backup — opt-in, heavily warned. */}
      <div className="mt-5 pt-5 border-t border-border">
        {!plainConfirm ? (
          <Button variant="ghost" size="sm" onClick={() => setPlainConfirm(true)} className="gap-2 text-muted-foreground">
            <AlertTriangle className="w-3.5 h-3.5" /> {t('br.plainExport')}
          </Button>
        ) : (
          <div className="border border-destructive/40 bg-destructive/5 rounded-lg p-3">
            <div className="flex gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">{t('br.plainWarnTitle')}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t('br.plainWarn')}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="destructive" size="sm" onClick={handlePlainExport} disabled={plainExporting} className="gap-2">
                {plainExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                {plainExporting ? t('common.exporting') : t('br.plainConfirm')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPlainConfirm(false)} disabled={plainExporting}>
                {t('br.plainCancel')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
