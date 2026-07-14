import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// The Help dialogs lazy-load translated copies of the two in-app documents
// from docs/i18n/ (English at the repo root stays authoritative). This guards
// against a language being added to the app without its documents.
const LANGS = ['es', 'de', 'fr', 'pt', 'tr', 'ru'];
const DOCS = ['DATA-PRIVACY', 'AI-GOVERNANCE'];

describe('translated in-app documents', () => {
  it.each(DOCS.flatMap((doc) => LANGS.map((lang) => [doc, lang])))(
    '%s.%s.md exists and is a substantive markdown document',
    (doc, lang) => {
      const file = path.join(process.cwd(), 'docs', 'i18n', `${doc}.${lang}.md`);
      expect(fs.existsSync(file), `${file} missing`).toBe(true);
      const text = fs.readFileSync(file, 'utf-8');
      expect(text.startsWith('# ')).toBe(true);
      expect(text.length).toBeGreaterThan(500);
      // Each translation must carry the authoritative-English note (a blockquote
      // naming the original file near the top).
      expect(text.slice(0, 500)).toContain(`${doc}.md`);
    },
  );
});
