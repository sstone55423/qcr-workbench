import { useEffect, useRef } from 'react';
import { useVault } from '@/lib/VaultContext';

// Idle auto-lock: locks the vault back to the store picker after a period of no
// user activity. Maps to SOC 2 CC6 / ISO 27001 A.8 / HIPAA §164.312 automatic
// logoff. The timeout is a non-secret preference in localStorage so it applies
// live. 0 = disabled. Default 30 minutes.
const KEY = 'qcr-autolock-min';
const DEFAULT_MIN = 30;

export function getAutoLockMinutes() {
  const raw = localStorage.getItem(KEY);
  if (raw === null) return DEFAULT_MIN;
  const v = parseInt(raw, 10);
  return Number.isNaN(v) ? DEFAULT_MIN : v;
}

export function setAutoLockMinutes(min) {
  try { localStorage.setItem(KEY, String(min)); } catch { /* storage unavailable */ }
}

export default function AutoLock() {
  const { lock } = useVault();
  const lastActivity = useRef(Date.now());

  useEffect(() => {
    const bump = () => { lastActivity.current = Date.now(); };
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, bump, { passive: true }));

    // Re-reads the setting each tick, so changes take effect without a reload.
    const interval = setInterval(() => {
      const min = getAutoLockMinutes();
      if (min > 0 && Date.now() - lastActivity.current >= min * 60_000) {
        lock();
      }
    }, 15_000);

    return () => {
      clearInterval(interval);
      events.forEach(e => window.removeEventListener(e, bump));
    };
  }, [lock]);

  return null;
}
