// On-device AI providers that need no API key and send nothing off the device:
//   - Chrome built-in "Gemini Nano" via the Prompt API (window.LanguageModel)
//   - WebLLM (@mlc-ai/web-llm): a small quantized model running on WebGPU
// Both are dynamically loaded/feature-detected so unsupported browsers degrade
// gracefully instead of erroring. See DATA-PRIVACY.md — these run locally.

// ---- Chrome built-in (Gemini Nano / Prompt API) ----------------------------

// The Prompt API has shipped under a couple of shapes; support both.
export function nanoApi() {
  if (typeof globalThis === 'undefined') return null;
  return globalThis.LanguageModel || globalThis.ai?.languageModel || null;
}

// Synchronous "is the API present at all" check — enough to decide whether to
// offer the option (and for the provider dispatch to consider it).
export function nanoSupported() {
  return !!nanoApi();
}

// Cached availability so the sync provider resolver can know whether Nano is
// genuinely usable (not just present). Primed once at load; refreshed on any
// nanoAvailability() call.
let nanoCache = null; // null = not yet probed
let nanoProbe = null;

// Async readiness: 'available' | 'downloadable' | 'downloading' | 'unavailable'
// | 'unsupported'. Normalizes the older capabilities() vocabulary too.
export async function nanoAvailability() {
  const api = nanoApi();
  let result = 'unsupported';
  if (api) {
    try {
      if (typeof api.availability === 'function') {
        result = await api.availability();
      } else if (typeof api.capabilities === 'function') {
        const c = await api.capabilities();
        const map = { readily: 'available', 'after-download': 'downloadable', no: 'unavailable' };
        result = map[c?.available] || 'unavailable';
      } else {
        result = 'available';
      }
    } catch {
      result = 'unsupported';
    }
  }
  nanoCache = result;
  return result;
}

// Kicks off (once) a background availability probe and returns its promise.
export function primeNanoAvailability() {
  if (!nanoProbe) nanoProbe = nanoAvailability().catch(() => 'unsupported');
  return nanoProbe;
}

// Sync check used by the provider resolver: is Nano actually usable right now?
// If the probe hasn't finished, start it and report false for this call.
export function nanoUsable() {
  if (nanoCache === null) { primeNanoAvailability(); return false; }
  return nanoCache === 'available' || nanoCache === 'downloadable' || nanoCache === 'downloading';
}

export async function invokeNano(prompt) {
  const api = nanoApi();
  if (!api) throw new Error('Chrome built-in AI is not available in this browser.');
  const session = await api.create();
  try {
    return await session.prompt(prompt);
  } finally {
    session.destroy?.();
  }
}

// Probe availability as soon as the module loads (browser only), so that by the
// time a keyless user triggers an AI action, nanoUsable() reflects reality.
if (typeof window !== 'undefined') primeNanoAvailability();

// ---- WebLLM (on-device WebGPU model) ---------------------------------------

// Small, widely-cached quantized models. Ids match @mlc-ai/web-llm's prebuilt
// catalog. Weights download once and are cached by the browser thereafter.
export const WEBLLM_MODELS = [
  { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', label: 'Llama 3.2 · 1B', size: '~0.9 GB' },
  { id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', label: 'Llama 3.2 · 3B', size: '~2.2 GB' },
];

export function webgpuSupported() {
  return typeof navigator !== 'undefined' && !!navigator.gpu;
}

// Deeper check than webgpuSupported(): confirms a real GPU adapter is available,
// since a browser can expose navigator.gpu yet have no usable adapter.
// Returns 'available' | 'no-adapter' | 'unsupported'.
export async function webgpuAvailability() {
  if (!webgpuSupported()) return 'unsupported';
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return adapter ? 'available' : 'no-adapter';
  } catch {
    return 'no-adapter';
  }
}

// The engine is heavy and session-scoped: created lazily, reused across calls,
// and re-created after a reload (weights are cached, so re-init is fast).
let engine = null;
let engineModel = null;
let webllmMod = null;

async function loadWebLLM() {
  if (!webllmMod) webllmMod = await import('@mlc-ai/web-llm');
  return webllmMod;
}

// Downloads (first time) and initializes the model. onProgress receives the
// library's report object ({ progress: 0..1, text }). Used by the setup button.
export async function setupWebLLM(modelId, onProgress) {
  if (!webgpuSupported()) {
    throw new Error('WebGPU is not available in this browser. Use Chrome or Edge on a device with a modern graphics chip.');
  }
  const { CreateMLCEngine } = await loadWebLLM();
  engine = await CreateMLCEngine(modelId, {
    initProgressCallback: (r) => { try { onProgress?.(r); } catch { /* ignore */ } },
  });
  engineModel = modelId;
  return true;
}

export function webllmEngineReady(modelId) {
  return !!engine && (!modelId || engineModel === modelId);
}

export async function invokeWebLLM(prompt, modelId) {
  const id = modelId || (WEBLLM_MODELS[0] && WEBLLM_MODELS[0].id);
  if (!webllmEngineReady(id)) {
    // Not initialized in this session — load it (weights are cached, so this is
    // fast after the first-time download).
    await setupWebLLM(id, null);
  }
  const reply = await engine.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });
  return reply.choices?.[0]?.message?.content || '';
}
