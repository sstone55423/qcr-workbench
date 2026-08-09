import { useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Registers the service worker and shows a small banner when a new build is
// ready, so the user reloads on their terms rather than being surprised by a
// silent swap mid-analysis — and so a normal reload after a deploy no longer
// serves the stale cached version.
//
// Rendered at the app ROOT, outside the i18n provider (which lives inside the
// vault gate), so it also covers the lock screen — hence hardcoded English,
// the same convention as LockScreen.
export default function PwaUpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const updateSW = useRef(null);

  useEffect(() => {
    updateSW.current = registerSW({
      immediate: true,
      onNeedRefresh() { setNeedRefresh(true); },
    });
  }, []);

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg max-w-[calc(100vw-2rem)]">
      <span className="text-sm text-foreground">A new version is available.</span>
      <Button size="sm" className="gap-1.5 shrink-0" onClick={() => updateSW.current?.(true)}>
        <RefreshCw className="w-3.5 h-3.5" /> Reload
      </Button>
    </div>
  );
}
