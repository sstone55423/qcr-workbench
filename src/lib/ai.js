// Provider-agnostic AI invocation. Dispatches to the configured provider,
// defaulting to the first provider in order that has credentials.

import { appSettings } from '@/lib/localdb/store';
import { invokeClaude } from '@/lib/anthropic';
import { aiLanguageDirective } from '@/lib/i18n';
import { nanoSupported, nanoUsable, primeNanoAvailability, invokeNano, invokeWebLLM } from '@/lib/localAI';

export const AI_PROVIDERS = [
  { id: 'anthropic', label: 'Claude (Anthropic)' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'gemini', label: 'Gemini (Google)' },
  { id: 'ollama', label: 'Local (Ollama)' },
  { id: 'qwen', label: 'Qwen (DashScope)' },
  { id: 'cerebras', label: 'Cerebras' },
  // On-device, no key. Ranked last so a configured cloud key wins under "auto".
  { id: 'nano', label: 'Chrome Built-in (Gemini Nano)' },
  { id: 'webllm', label: 'Built-in AI (on-device)' },
];

export function hasCredentials(providerId, s) {
  if (providerId === 'anthropic') return !!s.anthropic_key;
  if (providerId === 'openai') return !!s.openai_key;
  if (providerId === 'gemini') return !!s.gemini_key;
  if (providerId === 'ollama') return !!s.ollama_url;
  if (providerId === 'qwen') return !!s.qwen_key;
  if (providerId === 'cerebras') return !!s.cerebras_key;
  // 'nano' counts as "available" only when the browser reports it usable, so a
  // keyless user auto-defaults to it (and never to an unusable Nano).
  if (providerId === 'nano') return nanoUsable();
  if (providerId === 'webllm') return !!s.webllm_model;
  return false;
}

export function resolveProvider(s) {
  if (s.ai_provider && s.ai_provider !== 'auto' && hasCredentials(s.ai_provider, s)) {
    return s.ai_provider;
  }
  const found = AI_PROVIDERS.find(p => hasCredentials(p.id, s));
  return found ? found.id : null;
}

// Best-effort model label per provider, for provenance/accountability records.
const PROVIDER_MODELS = {
  anthropic: () => 'Claude',
  openai: () => 'gpt-4o',
  gemini: () => 'gemini-2.5-flash',
  qwen: () => 'qwen-plus',
  cerebras: () => 'llama-3.3-70b',
  ollama: (s) => s.ollama_model || 'llama3.1',
  nano: () => 'Gemini Nano (on-device)',
  webllm: (s) => s.webllm_model || 'on-device model',
};

export function describeAI(providerId, s) {
  const label = AI_PROVIDERS.find(p => p.id === providerId)?.label || providerId || 'AI';
  const fn = PROVIDER_MODELS[providerId];
  return { provider: providerId, label, model: fn ? fn(s) : '' };
}

// Provenance of the most recent AI call (provider, model, timestamp) so callers
// can stamp outputs and audit entries for accountability (NIST AI RMF / ISO 42001).
let lastAIRun = null;
export function getLastAIRun() { return lastAIRun; }

// Resolves which AI would handle a call right now, for UI that tells the user
// before/while generating. Returns { provider, label, model } or null if none.
export async function resolveAIDescription(settings) {
  const s = settings || await appSettings.get();
  let provider = resolveProvider(s);
  if (!provider && nanoSupported()) {
    await primeNanoAvailability();
    provider = resolveProvider(s);
  }
  return provider ? describeAI(provider, s) : null;
}

function withSchema(prompt, jsonSchema) {
  return jsonSchema
    ? `${prompt}\n\nRespond ONLY with valid JSON matching this schema (no prose, no code fences):\n${JSON.stringify(jsonSchema)}`
    : prompt;
}

function parseResult(text, jsonSchema) {
  if (!jsonSchema) return text;
  const match = text.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : text);
}

// OpenAI-compatible chat completions (used by OpenAI, Qwen, and Ollama).
async function chatCompletions({ baseUrl, apiKey, model, prompt }) {
  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `AI API error (${resp.status})`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}

async function invokeGemini({ apiKey, prompt }) {
  // SECURITY: key is in the query string because the Google Generative Language
  // API expects ?key=. Prefer the x-goog-api-key header if migrating. See SECURITY.md.
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API error (${resp.status})`);
  }
  const data = await resp.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// skipLanguageDirective: set for calls whose output should match the corpus
// language rather than the UI language (e.g. keyword extraction).
export async function invokeAI({ prompt, jsonSchema = null, settings = null, skipLanguageDirective = false }) {
  const s = settings || await appSettings.get();
  let provider = resolveProvider(s);
  // Keyless default: if nothing resolved but Chrome's built-in AI is present,
  // wait for the availability probe and retry — so the first call after load
  // doesn't lose the race with the async check.
  if (!provider && nanoSupported()) {
    await primeNanoAvailability();
    provider = resolveProvider(s);
  }
  if (!provider) {
    throw new Error('No AI provider configured. Add an API key in Settings, or use the built-in on-device AI.');
  }
  lastAIRun = { ...describeAI(provider, s), at: new Date().toISOString() };

  // Steer generated prose into the user's chosen interface language.
  const directedPrompt = skipLanguageDirective ? prompt : prompt + aiLanguageDirective(s.language);

  if (provider === 'anthropic') {
    return invokeClaude({ apiKey: s.anthropic_key, prompt: directedPrompt, jsonSchema });
  }

  const fullPrompt = withSchema(directedPrompt, jsonSchema);
  let text;
  if (provider === 'nano') {
    text = await invokeNano(fullPrompt);
  } else if (provider === 'webllm') {
    text = await invokeWebLLM(fullPrompt, s.webllm_model);
  } else if (provider === 'openai') {
    text = await chatCompletions({
      baseUrl: 'https://api.openai.com/v1',
      apiKey: s.openai_key,
      model: 'gpt-4o',
      prompt: fullPrompt,
    });
  } else if (provider === 'gemini') {
    text = await invokeGemini({ apiKey: s.gemini_key, prompt: fullPrompt });
  } else if (provider === 'qwen') {
    text = await chatCompletions({
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKey: s.qwen_key,
      model: 'qwen-plus',
      prompt: fullPrompt,
    });
  } else if (provider === 'cerebras') {
    text = await chatCompletions({
      baseUrl: 'https://api.cerebras.ai/v1',
      apiKey: s.cerebras_key,
      model: 'llama-3.3-70b',
      prompt: fullPrompt,
    });
  } else if (provider === 'ollama') {
    text = await chatCompletions({
      baseUrl: s.ollama_url.replace(/\/$/, '') + '/v1',
      apiKey: null,
      model: s.ollama_model || 'llama3.1',
      prompt: fullPrompt,
    });
  }
  return parseResult(text, jsonSchema);
}