import React, { useState } from 'react';
import { BookOpen, Database, Sparkles, Key, ExternalLink, Zap, ShieldCheck, FileText, LifeBuoy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Copyright from '@/components/Copyright';
import Citation from '@/components/Citation';
import ReportIssue from '@/components/ReportIssue';
import { APP_FUNDING_URL, APP_KOFI_URL } from '@/lib/citation';
import { useI18n } from '@/lib/I18nContext';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
// The canonical docs, imported as raw markdown so the Help dialogs always render
// the same source the repo ships.
import privacyDoc from '../../DATA-PRIVACY.md?raw';
import governanceDoc from '../../AI-GOVERNANCE.md?raw';

const sections = [
  { icon: BookOpen, titleKey: 'help.s1Title', contentKey: 'help.s1' },
  { icon: ShieldCheck, titleKey: 'help.s7Title', contentKey: 'help.s7' },
  { icon: Database, titleKey: 'help.s2Title', contentKey: 'help.s2' },
  { icon: Sparkles, titleKey: 'help.s3Title', contentKey: 'help.s3' },
  { icon: Key, titleKey: 'help.s4Title', contentKey: 'help.s4' },
  { icon: Zap, titleKey: 'help.s5Title', contentKey: 'help.s5' },
  { icon: ExternalLink, titleKey: 'help.s6Title', contentKey: 'help.s6' },
];

export default function Help() {
  const { t } = useI18n();
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [govOpen, setGovOpen] = useState(false);

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-heading font-bold tracking-tight mb-1">{t('help.title')}</h1>
      <p className="text-sm text-muted-foreground mb-8">{t('help.subtitle')}</p>

      <div className="space-y-6">
        {sections.map((s, i) => (
          <div key={i} className="border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <s.icon className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-medium">{t(s.titleKey)}</h2>
            </div>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {t(s.contentKey).split('**').map((part, j) =>
                j % 2 === 1 ? <strong key={j} className="text-foreground">{part}</strong> : part
              )}
            </div>
            {s.contentKey === 'help.s7' && (
              <button
                onClick={() => setPrivacyOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <FileText className="w-3.5 h-3.5" />
                {t('help.s7Link')}
              </button>
            )}
            {s.contentKey === 'help.s3' && (
              <button
                onClick={() => setGovOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <FileText className="w-3.5 h-3.5" />
                {t('help.aiGovLink')}
              </button>
            )}
          </div>
        ))}
        <div className="border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <LifeBuoy className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-medium">{t('report.helpTitle')}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{t('report.helpText')}</p>
          <ReportIssue />
        </div>
        <Citation />
      </div>
      <Copyright />
      <p className="text-center text-xs text-muted-foreground -mt-6 pb-4">
        {t('help.supportText')}{' '}
        <a href={APP_FUNDING_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{t('help.supportLink')}</a>{' '}
        {t('help.supportOr')}{' '}
        <a href={APP_KOFI_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{t('help.supportKofi')}</a>.
      </p>

      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('help.s7Title')}</DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{privacyDoc}</ReactMarkdown>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={govOpen} onOpenChange={setGovOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('help.aiGovTitle')}</DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm dark:prose-invert max-w-none prose-table:text-xs">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{governanceDoc}</ReactMarkdown>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
