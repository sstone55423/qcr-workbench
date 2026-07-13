import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Cpu, CheckCircle2, Download, Chrome } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/I18nContext';
import { appSettings } from '@/lib/localdb/store';
import { nanoSupported, nanoAvailability, webgpuSupported, webgpuAvailability, setupWebLLM, WEBLLM_MODELS } from '@/lib/localAI';

// Configures the two no-key, on-device AI providers. Each degrades gracefully:
// if the browser can't run it, the controls are disabled with an explanation.
export default function OnDeviceAI({ value, onChange }) {
  const { t } = useI18n();
  const { toast } = useToast();

  const nanoOk = nanoSupported();
  const gpuOk = webgpuSupported();

  const [nanoStatus, setNanoStatus] = useState('');
  const [nanoChecking, setNanoChecking] = useState(false);
  const [webllmStatus, setWebllmStatus] = useState('');
  const [webllmChecking, setWebllmChecking] = useState(false);
  const [model, setModel] = useState(value.webllm_model || WEBLLM_MODELS[0].id);
  const [setupBusy, setSetupBusy] = useState(false);
  const [pct, setPct] = useState(0);

  const ready = !!value.webllm_model;

  const nanoMsg = {
    available: t('od.nanoAvailable'),
    downloadable: t('od.nanoDownloadable'),
    downloading: t('od.nanoDownloading'),
    unavailable: t('od.nanoUnavailable'),
    unsupported: t('od.nanoUnsupported'),
  }[nanoStatus];

  const checkNano = async () => {
    setNanoChecking(true);
    try {
      setNanoStatus(await nanoAvailability());
    } finally {
      setNanoChecking(false);
    }
  };

  const webllmMsg = {
    available: t('od.webgpuAvailable'),
    'no-adapter': t('od.webgpuNoAdapter'),
    unsupported: t('od.webllmUnsupported'),
  }[webllmStatus];

  const checkWebgpu = async () => {
    setWebllmChecking(true);
    try {
      setWebllmStatus(await webgpuAvailability());
    } finally {
      setWebllmChecking(false);
    }
  };

  const handleSetup = async () => {
    setSetupBusy(true);
    setPct(0);
    try {
      await setupWebLLM(model, (r) => setPct(Math.round((r?.progress || 0) * 100)));
      onChange({ ...value, webllm_model: model });
      // Persist immediately so a completed (large) download isn't lost if the
      // user forgets to click Save.
      await appSettings.set({ webllm_model: model });
      toast({ title: t('od.setupDone') });
    } catch (e) {
      toast({ title: t('od.setupFailed'), description: e.message, variant: 'destructive' });
    } finally {
      setSetupBusy(false);
    }
  };

  return (
    <div className="border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <Cpu className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-medium">{t('od.title')}</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">{t('od.desc')}</p>

      {/* Chrome built-in (Gemini Nano) */}
      <div className={`rounded-lg border border-border p-3 mb-3 ${nanoOk ? '' : 'opacity-60'}`}>
        <div className="flex items-center gap-2 mb-1">
          <Chrome className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">{t('od.nanoTitle')}</span>
        </div>
        {!nanoOk ? (
          <p className="text-xs text-muted-foreground">{t('od.nanoUnsupported')}</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-2">
              {nanoMsg || t('od.nanoSelectHint')}
            </p>
            <Button variant="outline" size="sm" onClick={checkNano} disabled={nanoChecking} className="gap-2">
              {nanoChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {nanoChecking ? t('od.nanoChecking') : t('od.nanoCheck')}
            </Button>
          </>
        )}
      </div>

      {/* WebLLM (downloadable on-device model) */}
      <div className={`rounded-lg border border-border p-3 ${gpuOk ? '' : 'opacity-60'}`}>
        <div className="flex items-center gap-2 mb-1">
          <Download className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">{t('od.webllmTitle')}</span>
          {ready && (
            <span className="inline-flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-3 h-3" /> {t('od.ready')}
            </span>
          )}
        </div>
        {!gpuOk ? (
          <p className="text-xs text-muted-foreground">{t('od.webllmUnsupported')}</p>
        ) : (
          <>
            {webllmMsg && <p className="text-xs text-muted-foreground mb-2">{webllmMsg}</p>}
            <Button variant="outline" size="sm" onClick={checkWebgpu} disabled={webllmChecking} className="gap-2 mb-3">
              {webllmChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {webllmChecking ? t('od.nanoChecking') : t('od.nanoCheck')}
            </Button>
            <div className="flex items-end gap-2 mt-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">{t('od.model')}</label>
                <Select value={model} onValueChange={setModel} disabled={setupBusy}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WEBLLM_MODELS.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.label} ({m.size})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSetup} disabled={setupBusy} className="gap-2 shrink-0">
                {setupBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                {setupBusy ? t('od.downloadingPct', { pct }) : (ready ? t('od.resetup') : t('od.setup'))}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">{t('od.webllmNote')}</p>
          </>
        )}
      </div>
    </div>
  );
}
