import React from 'react';
import { useI18n } from '@/lib/I18nContext';
import { toleranceStatus } from '@/lib/qcr/tolerance';
import { formatCurrency, formatPercent } from '@/lib/qcr/format';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

// One-line appetite verdict under an exceedance chart. Renders nothing when
// no tolerance is defined or no simulation exists.
export default function ToleranceStatus({ exceedance, tolerance }) {
  const { t } = useI18n();
  const status = toleranceStatus(exceedance, tolerance);
  if (!status) return null;
  const Icon = status.within ? ShieldCheck : ShieldAlert;
  return (
    <p className={`text-sm flex items-start gap-1.5 ${status.within ? 'text-primary' : 'text-destructive'}`}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      {t(status.within ? 'tolerance.statusWithin' : 'tolerance.statusExceeds', {
        actual: formatPercent(status.probability),
        threshold: formatCurrency(tolerance.threshold),
        appetite: formatPercent(tolerance.probability),
      })}
    </p>
  );
}
