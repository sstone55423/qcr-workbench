import React, { useState, useRef } from 'react';
import { BookOpen, Lock, ShieldCheck, Loader2, Upload, Plus, Database, Trash2, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { APP_SUPPORT_EMAIL } from '@/lib/citation';

// Password input with a show/hide toggle.
function PasswordField({ value, onChange, placeholder, autoFocus = false, show, setShow }) {
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="pr-9"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        aria-label={show ? 'Hide passphrase' : 'Show passphrase'}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

// Store picker + create / unlock / restore / delete. This renders BEFORE any
// vault is unlocked, so it cannot read the user's language preference — it is
// intentionally English-only, like a login screen.
export default function LockScreen({ stores, onUnlock, onCreate, onRestore, onDelete }) {
  const hasStores = stores && stores.length > 0;
  const [mode, setMode] = useState(hasStores ? 'list' : 'create'); // list | unlock | create | restore
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [hint, setHint] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [show, setShow] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteText, setDeleteText] = useState('');
  const fileRef = useRef(null);

  const reset = () => { setPassphrase(''); setConfirm(''); setName(''); setHint(''); setError(''); };
  const goList = () => { reset(); setSelected(null); setMode('list'); };
  const pickStore = (s) => { reset(); setSelected(s); setMode('unlock'); };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    const ok = await onUnlock(selected.id, passphrase);
    if (!ok) { setError('Incorrect passphrase.'); setBusy(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Give the store a name.'); return; }
    if (passphrase.length < 8) { setError('Passphrase must be at least 8 characters.'); return; }
    if (passphrase !== confirm) { setError('Passphrases do not match.'); return; }
    setBusy(true);
    try { await onCreate(name, passphrase, hint); }
    catch (err) { setError(err?.message || 'Failed to create store.'); setBusy(false); }
  };

  const handleRestorePick = () => {
    setError('');
    if (!name.trim()) { setError('Give the store a name first.'); return; }
    if (!passphrase) { setError('Enter the backup’s passphrase above first, then choose the file.'); return; }
    fileRef.current?.click();
  };

  const handleRestoreFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoring(true); setError('');
    try {
      await onRestore(name, await file.text(), passphrase);
      // On success the provider unlocks and this screen unmounts.
    } catch (err) {
      setError(err?.message || 'Restore failed.');
      setRestoring(false);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const confirmDelete = async () => {
    const target = deleteTarget;
    setDeleteTarget(null); setDeleteText('');
    await onDelete(target.id);
    if (selected?.id === target.id) goList();
  };

  const Brand = (
    <>
      <div className="flex items-center gap-2 justify-center mb-2">
        <BookOpen className="w-6 h-6 text-primary" />
        <span className="font-heading font-bold text-xl tracking-tight">QCR Workbench</span>
      </div>
      <div className="flex items-center gap-1.5 justify-center text-xs text-muted-foreground mb-6">
        <ShieldCheck className="w-3.5 h-3.5" />
        All data is encrypted and stored on this device
      </div>
    </>
  );

  const NoRecovery = (
    <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
      Your passphrase encrypts everything in this store. It is never sent anywhere and{' '}
      <span className="font-medium text-foreground">cannot be recovered</span> if lost.
    </p>
  );

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-md border border-border rounded-xl p-8 bg-card">
        {Brand}

        {/* ---- Store list ---- */}
        {mode === 'list' && (
          <div className="space-y-4">
            <p className="text-sm font-medium">Choose a store to open</p>
            <div className="space-y-2">
              {stores.map(s => (
                <div key={s.id} className="flex items-center gap-2">
                  <button
                    onClick={() => pickStore(s)}
                    className="flex-1 flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left hover:bg-accent transition-colors"
                  >
                    <Database className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-medium truncate">{s.name}</span>
                  </button>
                  <Button
                    variant="ghost" size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                    title={`Delete “${s.name}”`}
                    onClick={() => { setDeleteTarget(s); setDeleteText(''); }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {!hasStores && <p className="text-sm text-muted-foreground">No stores yet.</p>}
            </div>

            <div className="flex items-center gap-3 my-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="gap-2" onClick={() => { reset(); setMode('create'); }}>
                <Plus className="w-4 h-4" /> New store
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => { reset(); setMode('restore'); }}>
                <Upload className="w-4 h-4" /> Restore
              </Button>
            </div>
          </div>
        )}

        {/* ---- Unlock a store ---- */}
        {mode === 'unlock' && selected && (
          <form onSubmit={handleUnlock} className="space-y-4">
            {hasStores && (
              <button type="button" onClick={goList} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-3.5 h-3.5" /> All stores
              </button>
            )}
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{selected.name}</span>
            </div>
            {selected.email && <p className="text-sm -mt-2">Welcome back, <span className="font-medium text-foreground">{selected.email}</span></p>}
            {selected.hint && <p className="text-xs text-muted-foreground -mt-2">Hint: {selected.hint}</p>}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Enter your passphrase</label>
              <PasswordField value={passphrase} onChange={e => setPassphrase(e.target.value)} autoFocus placeholder="Passphrase" show={show} setShow={setShow} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={busy || !passphrase} className="w-full gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Unlock
            </Button>
          </form>
        )}

        {/* ---- Create a new store ---- */}
        {mode === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4">
            {hasStores && (
              <button type="button" onClick={goList} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-3.5 h-3.5" /> All stores
              </button>
            )}
            <p className="text-sm font-medium">Create a new data store</p>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Store name</label>
              <Input value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="e.g. ABC Company Analysis" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Create a passphrase</label>
              <PasswordField value={passphrase} onChange={e => setPassphrase(e.target.value)} placeholder="Passphrase" show={show} setShow={setShow} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Confirm passphrase</label>
              <PasswordField value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat passphrase" show={show} setShow={setShow} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Passphrase hint <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input type="text" value={hint} onChange={e => setHint(e.target.value)} placeholder="A reminder to jog your memory" />
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Shown on this store’s unlock screen. <span className="font-medium text-foreground">Not encrypted</span> — never put your actual passphrase here.
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={busy} className="w-full gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create store
            </Button>
            {NoRecovery}
          </form>
        )}

        {/* ---- Restore into a new store ---- */}
        {mode === 'restore' && (
          <div className="space-y-4">
            {hasStores && (
              <button type="button" onClick={goList} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-3.5 h-3.5" /> All stores
              </button>
            )}
            <p className="text-sm font-medium">Restore a backup into a new store</p>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Store name</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Restored Analysis" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Passphrase</label>
              <PasswordField value={passphrase} onChange={e => setPassphrase(e.target.value)} placeholder="Backup passphrase" show={show} setShow={setShow} />
            </div>
            <input ref={fileRef} type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
            <Button type="button" variant="outline" disabled={restoring} onClick={handleRestorePick} className="w-full gap-2">
              {restoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {restoring ? 'Restoring backup…' : 'Choose backup file'}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground leading-relaxed">
              For an <span className="font-medium text-foreground">encrypted</span> backup, enter that backup’s passphrase.
              For an <span className="font-medium text-foreground">unencrypted</span> backup, the passphrase you enter becomes the new store’s passphrase.
            </p>
          </div>
        )}
        </div>
      </div>

      {/* Rights footer — hardcoded (this screen renders before the i18n provider). */}
      <footer className="shrink-0 px-4 pb-5 text-center text-xs text-muted-foreground space-y-1">
        <p>
          © {new Date().getFullYear()}{' '}
          <a
            href="https://orcid.org/my-orcid?orcid=0000-0003-2718-6848"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Scott Thomas Stone
          </a>
        </p>
        <p>Free and open source under the MIT License</p>
        <p>
          Support:{' '}
          <a href={`mailto:${APP_SUPPORT_EMAIL}`} className="text-primary hover:underline">
            {APP_SUPPORT_EMAIL}
          </a>
        </p>
      </footer>

      {/* ---- Delete confirmation ---- */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-sm border border-border rounded-xl p-6 bg-card" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-2 text-destructive">
              <Trash2 className="w-4 h-4" />
              <h3 className="text-sm font-medium">Delete “{deleteTarget.name}”</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              This permanently deletes the store and everything in it. <span className="font-medium text-foreground">It cannot be undone.</span>{' '}
              If you might need this data, open the store and back it up first. Type the store name to confirm.
            </p>
            <Input value={deleteText} onChange={e => setDeleteText(e.target.value)} placeholder={deleteTarget.name} autoFocus />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button
                variant="destructive" size="sm"
                disabled={deleteText.trim() !== deleteTarget.name}
                onClick={confirmDelete}
              >
                Delete permanently
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
