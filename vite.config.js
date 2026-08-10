import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { createHash } from 'node:crypto'
import { fileURLToPath, URL } from 'node:url'

// Content-Security-Policy for the PRODUCTION build only. Injected as a <meta>
// http-equiv so it ships without server config; see SECURITY.md for the
// rationale behind each directive and the recommended real HTTP headers
// (frame-ancestors / X-Content-Type-Options can only be set as headers).
//
// NOT applied to `npm run dev`: Vite's HMR client needs inline scripts and
// eval, which a strict script-src would break.
//
// connect-src is intentionally broad (https:) because BYO-key AI providers and
// WebLLM model weights live on arbitrary hosts, and Ollama runs on
// localhost — a tight allowlist would break those. The load-bearing protection
// here is script-src 'self' (blocks injected/inline script execution) plus
// object-src/base-uri lockdown.
// 'wasm-unsafe-eval' on script-src is required for the optional on-device AI
// (WebLLM) to compile its WebAssembly runtime. It permits WASM compilation only
// — it does NOT re-enable JS eval() or inline scripts, so the load-bearing
// script-src 'self' XSS control against injected scripts is unchanged. worker-src
// allows WebLLM's blob web worker. Model weights load over the already-broad
// connect-src https:. See SECURITY.md.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https: http://localhost:* http://127.0.0.1:*",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-src 'none'",
  "manifest-src 'self'",
].join('; ');

function cspMetaPlugin() {
  return {
    name: 'inject-csp-meta',
    apply: 'build',
    // Run last (order: 'post') so any inline scripts injected by other plugins
    // are already present and can be hashed.
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        // Whitelist exactly the inline <script> blocks that ship in the build by
        // their sha256 hash, so script-src stays 'self' (no 'unsafe-inline')
        // while still allowing known first-party inline scripts to run.
        const hashes = [];
        const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
        let m;
        while ((m = re.exec(html)) !== null) {
          if (!m[1].trim()) continue;
          hashes.push(`'sha256-${createHash('sha256').update(m[1], 'utf8').digest('base64')}'`);
        }
        const csp = hashes.length
          ? CSP.replace("script-src 'self'", `script-src 'self' ${hashes.join(' ')}`)
          : CSP;
        return html.replace(
          '</title>',
          `</title>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`
        );
      },
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Offline support: precaches the built assets so this local-first app
    // actually works with no network. Production build only (dev is skipped
    // by the plugin unless devOptions is enabled).
    VitePWA({
      // 'prompt' + manual registration (injectRegister:false): the app shows a
      // "new version available — reload" banner (PwaUpdatePrompt) instead of
      // silently swapping the build under an open tab, which left users on a
      // stale version after a deploy.
      registerType: 'prompt',
      injectRegister: false,
      // public/manifest.json already exists and index.html links it — don't
      // let the plugin generate a second manifest.
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json,woff2}'],
        // Precache everything except the ~6 MB WebLLM chunk; that one is
        // cached at runtime (rule below) only for users who enable
        // on-device AI.
        globIgnores: ['**/webllm-*.js'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/assets\//],
        // Fonts are now self-hosted and precached via globPatterns (woff2), so
        // the former Google Fonts runtime-caching rules are gone.
        runtimeCaching: [
          {
            urlPattern: /\/assets\/.*\.js$/,
            handler: 'CacheFirst',
            options: { cacheName: 'app-large-assets', expiration: { maxEntries: 20 } },
          },
        ],
      },
    }),
    cspMetaPlugin(),
  ],
  // Vitest runs unit tests only; the Playwright e2e specs under e2e/ are driven
  // separately by `npm run test:e2e` and must not be collected here.
  test: {
    include: ['src/**/*.test.{js,jsx}'],
  },
  // The '@' -> src alias was previously provided by the Base44 vite plugin.
  // Defined explicitly here so the app resolves imports standalone. Mirrors the
  // "@/*": ["./src/*"] mapping in jsconfig.json used by the editor/tsc.
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Name the WebLLM chunk so the service worker can exclude it from
        // precaching by name (see workbox.globIgnores above).
        manualChunks(id) {
          if (id.includes('@mlc-ai')) return 'webllm';
        },
      },
    },
  },
});
