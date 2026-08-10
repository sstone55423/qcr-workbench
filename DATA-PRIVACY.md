# Data Privacy

QCR Workbench is designed so that **your risk data cannot leave your device
without an action you take**. This document is the complete inventory of where
data lives and every path it can travel.

## Where data lives

| Data | Location | Protection |
|---|---|---|
| Projects, scenarios, estimates, treatments, audit trail | Browser IndexedDB | AES-GCM-256, key derived from your passphrase (PBKDF2-SHA-256, 250,000 iterations, random salt) |
| App settings incl. AI API keys | Same encrypted store (`AppSettings` record) | Same encryption; never in localStorage or plaintext |
| Store registry (workspace names, optional hints) | localStorage | Not secret by design; contains **no** passphrases and **no** risk data |
| Theme, language-independent UI prefs, auto-lock minutes | localStorage | Not secret; needed before the vault unlocks |
| Optional lock-screen email | localStorage | Written **only** if you enable "show on lock screen"; cleared when disabled |

The derived encryption key exists only in memory while the vault is unlocked.
Locking the vault (manually or via auto-lock) discards it. **A forgotten
passphrase is unrecoverable** — there is no reset, no recovery email, no vendor
who can help. Export backups.

## Every network path, exhaustively

The app makes **zero** requests on its own. All of the following are
user-initiated:

1. **Cloud AI calls** (optional): when you click an AI action, the prompt —
   scenario names, descriptions, assumptions, and already-computed figures —
   goes **directly from your browser to the provider you configured**
   (Anthropic, OpenAI, Google, or Alibaba), authenticated with your own key.
   There is no proxy. Use on-device AI (WebLLM or Chrome built-in) or local
   Ollama to keep even this on your machine.
2. **On-device model download** (optional, once): enabling WebLLM downloads
   quantized model weights from its public CDN; the browser caches them.
3. **Nothing else.** No telemetry, no analytics, no error reporting, no update
   pings, no first-party API. The UI fonts (Inter, Source Serif 4) are
   **self-hosted** in the bundle — there is no Google Fonts request or any other
   third-party asset fetch.

## Backups and exports

- **Encrypted backup** (recommended): a JSON file encrypted under a passphrase
  you choose (same PBKDF2 + AES-GCM scheme). Safe to store anywhere.
- **Unencrypted backup** (opt-in, warned): plaintext JSON of everything,
  including saved API keys. Offered only as a last-resort safeguard against a
  forgotten passphrase. Treat it like a password file.
- **Report (.md), audit log (.txt/.doc)**: plaintext by nature — they are the
  point of the export. Share deliberately.

## Your responsibilities

- Choose a strong passphrase; it is the entire security boundary.
- If your scenarios contain regulated or classified information, prefer
  on-device AI or no AI, and handle exports accordingly.
- On shared machines, use the auto-lock (Settings → Security) and lock the
  vault when stepping away.

For the security engineering details (CSP, crypto parameters, regulatory
framing), see `SECURITY.md`.
