import { describe, expect, it } from 'vitest';
import { PBKDF2_ITERATIONS, createCredential, readCredential } from './credentials';

// A credential as it is stored: a 16-byte salt and a 32-byte hash, both in base64.
const stored = { version: 1, algorithm: 'PBKDF2-SHA-256', salt: btoa('s'.repeat(16)), iterations: 1000, hash: btoa('h'.repeat(32)) };

describe('readCredential', () => {
  it('reads a credential as createCredential makes it', async () => {
    const credential = await createCredential('secret', 1000);

    expect(readCredential(credential)).toEqual(credential);
  });

  it('reads a count far above today’s, so raising it later locks nobody out', () => {
    const later = { ...stored, iterations: PBKDF2_ITERATIONS * 10 };

    expect(readCredential(later)).toEqual(later);
  });

  // Storage can hold anything. A credential that could not be checked as it is counts as none, so a
  // damaged one is never handed to Web Crypto (where it would fail, or keep the page busy for minutes).
  it.each([
    ['something that is not an object', 'secret'],
    ['another version', { ...stored, version: 2 }],
    ['another algorithm', { ...stored, algorithm: 'SHA-256' }],
    ['a salt that is not base64', { ...stored, salt: 'A' }],
    ['a salt of the wrong length', { ...stored, salt: btoa('s'.repeat(8)) }],
    ['a hash that is not base64', { ...stored, hash: 'not base64!' }],
    ['a hash of the wrong length', { ...stored, hash: btoa('h'.repeat(31)) }],
    ['no iterations', { ...stored, iterations: 0 }],
    ['a fractional count', { ...stored, iterations: 1.5 }],
    ['a count no page could run', { ...stored, iterations: 2 ** 33 }],
    ['a count written as text', { ...stored, iterations: '1000' }],
  ])('refuses %s', (_, value) => {
    expect(readCredential(value)).toBeNull();
  });
});
