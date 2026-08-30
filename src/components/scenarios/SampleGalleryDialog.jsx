import React from 'react';
import { useI18n } from '@/lib/I18nContext';
import { SAMPLE_LIBRARIES } from '@/data/sampleLibraries';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Factory, GraduationCap, HeartPulse, Landmark, Building2, School, Wheat,
  ShoppingCart, ShoppingBag, Truck, Siren, Users, RadioTower, ShieldCheck,
  Zap, Scale, House, Gavel, Vote, Ambulance, Newspaper, Sparkles, Check, Loader2,
} from 'lucide-react';

// One recognizable icon per bundled library, keyed by library id. Falls back to
// a generic Sparkles for any library without an explicit mapping.
const LIBRARY_ICONS = {
  'stella-polaris': Factory,
  'higher-ed': GraduationCap,
  healthcare: HeartPulse,
  'financial-services': Landmark,
  'city-government': Building2,
  'school-district': School,
  'cattle-ranch': Wheat,
  'grocery-chain': ShoppingCart,
  ecommerce: ShoppingBag,
  transportation: Truck,
  'public-safety': Siren,
  staffing: Users,
  telecom: RadioTower,
  mssp: ShieldCheck,
  'energy-coop': Zap,
  legal: Scale,
  'real-estate': House,
  courts: Gavel,
  elections: Vote,
  'emergency-services': Ambulance,
  media: Newspaper,
};

// The library labels read "Sector — Company"; split so the card can show the
// sector as the title and the organization as the subtitle. Falls back to the
// language-neutral company proper noun when no dash is present.
function splitLabel(label, company) {
  const [sector, ...rest] = label.split('—');
  return { sector: sector.trim(), company: rest.join('—').trim() || company };
}

// Visual gallery of the bundled industry example libraries. Replaces the old
// long dropdown: clicking a card loads that library. The dialog stays open so a
// user (e.g. a class exploring) can load several; already-loaded libraries are
// marked, and the picking card shows a spinner while its load runs.
export default function SampleGalleryDialog({ open, onClose, onSelect, loading = false, pendingId = null, loadedIds }) {
  const { t } = useI18n();
  const loaded = loadedIds || new Set();

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary shrink-0" /> {t('scenarios.galleryTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('scenarios.galleryDesc', { count: SAMPLE_LIBRARIES.length })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 py-1">
          {SAMPLE_LIBRARIES.map((library) => {
            const { sector, company } = splitLabel(t(library.labelKey), library.company);
            const Icon = LIBRARY_ICONS[library.id] || Sparkles;
            const isLoaded = loaded.has(library.id);
            const isPending = pendingId === library.id;
            return (
              <button
                key={library.id}
                type="button"
                disabled={loading}
                onClick={() => onSelect(library.id)}
                className="group text-left border border-border rounded-xl p-4 flex flex-col gap-2 transition-all hover:border-primary/40 hover:shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between">
                  <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
                  </span>
                  {isLoaded && (
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Check className="w-3 h-3" /> {t('scenarios.galleryLoaded')}
                    </Badge>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-sm leading-snug">{sector}</h3>
                  <p className="text-xs text-muted-foreground truncate" title={company}>{company}</p>
                </div>
                <p className="text-[11px] text-muted-foreground mt-auto">
                  {t('scenarios.galleryCount', { count: library.scenarios.length })}
                </p>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
