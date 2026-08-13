import { describe, it, expect } from 'vitest';
import { tokenize, searchDocs, excerptBody } from '@/lib/qcr/retrieval';

describe('tokenize', () => {
  it('lowercases, drops short tokens and stopwords, bridges plurals', () => {
    const tokens = tokenize('The Ransomware attacks encrypted Backups!');
    expect(tokens.has('ransomware')).toBe(true);
    expect(tokens.has('backups')).toBe(true);
    expect(tokens.has('backup')).toBe(true); // plural bridge
    expect(tokens.has('encrypted')).toBe(true);
    expect(tokens.has('the')).toBe(false); // stopword
    expect(tokens.has('attacks')).toBe(false); // domain-noise stopword
  });

  it('keeps discriminating domain terms out of the stopword list', () => {
    const tokens = tokenize('data breach phishing');
    expect(tokens.has('data')).toBe(true);
    expect(tokens.has('breach')).toBe(true);
    expect(tokens.has('phishing')).toBe(true);
  });

  it('is empty for empty or all-noise input', () => {
    expect(tokenize('').size).toBe(0);
    expect(tokenize('the and of an at').size).toBe(0);
    expect(tokenize(null).size).toBe(0);
  });
});

const docs = [
  { id: 'ransomware', title: 'Ransomware', body: 'Malware encrypts files and demands payment. Backups drive recovery.' },
  { id: 'phishing', title: 'Phishing', body: 'Fraudulent email lures recipients into revealing credentials.' },
  { id: 'ddos', title: 'Denial of Service', body: 'Traffic floods overwhelm a service so users cannot reach it.' },
];

describe('searchDocs', () => {
  it('ranks title matches above body matches', () => {
    // "phishing" hits the phishing doc's title (3) and nothing else.
    const hits = searchDocs(docs, 'phishing awareness');
    expect(hits[0].doc.id).toBe('phishing');
  });

  it('matches on body vocabulary', () => {
    const hits = searchDocs(docs, 'encrypted backups and recovery payment');
    expect(hits[0].doc.id).toBe('ransomware');
  });

  it('returns nothing for no overlap and respects max', () => {
    expect(searchDocs(docs, 'quantum blockchain')).toHaveLength(0);
    expect(searchDocs(docs, 'service email files', 3).length).toBeLessThanOrEqual(3);
    expect(searchDocs(docs, '')).toHaveLength(0);
  });

  it('is deterministic across repeat calls (token cache)', () => {
    const a = searchDocs(docs, 'credentials email');
    const b = searchDocs(docs, 'credentials email');
    expect(a.map((h) => [h.doc.id, h.score])).toEqual(b.map((h) => [h.doc.id, h.score]));
  });
});

describe('excerptBody', () => {
  const body = [
    'Alpha paragraph about firewalls and segmentation.',
    'Beta paragraph about ransomware encryption and backups.',
    'Gamma paragraph about phishing training.',
    'Delta paragraph about ransomware negotiation and recovery timelines.',
  ].join('\n\n');

  it('returns short bodies unchanged', () => {
    expect(excerptBody('short', 'anything', 100)).toBe('short');
  });

  it('keeps query-relevant paragraphs in original order and elides the rest', () => {
    const excerpt = excerptBody(body, 'ransomware backups recovery', 120);
    expect(excerpt).toContain('Beta');
    expect(excerpt).toContain('[…]');
    expect(excerpt).not.toContain('Gamma');
    // Original order preserved: Beta before Delta if both survive.
    const beta = excerpt.indexOf('Beta');
    const delta = excerpt.indexOf('Delta');
    if (delta !== -1) expect(beta).toBeLessThan(delta);
  });
});
