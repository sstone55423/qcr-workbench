import React, { useState, useEffect } from 'react';
import { BookOpen, Database, Sparkles, Key, ExternalLink, Zap, ShieldCheck, FileText, LifeBuoy, GraduationCap } from 'lucide-react';
import { setTutorialState } from '@/lib/tutorial';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Copyright from '@/components/Copyright';
import Citation from '@/components/Citation';
import ReportIssue from '@/components/ReportIssue';
import { APP_FUNDING_URL, APP_KOFI_URL, FAIR_INSTITUTE_URL } from '@/lib/citation';
import { useI18n } from '@/lib/I18nContext';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
// The canonical docs, imported as raw markdown so the Help dialogs always render
// the same source the repo ships. Translations live in docs/i18n/ as separate
// lazy chunks (each notes that the English original is authoritative) and are
// swapped in when a non-English language is active; English is the fallback.
import privacyDoc from '../../DATA-PRIVACY.md?raw';
import governanceDoc from '../../AI-GOVERNANCE.md?raw';

const privacyTranslations = import.meta.glob('../../docs/i18n/DATA-PRIVACY.*.md', { query: '?raw', import: 'default' });
const governanceTranslations = import.meta.glob('../../docs/i18n/AI-GOVERNANCE.*.md', { query: '?raw', import: 'default' });

// Resolves a doc in the given language, falling back to the English original.
async function loadDoc(loaders, language, fallback) {
  const loader = loaders[Object.keys(loaders).find((k) => k.endsWith(`.${language}.md`)) || ''];
  if (!loader) return fallback;
  try {
    return await loader();
  } catch {
    return fallback; // chunk fetch failed (e.g. offline before first use)
  }
}

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
  const { t, language } = useI18n();
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [govOpen, setGovOpen] = useState(false);
  const [privacyText, setPrivacyText] = useState(privacyDoc);
  const [govText, setGovText] = useState(governanceDoc);

  useEffect(() => {
    let stale = false;
    loadDoc(privacyTranslations, language, privacyDoc).then((text) => { if (!stale) setPrivacyText(text); });
    loadDoc(governanceTranslations, language, governanceDoc).then((text) => { if (!stale) setGovText(text); });
    return () => { stale = true; };
  }, [language]);

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-heading font-bold tracking-tight mb-1">{t('help.title')}</h1>
      <p className="text-sm text-muted-foreground mb-8">{t('help.subtitle')}</p>

      <div className="space-y-6">
        <div className="border border-primary/30 bg-primary/5 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1.5">
            <GraduationCap className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-medium">{t('tut.helpTitle')}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{t('tut.helpDesc')}</p>
          <Button size="sm" onClick={() => setTutorialState({ active: true, step: 0 })} className="gap-2">
            <GraduationCap className="w-4 h-4" /> {t('tut.start')}
          </Button>
        </div>

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
            {s.contentKey === 'help.s5' && (
              <p className="mt-3 text-sm text-muted-foreground">
                {t('help.fairCredit')}{' '}
                <a
                  href={FAIR_INSTITUTE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {t('help.fairLink')} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </p>
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
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{privacyText}</ReactMarkdown>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={govOpen} onOpenChange={setGovOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('help.aiGovTitle')}</DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm dark:prose-invert max-w-none prose-table:text-xs">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{govText}</ReactMarkdown>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
