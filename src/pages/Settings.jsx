import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/I18nContext';
import { LANGUAGES } from '@/lib/i18n';
import { appSettings, setStoreEmail } from '@/lib/localdb/store';
import { useVault } from '@/lib/VaultContext';
import { getAutoLockMinutes, setAutoLockMinutes } from '@/components/AutoLock';
import { Settings as SettingsIcon, Save, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import BackupRestore from '@/components/settings/BackupRestore';
import ThemePicker from '@/components/settings/ThemePicker';
import Copyright from '@/components/Copyright';
import AIProviderSettings from '@/components/settings/AIProviderSettings';

export default function Settings() {
  const { currentStore } = useVault();
  const { t, language, setLanguage } = useI18n();
  const { toast } = useToast();
  const [contactEmail, setContactEmail] = useState('');
  const [emailShowOnLock, setEmailShowOnLock] = useState(false);
  const [emailShowInReport, setEmailShowInReport] = useState(false);
  const [ai, setAi] = useState({ ai_provider: 'auto', anthropic_key: '', openai_key: '', gemini_key: '', qwen_key: '', ollama_url: '', ollama_model: '', webllm_model: '' });
  const [saving, setSaving] = useState(false);
  const [autoLockMin, setAutoLockMin] = useState(() => getAutoLockMinutes());

  useEffect(() => {
    (async () => {
      const s = await appSettings.get();
      setContactEmail(s.contact_email || '');
      setEmailShowOnLock(!!s.email_show_on_lock);
      setEmailShowInReport(!!s.email_show_in_report);
      setAi({
        ai_provider: s.ai_provider || 'auto',
        anthropic_key: s.anthropic_key || '',
        openai_key: s.openai_key || '',
        gemini_key: s.gemini_key || '',
        qwen_key: s.qwen_key || '',
        ollama_url: s.ollama_url || '',
        ollama_model: s.ollama_model || '',
        webllm_model: s.webllm_model || '',
      });
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const email = contactEmail.trim();
    await appSettings.set({
      contact_email: email,
      email_show_on_lock: emailShowOnLock,
      email_show_in_report: emailShowInReport,
      ai_provider: ai.ai_provider,
      anthropic_key: ai.anthropic_key.trim(),
      openai_key: ai.openai_key.trim(),
      gemini_key: ai.gemini_key.trim(),
      qwen_key: ai.qwen_key.trim(),
      ollama_url: ai.ollama_url.trim(),
      ollama_model: ai.ollama_model.trim(),
      webllm_model: ai.webllm_model || '',
    });
    // Mirror the email into this store's non-secret registry entry ONLY when the
    // user opts to show it on the unlock screen (which renders before unlock).
    // Otherwise keep it strictly inside the encrypted vault.
    if (currentStore?.id) setStoreEmail(currentStore.id, emailShowOnLock && email ? email : '');
    setSaving(false);
    toast({ title: t('settings.savedToast') });
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="flex items-center gap-2 mb-1">
        <SettingsIcon className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-heading font-bold tracking-tight">{t('nav.settings')}</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-2">{t('settings.subtitle')}</p>
      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-8">
        <ShieldCheck className="w-3.5 h-3.5" />
        {t('settings.encryptedNote')}
      </p>

      <div className="space-y-8">
        <div className="border border-border rounded-xl p-5">
          <h2 className="text-sm font-medium mb-4">{t('settings.language')}</h2>
          <p className="text-xs text-muted-foreground mb-3">{t('settings.languageDesc')}</p>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(l => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="border border-border rounded-xl p-5">
          <h2 className="text-sm font-medium mb-4">{t('settings.appearance')}</h2>
          <p className="text-xs text-muted-foreground mb-3">{t('settings.themeDesc')}</p>
          <ThemePicker />
        </div>

        <div className="border border-border rounded-xl p-5">
          <h2 className="text-sm font-medium mb-4">{t('settings.securityTitle')}</h2>
          <p className="text-xs text-muted-foreground mb-3">{t('settings.autoLockDesc')}</p>
          <label className="text-sm font-medium mb-1.5 block">{t('settings.autoLock')}</label>
          <Select value={String(autoLockMin)} onValueChange={v => { const n = parseInt(v, 10); setAutoLockMin(n); setAutoLockMinutes(n); }}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">{t('settings.autoLockOff')}</SelectItem>
              {[5, 15, 30, 60].map(n => <SelectItem key={n} value={String(n)}>{t('settings.autoLockMin', { n })}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <AIProviderSettings value={ai} onChange={setAi} />

        <div className="border border-border rounded-xl p-5">
          <h2 className="text-sm font-medium mb-4">{t('settings.emailTitle')}</h2>
          <p className="text-xs text-muted-foreground mb-3">{t('settings.emailDesc')}</p>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('settings.emailAddress')}</label>
              <Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="you@example.com" type="email" />
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Checkbox id="email-show-lock" checked={emailShowOnLock} onCheckedChange={v => setEmailShowOnLock(!!v)} className="mt-0.5" />
              <label htmlFor="email-show-lock" className="cursor-pointer">{t('settings.emailShowOnLock')}</label>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Checkbox id="email-show-report" checked={emailShowInReport} onCheckedChange={v => setEmailShowInReport(!!v)} className="mt-0.5" />
              <label htmlFor="email-show-report" className="cursor-pointer">{t('settings.emailShowInReport')}</label>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? t('settings.saved') : t('settings.saveSettings')}
        </Button>

        <BackupRestore />
      </div>
      <Copyright />
    </div>
  );
}