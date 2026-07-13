import React from 'react';
import { Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/I18nContext';

// Transparency label shown on AI-generated output. Satisfies the EU AI Act
// Article 50 disclosure obligation and the NIST AI RMF / ISO 42001 transparency
// principle: AI content is clearly marked and flagged as fallible.
export default function AIDisclosure({ className = '' }) {
  const { t } = useI18n();
  return (
    <div className={`flex items-start gap-1.5 text-xs text-muted-foreground rounded-lg bg-primary/5 border border-primary/15 px-3 py-2 ${className}`}>
      <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
      <span>{t('ai.disclosure')}</span>
    </div>
  );
}
