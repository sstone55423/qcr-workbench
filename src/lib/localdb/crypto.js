const enc = new TextEncoder();
const dec = new TextDecoder();

export function randomSalt() {
  return crypto.getRandomValues(new Uint8Array(16));
}

export async function deriveKey(passphrase, salt) {
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' },
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