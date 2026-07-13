# Data Privacy

> Placeholder — the full privacy statement is written in the documentation
> phase. The commitments below are architectural and already in force.

QCR Workbench is a **local-first, zero-knowledge** application:

- All risk data (projects, scenarios, treatments, audit trail, settings) is
  stored **only in your browser's IndexedDB**, encrypted with AES-GCM-256
  under a key derived from your passphrase (PBKDF2-SHA256, 250,000
  iterations). The hosting server only serves static files and never sees
  your data.
- There are no accounts, no telemetry, and no analytics.
- A forgotten passphrase is unrecoverable by design.
- The only outbound network requests are ones you initiate: optional AI
  analysis with your own API key (sent directly to the provider you chose),
  and downloading on-device AI models.
- Backups you export are encrypted under a passphrase you choose, unless you
  explicitly select an unencrypted backup.
