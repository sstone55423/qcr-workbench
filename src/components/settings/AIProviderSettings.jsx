import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plug } from 'lucide-react';
import { AI_PROVIDERS, hasCredentials, invokeAI } from '@/lib/ai';
import { useI18n } from '@/lib/I18nContext';
import OnDeviceAI from '@/components/settings/OnDeviceAI';

export default function AIProviderSettings({ value, onChange }) {
  const set = (field) => (e) => onChange({ ...value, [field]: e.target.value });
  const autoPick = AI_PROVIDERS.find(p => hasCredentials(p.id, value));
  const { toast } = useToast();
  const { t } = useI18n();
  const [testing, setTesting] = useState(false);

  const testProvider = async () => {
    setTesting(true);
    try {
      await invokeAI({ prompt: 'Reply with the single word OK.', settings: value });
      toast({ title: t('aip.connWorks') });
    } catch (err) {
      toast({ title: t('aip.testFailed'), description: err.message, variant: 'destructive' });
    }
    setTesting(false);
  };

  return (
    <div className="space-y-6">
    <div className="border border-border rounded-xl p-5">
      <h2 className="text-sm font-medium mb-4">{t('aip.title')}</h2>
      <p className="text-xs text-muted-foreground mb-4">
        {t('aip.desc', { current: autoPick ? t('aip.currentProvider', { label: autoPick.label }) : '' })}
      </p>
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium mb-1.5 block">{t('aip.activeProvider')}</label>
          <Select value={value.ai_provider || 'auto'} onValueChange={v => onChange({ ...value, ai_provider: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">{t('aip.autoFirst')}</SelectItem>
              {AI_PROVIDERS.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">{t('aip.anthropicKey')}</label>
          <Input value={value.anthropic_key} onChange={set('anthropic_key')} placeholder="sk-ant-..." type="password" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">{t('aip.openaiKey')}</label>
          <Input value={value.openai_key} onChange={set('openai_key')} placeholder="sk-..." type="password" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">{t('aip.geminiKey')}</label>
          <Input value={value.gemini_key} onChange={set('gemini_key')} placeholder="AIza..." type="password" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">{t('aip.qwenKey')}</label>
          <Input value={value.qwen_key} onChange={set('qwen_key')} placeholder="sk-..." type="password" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">{t('aip.cerebrasKey')}</label>
          <Input value={value.cerebras_key} onChange={set('cerebras_key')} placeholder="csk-..." type="password" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('aip.ollamaUrl')}</label>
            <Input value={value.ollama_url} onChange={set('ollama_url')} placeholder="http://localhost:11434" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('aip.ollamaModel')}</label>
            <Input value={value.ollama_model} onChange={set('ollama_model')} placeholder="llama3.1" />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {t('aip.ollamaNote')}
        </p>
        <Button variant="outline" size="sm" onClick={testProvider} disabled={testing || !autoPick} className="gap-2">
          {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plug className="w-3.5 h-3.5" />}
          {testing ? t('settings.testing') : t('aip.testConnection')}
        </Button>
      </div>
    </div>
    <OnDeviceAI value={value} onChange={onChange} />
    </div>
  );
}