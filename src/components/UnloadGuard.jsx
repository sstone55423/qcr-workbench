import { useEffect, useRef } from 'react';
import { useProject } from '@/lib/ProjectContext';
import { backupStatus } from '@/lib/backupService';

// Triggers the browser's generic "Leave site?" confirmation when the tab/window
// is closed with data present and no recent backup. Gated on `overdue` so it
// never nags users who back up regularly, and skipped for an empty vault. The
// prompt wording is fixed by the browser and cannot be customized. This only
// mounts inside the unlocked app, so the lock screen never triggers it.
export default function UnloadGuard() {
  const { projects } = useProject();
  // A ref so the long-lived beforeunload handler always sees the latest count
  // without needing to re-register.
  const hasDataRef = useRef(false);
  hasDataRef.current = Array.isArray(projects) && projects.length > 0;

  useEffect(() => {
    const handler = (e) => {
      if (hasDataRef.current && backupStatus().overdue) {
        e.preventDefault();
        e.returnValue = ''; // required by Chrome to show the prompt
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  return null;
}
