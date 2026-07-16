// Guided-tutorial state and step definitions. Progress lives in localStorage
// (non-secret UI preference, like the theme) so the tour survives lock/unlock
// and reloads; the floating guide component subscribes to changes so the
// Help page's start button and the guide stay in sync.

const KEY = 'qcr-tutorial';
const listeners = new Set();

export function getTutorialState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY));
    if (parsed && typeof parsed.step === 'number') return { active: !!parsed.active, step: parsed.step };
  } catch { /* corrupt or unavailable — start fresh */ }
  return { active: false, step: 0 };
}

export function setTutorialState(next) {
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
  listeners.forEach((listener) => listener(next));
}

export function subscribeTutorial(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// The 10 steps walk a complete analysis on the sample data. `to` navigates
// client-side (page reloads would re-lock the vault); steps without `to`
// direct the user to the workbench stepper, which is itself part of the
// lesson. Keys resolve through i18n at render time.
export const TUTORIAL_STEPS = [
  { titleKey: 'tut.s1Title', bodyKey: 'tut.s1Body', to: '/' },
  { titleKey: 'tut.s2Title', bodyKey: 'tut.s2Body', to: '/scenarios' },
  { titleKey: 'tut.s3Title', bodyKey: 'tut.s3Body', to: '/scenarios' },
  { titleKey: 'tut.s4Title', bodyKey: 'tut.s4Body', to: null },
  { titleKey: 'tut.s5Title', bodyKey: 'tut.s5Body', to: null },
  { titleKey: 'tut.s6Title', bodyKey: 'tut.s6Body', to: null },
  { titleKey: 'tut.s7Title', bodyKey: 'tut.s7Body', to: null },
  { titleKey: 'tut.s8Title', bodyKey: 'tut.s8Body', to: null },
  { titleKey: 'tut.s9Title', bodyKey: 'tut.s9Body', to: null },
  { titleKey: 'tut.s10Title', bodyKey: 'tut.s10Body', to: '/portfolio' },
];
