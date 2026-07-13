import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useI18n } from '@/lib/I18nContext';

export default function NoProject() {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">{t('common.selectProjectFirst')}</p>
      </div>
    </div>
  );
}
