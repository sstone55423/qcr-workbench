// Lexical retrieval over small bundled reference corpora (compromise-type
// knowledge base, control catalog, sample scenarios). Deliberately zero-
// infrastructure: no embeddings, no network, no index build step — the corpora
// are tens of documents, where tuned keyword overlap is deterministic,
// debuggable, and works offline with every AI provider including on-device
// models. Ported from the EU-AI-Helper app's Act-text retriever. If a corpus
// ever outgrows the bundle, the Vectorize upgrade path is documented in
// docs/V2-CLOUDFLARE.md — don't grow this file into a vector store.

// Generic English noise plus domain terms that appear in nearly every QCR
// document and would otherwise dominate scoring ("attack", "loss", "risk"...).
// Tokens shorter than 3 chars are dropped before this list is consulted.
const STOPWORDS = new Set([
  // generic English
  'and', 'the', 'for', 'that', 'with', 'this', 'from', 'are', 'was', 'were',
  'has', 'have', 'had', 'not', 'its', 'their', 'they', 'them', 'can', 'will',
  'into', 'onto', 'over', 'than', 'then', 'when', 'where', 'which', 'while',
  'also', 'been', 'but', 'more', 'most', 'such', 'may', 'often', 'these',
  'those', 'through', 'without', 'whether', 'because', 'one', 'per', 'via',
  'use', 'used', 'uses', 'using', 'who', 'what', 'how', 'all', 'any', 'out',
  'own', 'off', 'other', 'only', 'usually', 'many', 'much', 'like', 'makes',
  'make', 'come', 'comes', 'both', 'first', 'between', 'against',
  // QCR domain noise — present in almost every scenario/brief, so a match
  // carries no signal. Note "data"/"breach" are NOT here: they separate
  // data-centric types from availability-centric ones.
  'attack', 'attacks', 'attacker', 'attackers', 'security', 'cyber', 'risk',
  'risks', 'loss', 'losses', 'cost', 'costs', 'organization', 'organizations',
  'scenario', 'scenarios', 'system', 'systems', 'event', 'events', 'year',
  'annual', 'control', 'controls', 'threat', 'threats',
]);

// Lowercase, split on non-alphanumeric, drop short tokens and stopwords, and
// bridge naive plurals ("backups" also yields "backup") so query and document
// vocabulary meet without a stemmer.
export function tokenize(text) {
  const out = new Set();
  for (const raw of String(text || '').toLowerCase().split(/[^a-z0-9]+/)) {
    if (raw.length < 3 || STOPWORDS.has(raw)) continue;
    out.add(raw);
    if (raw.length > 3 && raw.endsWith('s')) out.add(raw.slice(0, -1));
  }
  return out;
}

// Token sets are memoized per document object — the corpora are module-level
// constants, so the cache is computed once and never goes stale.
const tokenCache = new WeakMap();
function docTokens(doc) {
  let cached = tokenCache.get(doc);
  if (!cached) {
    cached = { title: tokenize(doc.title), body: tokenize(doc.body) };
    tokenCache.set(doc, cached);
  }
  return cached;
}

// Rank `docs` ({id, title, body, ...rest}) against a free-text query.
// Scoring is intentionally simple (title hit = 3, body hit = 1, no IDF):
// with corpora this small, tuning the stopword list beats tuning the ranker.
// Returns [{doc, score}] with score > 0, best first, capped at `max`.
export function searchDocs(docs, query, max = 4) {
  const queryTokens = tokenize(query);
  if (queryTokens.size === 0) return [];
  const scored = [];
  for (const doc of docs) {
    const { title, body } = docTokens(doc);
    let score = 0;
    for (const token of queryTokens) {
      if (title.has(token)) score += 3;
      else if (body.has(token)) score += 1;
    }
    if (score > 0) scored.push({ doc, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, max);
}

// Query-focused excerpt for long bodies (used by the MCP search tool, where
// returning a full document would waste the caller's context). Splits into
// paragraphs, scores each by query overlap, greedily packs the best into the
// char budget, then re-emits survivors in ORIGINAL order with […] marking
// elided runs — so the excerpt still reads top-to-bottom.
export function excerptBody(body, query, maxChars = 700) {
  const text = String(body || '');
  if (text.length <= maxChars) return text;
  const queryTokens = tokenize(query);
  const paragraphs = text.split(/\n\n+/);
  const scored = paragraphs.map((p, index) => {
    const tokens = tokenize(p);
    let score = 0;
    for (const token of queryTokens) if (tokens.has(token)) score += 1;
    return { p, index, score };
  });
  const picked = new Set();
  let used = 0;
  for (const item of [...scored].sort((a, b) => b.score - a.score)) {
    if (used + item.p.length > maxChars && picked.size > 0) continue;
    picked.add(item.index);
    used += item.p.length;
    if (used >= maxChars) break;
  }
  const parts = [];
  let eliding = false;
  for (const item of scored) {
    if (picked.has(item.index)) {
      parts.push(item.p);
      eliding = false;
    } else if (!eliding) {
      parts.push('[…]');
      eliding = true;
    }
  }
  return parts.join('\n\n');
}
