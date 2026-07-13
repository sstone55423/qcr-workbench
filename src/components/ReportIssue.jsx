import React, { useState } from 'react';
import { LifeBuoy, Send, Copy, Check } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/I18nContext';
import { APP_NAME, APP_VERSION, APP_SUPPORT_EMAIL } from '@/lib/citation';

// "Report an issue" — no backend, so it composes an email in the user's own mail
// app (mailto) pre-filled with their description, an optional reply address, and
// non-sensitive diagnostics. The user reviews and sends; nothing is transmitted
// by the app itself. A "Copy details" fallback covers webmail-only users.
export default function ReportIssue() {
  const { t, language } = useI18n();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);

  const body = () => {
    const parts = [desc.trim()];
    if (email.trim()) parts.push('', `Reply to: ${email.trim()}`);
    parts.push(
      '',
      '--- diagnostics (please keep) ---',
      `App: ${APP_NAME} v${APP_VERSION}`,
      `Language: ${language}`,
      `Browser: ${typeof navigator !== 'undefined' ? navigator.userAgent : ''}`,
    );
    return parts.join('\n');
  };

  const send = () => {
    if (!desc.trim()) { toast({ title: t('report.needDesc'), variant: 'destructive' }); return; }
    const mailto = `mailto:${APP_SUPPORT_EMAIL}?subject=${encodeURIComponent(`${APP_NAME} Report`)}&body=${encodeURIComponent(body())}`;
    window.location.href = mailto;
  };

  const copy = async () => {
    if (!desc.trim()) { toast({ title: t('report.needDesc'), variant: 'destructive' }); return; }
    try {
      await navigator.clipboard.writeText(`To: ${APP_SUPPORT_EMAIL}\n\n${body()}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast({ title: t('report.copied') });
    } catch {
      toast({ title: t('cite.copyFailed'), variant: 'destructive' });
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <LifeBuoy className="w-3.5 h-3.5" /> {t('report.button')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('report.button')}</DialogTitle>
            <DialogDescription>{t('report.desc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('report.issueLabel')}</label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                rows={5}
                placeholder={t('report.issuePlaceholder')}
                autoFocus
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring resize-y"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('report.emailLabel')}</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <p className="text-[11px] text-muted-foreground">{t('report.sendTo', { email: APP_SUPPORT_EMAIL })}</p>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={copy} className="gap-2 text-muted-foreground">
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {t('report.copy')}
            </Button>
            <Button onClick={send} className="gap-2">
              <Send className="w-4 h-4" /> {t('report.send')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
