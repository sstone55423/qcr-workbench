import { describe, it, expect } from 'vitest';
import { SAMPLE_LIBRARIES, findSampleById, getLibrary } from '@/data/sampleLibraries';
import { validateFairModel } from '@/lib/qcr/models';
import en from '@/lib/i18n/en';

const LOCALIZED_FIELDS = ['name', 'description', 'asset', 'threat', 'effect', 'owner', 'unitTef', 'a1', 'a2', 'a3'];

describe('sample libraries', () => {
  it('scenario ids are unique across all libraries', () => {
    const ids = SAMPLE_LIBRARIES.flatMap((library) => library.scenarios.map((s) => s.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every scenario has a valid FAIR model and three assumptions', () => {
    for (const library of SAMPLE_LIBRARIES) {
      for (const scenario of library.scenarios) {
        expect(() => validateFairModel(scenario.fair), scenario.id).not.toThrow();
        expect(scenario.assumptions, scenario.id).toHaveLength(3);
      }
    }
  });

  it('every scenario is fully covered by samples.* dictionary keys (localizeSample contract)', () => {
    for (const library of SAMPLE_LIBRARIES) {
      expect(en[library.labelKey], library.labelKey).toBeTruthy();
      for (const scenario of library.scenarios) {
        for (const field of LOCALIZED_FIELDS) {
          expect(en[`samples.${scenario.id}.${field}`], `samples.${scenario.id}.${field} missing`).toBeTruthy();
        }
      }
    }
  });

  it('findSampleById searches every library; getLibrary falls back to the default', () => {
    expect(findSampleById('he-ransomware')?.name).toBe('Ransomware Locks Administrative Systems');
    expect(findSampleById('hc-ransomware')?.name).toBe('Ransomware Forces EHR Downtime');
    expect(findSampleById('ransomware')?.name).toBe('Ransomware Disrupts Manufacturing');
    expect(findSampleById('nope')).toBeNull();
    expect(getLibrary('unknown').id).toBe('stella-polaris');
  });
});
