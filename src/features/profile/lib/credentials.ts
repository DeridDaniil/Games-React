// Password checks for the local profiles: a profile keeps a PBKDF2-SHA-256 hash of its password
// with a random salt (Web Crypto), never the password. That keeps the password itself out of the
// browser's storage; it is not an online account, and the rest of the profile stays readable there.
import { isRecord } from './isRecord';
import type { PasswordCredential } from '../model/types';

// OWASP's current recommendation for PBKDF2-HMAC-SHA256. One check takes about a tenth of a second
// in Chrome on a desktop (median 102 ms when chosen), more on a phone. Each credential keeps its own
// count, so raising this later does not lock anyone out.
export const PBKDF2_ITERATIONS = 600_000;

const SALT_BYTES = 16;
const HASH_BITS = 256;
// The highest count a stored credential may name: far above PBKDF2_ITERATIONS, so a later raise still
// reads, while a damaged count cannot keep the page checking a password for minutes.
const MAX_ITERATIONS = 10_000_000;

const toBase64 = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes));
const fromBase64 = (text: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(text), char => char.charCodeAt(0));
// Whether `value` is base64 (padded, as toBase64 writes it) for exactly `length` bytes.
const isBase64Of = (value: unknown, length: number): value is string =>
  typeof value === 'string' && value.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(value) && fromBase64(value).length === length;

// Web Crypto only exists on secure pages (HTTPS or localhost).
export const canHashPasswords = (): boolean => typeof globalThis.crypto?.subtle?.deriveBits === 'function';

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, HASH_BITS);
  return new Uint8Array(bits);
}

// A new credential for `password` with a fresh random salt.
export async function createCredential(password: string, iterations: number = PBKDF2_ITERATIONS): Promise<PasswordCredential> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, iterations);
  return { version: 1, algorithm: 'PBKDF2-SHA-256', salt: toBase64(salt), iterations, hash: toBase64(hash) };
}

// Whether `password` is the one the credential was made from. Every byte is compared, so the time
// taken does not depend on where the first difference is.
export async function verifyPassword(password: string, credential: PasswordCredential): Promise<boolean> {
  const expected = fromBase64(credential.hash);
  const actual = await derive(password, fromBase64(credential.salt), credential.iterations);
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let i = 0; i < actual.length; i++) difference |= actual[i] ^ expected[i];
  return difference === 0;
}

// A stored credential this version can check, or null for anything else (missing, damaged, or a
// format this version does not know): its salt and hash must have their lengths, and its count must
// be one a page can run.
export function readCredential(value: unknown): PasswordCredential | null {
  if (!isRecord(value)) return null;
  const { version, algorithm, salt, iterations, hash } = value;
  if (version !== 1 || algorithm !== 'PBKDF2-SHA-256') return null;
  if (!isBase64Of(salt, SALT_BYTES) || !isBase64Of(hash, HASH_BITS / 8)) return null;
  if (typeof iterations !== 'number' || !Number.isInteger(iterations) || iterations < 1 || iterations > MAX_ITERATIONS) return null;
  return { version, algorithm, salt, iterations, hash };
}
