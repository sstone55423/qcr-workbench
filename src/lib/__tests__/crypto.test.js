import { describe, it, expect } from 'vitest';
import { randomSalt, deriveKey, encryptJSON, decryptJSON } from '@/lib/localdb/crypto';

describe('vault crypto (PBKDF2 + AES-GCM)', () => {
  it('round-trips JSON through encrypt/decrypt', async () => {
    const salt = randomSalt();
    const key = await deriveKey('correct horse battery staple', salt);
    const original = { title: 'Paper', year: 2021, authors: [{ name: 'Smith' }], nested: { ok: true } };
    const payload = await encryptJSON(key, original);
    expect(payload.iv).toBeInstanceOf(Uint8Array);
    expect(payload.iv.length).toBe(12);
    const roundTripped = await decryptJSON(key, payload);
    expect(roundTripped).toEqual(original);
  });

  it('derives the same key from the same passphrase and salt', async () => {
    const salt = randomSalt();
    const key1 = await deriveKey('passphrase', salt);
    const key2 = await deriveKey('passphrase', salt);
    const payload = await encryptJSON(key1, { check: 'value' });
    await expect(decryptJSON(key2, payload)).resolves.toEqual({ check: 'value' });
  });

  it('fails to decrypt with a wrong passphrase', async () => {
    const salt = randomSalt();
    const good = await deriveKey('right passphrase', salt);
    const bad = await deriveKey('wrong passphrase', salt);
    const payload = await encryptJSON(good, { secret: 1 });
    await expect(decryptJSON(bad, payload)).rejects.toThrow();
  });

  it('fails to decrypt with the same passphrase but a different salt', async () => {
    const key1 = await deriveKey('passphrase', randomSalt());
    const key2 = await deriveKey('passphrase', randomSalt());
    const payload = await encryptJSON(key1, { secret: 1 });
    await expect(decryptJSON(key2, payload)).rejects.toThrow();
  });

  it('uses a fresh IV per record', async () => {
    const key = await deriveKey('passphrase', randomSalt());
    const p1 = await encryptJSON(key, { same: 'object' });
    const p2 = await encryptJSON(key, { same: 'object' });
    expect(Buffer.from(p1.iv).equals(Buffer.from(p2.iv))).toBe(false);
  });

  it('generates a 16-byte salt', () => {
    expect(randomSalt().length).toBe(16);
  });
});
