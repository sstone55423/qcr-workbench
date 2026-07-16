import { describe, it, expect } from 'vitest';
import { TUTORIAL_STEPS } from '@/lib/tutorial';
import en from '@/lib/i18n/en';

describe('tutorial steps', () => {
  it('every step resolves to real dictionary keys', () => {
    expect(TUTORIAL_STEPS).toHaveLength(10);
    for (const step of TUTORIAL_STEPS) {
      expect(en[step.titleKey], `${step.titleKey} missing`).toBeTruthy();
      expect(en[step.bodyKey], `${step.bodyKey} missing`).toBeTruthy();
    }
  });

  it('navigation targets are client-side app routes', () => {
    for (const step of TUTORIAL_STEPS) {
      if (step.to) expect(step.to).toMatch(/^\//);
    }
  });
});
