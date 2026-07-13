import React, { useState } from 'react';
import { Copy, Check, Quote, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/I18nContext';
import { APP_NAME, APP_VERSION, CITATIONS } from '@/lib/citation';

// Understated "please consider citing" block for the Help/About surface. The
// request wording is translated; the citation formats are verbatim bibliographic
// data behind a collapsed "Show citation formats" toggle so it stays unobtrusive.
export default function Citation() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState('');

  const copy = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(''), 1500);
      toast({ title: t('cite.copied') });
    } catch {
      toast({ title: t('cite.copyFailed'), variant: 'destructive' });
    }
  };

  return (
    <div className="border border-border rounded-xl p-5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Quote className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-medium">{t('cite.title')}</h2>
        </div>
        <span className="text-xs text-muted-foreground">{APP_NAME} · v{APP_VERSION}</span>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
        {t('cite.request', { name: APP_NAME })}
      </p>

      <button
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        {t('cite.show')}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {CITATIONS.map(c => (
            <div key={c.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{c.label}</span>
                <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => copy(c.id, c.text)}>
                  {copied === c.id ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                  {t('cite.copy')}
                </Button>
              </div>
              <pre className="text-[11px] bg-muted/50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap wrap-break-word font-mono">{c.text}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
