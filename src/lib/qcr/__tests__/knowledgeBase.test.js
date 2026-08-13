import { describe, it, expect } from 'vitest';
import { KNOWLEDGE_BASE, kbForType } from '@/lib/qcr/knowledgeBase';
import { COMPROMISE_TYPES, OTHER_COMPROMISE } from '@/lib/qcr/compromiseTypes';

describe('knowledge base ↔ compromise-type catalog', () => {
  it('covers every catalog type exactly once', () => {
    const kbIds = KNOWLEDGE_BASE.map((entry) => entry.typeId);
    expect(new Set(kbIds).size).toBe(kbIds.length); // no duplicates
    expect([...kbIds].sort()).toEqual(COMPROMISE_TYPES.map((type) => type.id).sort());
  });

  it('every entry has in-depth paragraphs and incidents with name/year/summary', () => {
    for (const entry of KNOWLEDGE_BASE) {
      expect(entry.inDepth.length).toBeGreaterThanOrEqual(1);
      for (const paragraph of entry.inDepth) {
        expect(typeof paragraph).toBe('string');
        expect(paragraph.length).toBeGreaterThan(100);
      }
      expect(entry.incidents.length).toBeGreaterThanOrEqual(2);
      for (const incident of entry.incidents) {
        expect(incident.name.length).toBeGreaterThan(0);
        expect(String(incident.year)).toMatch(/\d{4}/);
        expect(incident.summary.length).toBeGreaterThan(20);
      }
    }
  });

  it('kbForType finds entries by id and returns null for the unclassified fallback', () => {
    expect(kbForType('ransomware').typeId).toBe('ransomware');
    expect(kbForType(OTHER_COMPROMISE.id)).toBeNull();
    expect(kbForType('nonexistent')).toBeNull();
  });
});
