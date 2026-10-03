// Profiles for tests. Registering hashes the password with the full PBKDF2 count on purpose (see
// credentials.ts), so tests that only need someone signed in store a profile directly. Its credential
// is real but made with few iterations; a credential keeps its own count, so signing in with it goes
// through the same check as any other.
import { defaultAvatar } from '../lib/avatar';
import { createCredential } from '../lib/credentials';
import { isRecord } from '../lib/isRecord';
import type { Profile, Statistics, StoredUser } from '../model/types';

export const USERS_KEY = 'games-react-users';
export const SESSION_KEY = 'games-react-session';

// The password of every profile stored here.
export const TEST_PASSWORD = 'secret';

const testCredential = await createCredential(TEST_PASSWORD, 1000);

const emptyStats = (): Statistics => ({
  tictactoe: { wins: 0, losses: 0, draws: 0 },
  chess: { wins: 0, losses: 0, draws: 0 },
  checkers: { wins: 0, losses: 0, draws: 0 },
});

// The users map in storage, as plain data for assertions.
export const storedUsers = (): Record<string, unknown> => {
  const users: unknown = JSON.parse(localStorage.getItem(USERS_KEY) ?? 'null');
  return isRecord(users) ? users : {};
};

const store = (login: string, record: object, signedIn: boolean) => {
  localStorage.setItem(USERS_KEY, JSON.stringify({ ...storedUsers(), [login]: record }));
  if (signedIn) localStorage.setItem(SESSION_KEY, login);
};

// Stores a profile whose password is TEST_PASSWORD, signed in unless `signedIn` is false.
export function storeProfile(login = 'tester', name = 'Tester', { signedIn = true } = {}): Profile {
  const profile: Profile = { login, name, avatar: defaultAvatar, stats: emptyStats(), createdAt: '2026-01-01T00:00:00.000Z' };
  const stored: StoredUser = { ...profile, credential: testCredential };
  store(login, stored, signedIn);
  return profile;
}

// Stores a profile the way Stages 1-7 did: the password as typed and no credential.
export function storeLegacyProfile(login: string, name: string, password: string, { signedIn = false } = {}) {
  const record = { login, name, password, avatar: defaultAvatar, stats: emptyStats(), createdAt: '2026-01-01T00:00:00.000Z' };
  store(login, record, signedIn);
  return record;
}
