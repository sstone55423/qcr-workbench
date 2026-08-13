import { describe, it, expect } from 'vitest';
import { CONTROL_CATALOG, findControlById } from '@/data/controlCatalog';

describe('control catalog integrity', () => {
  it('has unique ids and complete entries', () => {
    const ids = CONTROL_CATALOG.map((control) => control.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const control of CONTROL_CATALOG) {
      expect(control.name.length).toBeGreaterThan(0);
      expect(control.keywords.length).toBeGreaterThanOrEqual(3);
      expect(control.description.length).toBeGreaterThan(40);
      expect(control.frameworks.length).toBeGreaterThanOrEqual(2);
      expect(control.effectiveness_notes.length).toBeGreaterThan(40);
      expect(control.cost_notes.length).toBeGreaterThan(20);
    }
  });

  it('typical reductions are well-formed fractional ranges on known factors', () => {
    const factors = new Set(['frequency', 'vulnerability', 'primary_loss', 'secondary_loss']);
    for (const control of CONTROL_CATALOG) {
      const entries = Object.entries(control.typical_reductions);
      expect(entries.length).toBeGreaterThanOrEqual(1);
      for (const [factor, range] of entries) {
        expect(factors.has(factor)).toBe(true);
        const [lo, hi] = range;
        expect(lo).toBeGreaterThanOrEqual(0);
        expect(hi).toBeLessThanOrEqual(1);
        expect(lo).toBeLessThanOrEqual(hi);
      }
    }
  });

  it('findControlById resolves and misses cleanly', () => {
    expect(findControlById('phishing-resistant-mfa').name).toContain('MFA');
    expect(findControlById('nope')).toBeNull();
  });
});
