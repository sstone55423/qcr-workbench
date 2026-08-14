const enc = new TextEncoder();
const dec = new TextDecoder();

// PBKDF2-SHA256 work factor. New vaults and backups derive at CURRENT_ITERATIONS
// (OWASP 2023 guidance for PBKDF2-SHA256). LEGACY_ITERATIONS is what vaults and
// backups created before this change used; it is the default so that data
// lacking a stored iteration count still unlocks. Every new vault/backup stores
// its own iteration count, so raising CURRENT_ITERATIONS again later stays
// backward compatible.
export const LEGACY_ITERATIONS = 250000;
export const CURRENT_ITERATIONS = 600000;

export function randomSalt() {
  return crypto.getRandomValues(new Uint8Array(16));
}

export async function deriveKey(passphrase, salt, iterations = LEGACY_ITERATIONS) {
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptJSON(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)));
  return { iv, data };
}

export async function decryptJSON(key, payload) {
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: payload.iv }, key, payload.data);
  return JSON.parse(dec.decode(plain));
}