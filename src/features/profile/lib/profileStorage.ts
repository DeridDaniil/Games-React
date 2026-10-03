import { defaultAvatar, normalizeAvatar } from './avatar';
import { canHashPasswords, createCredential, readCredential, verifyPassword } from './credentials';
import { isRecord } from './isRecord';
import type { AuthResult, GameStats, PasswordCredential, Profile, SaveResult, Statistics, StoredUser } from '../model/types';

const USERS_KEY = 'games-react-users';
const SESSION_KEY = 'games-react-session';

// What the player is told when the browser refuses to store something, or cannot check passwords.
// The browser's own errors are never shown.
export const SAVE_ERROR = 'Could not save this profile on this device.';
export const NO_CRYPTO_ERROR = 'This page cannot check passwords. Open the game over HTTPS or on localhost.';

const emptyStats = (): Statistics => ({
  tictactoe: { wins: 0, losses: 0, draws: 0 },
  chess: { wins: 0, losses: 0, draws: 0 },
  checkers: { wins: 0, losses: 0, draws: 0 },
});

// The users map as read from storage: profile records keyed by login. Storage may hold anything,
// so a record is only trusted once toProfile has read it.
type StoredUsers = Record<string, unknown>;

// The stored record of a login. Only the map's own entries are records, so a login such as
// "constructor" is not mistaken for a stored profile.
const recordOf = (users: StoredUsers, key: string): unknown => (Object.hasOwn(users, key) ? users[key] : undefined);

// Anything that is not a map of records (missing, unreadable, or another kind of JSON) holds no users.
function loadUsers(): StoredUsers {
  try {
    const users: unknown = JSON.parse(localStorage.getItem(USERS_KEY) ?? 'null');
    return isRecord(users) ? users : {};
  } catch {
    return {};
  }
}

// Whether the browser stored the map; a full or unavailable storage throws, and then nothing changed.
function writeUsers(users: StoredUsers): boolean {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  } catch {
    return false;
  }
}

function writeSession(key: string | null): boolean {
  try {
    if (key === null) localStorage.removeItem(SESSION_KEY);
    else localStorage.setItem(SESSION_KEY, key);
    return true;
  } catch {
    return false;
  }
}

const toCount = (value: unknown) =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0;

const toGameStats = (value: unknown): GameStats => {
  const record = isRecord(value) ? value : {};
  return { wins: toCount(record.wins), losses: toCount(record.losses), draws: toCount(record.draws) };
};

// Results of games this version does not know are kept as they are.
const toStatistics = (value: unknown): Statistics => {
  const stats = isRecord(value) ? value : {};
  return {
    ...stats,
    tictactoe: toGameStats(stats.tictactoe),
    chess: toGameStats(stats.chess),
    checkers: toGameStats(stats.checkers),
  };
};

type PlainPasswordRecord = Record<string, unknown> & { password: string };

// A record that still holds a password as typed, as older versions stored it.
const keepsPlainPassword = (record: unknown): record is PlainPasswordRecord =>
  isRecord(record) && typeof record.password === 'string';

// A record that can only sign in with that password: it has no credential yet.
const hasPlainPassword = (record: unknown): record is PlainPasswordRecord =>
  keepsPlainPassword(record) && !readCredential(record.credential);

// A stored record as the profile the app shows, or null when it cannot be one: not an object, or with
// nothing to sign in with (neither a credential nor, from an older version, a password). The other
// fields fall back to safe values, so profiles saved by older versions keep working: an old or missing
// avatar shows as the default one, and missing stats start at zero. The credential stays in storage.
function toProfile(record: unknown, login: string): Profile | null {
  if (!isRecord(record) || (!readCredential(record.credential) && !hasPlainPassword(record))) return null;
  return {
    login,
    name: typeof record.name === 'string' ? record.name : login,
    avatar: normalizeAvatar(record.avatar),
    stats: toStatistics(record.stats),
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : '',
  };
}

export async function register(login: string, name: string, password: string): Promise<AuthResult> {
  const key = login.toLowerCase();
  if (recordOf(loadUsers(), key)) return { error: 'User with this login already exists' };
  if (!canHashPasswords()) return { error: NO_CRYPTO_ERROR };

  let credential: PasswordCredential;
  try {
    credential = await createCredential(password);
  } catch {
    return { error: NO_CRYPTO_ERROR };
  }

  // Read again: the users map may have changed while the password was being hashed.
  const users = loadUsers();
  if (recordOf(users, key)) return { error: 'User with this login already exists' };
  const profile: Profile = { login: key, name, avatar: defaultAvatar, stats: emptyStats(), createdAt: new Date().toISOString() };
  const stored: StoredUser = { ...profile, credential };
  if (!writeUsers({ ...users, [key]: stored })) return { error: SAVE_ERROR };
  // A profile without its session is taken back (the smaller map stores where the larger one did),
  // so the failed registration does not keep the login.
  if (!writeSession(key)) {
    writeUsers(users);
    return { error: SAVE_ERROR };
  }
  return { profile };
}

export async function login(login: string, password: string): Promise<AuthResult> {
  const key = login.toLowerCase();
  const record = recordOf(loadUsers(), key);
  if (!record) return { error: 'User not found' };
  const profile = toProfile(record, key);
  if (!profile || !isRecord(record)) return { error: 'Wrong password' };

  const credential = readCredential(record.credential);
  if (credential) {
    if (!canHashPasswords()) return { error: NO_CRYPTO_ERROR };
    let matches: boolean;
    try {
      matches = await verifyPassword(password, credential);
    } catch {
      return { error: NO_CRYPTO_ERROR };
    }
    if (!matches) return { error: 'Wrong password' };
  } else {
    // A profile of an older version: its password was stored as typed. Once it matches, it is
    // replaced by a credential (if that fails, the old record stays and signing in still works).
    if (record.password !== password) return { error: 'Wrong password' };
    await migratePlainPassword(key);
  }

  if (!writeSession(key)) return { error: SAVE_ERROR };
  return { profile };
}

export function logout(): void {
  writeSession(null);
}

// The stored profile of a login, or null when there is none.
export function loadProfile(login: string): Profile | null {
  return toProfile(recordOf(loadUsers(), login), login);
}

export function loadSession(): Profile | null {
  try {
    const key = localStorage.getItem(SESSION_KEY);
    return key ? loadProfile(key) : null;
  } catch {
    return null;
  }
}

// Stores the profile's fields in its record, keeping the credential and any field this version does
// not know. When the browser refuses the write, the stored record stays as it was.
export function saveProfile(profile: Profile): SaveResult {
  const users = loadUsers();
  const stored = recordOf(users, profile.login);
  if (!isRecord(stored)) return { ok: false, error: SAVE_ERROR };

  const { login, name, avatar, stats, createdAt } = profile;
  const saved = writeUsers({ ...users, [login]: { ...stored, login, name, avatar, stats, createdAt } });
  return saved ? { ok: true } : { ok: false, error: SAVE_ERROR };
}

// Replaces the plain-text password of one profile by a credential, keeping every other field; a
// profile that already has a credential keeps it and only loses the password. The users map is read
// again right before the write, so changes made while the password was hashed are kept; if hashing or
// writing fails, the old record stays as it was. Returns whether the profile no longer holds a
// plain-text password.
async function migratePlainPassword(key: string): Promise<boolean> {
  const before = recordOf(loadUsers(), key);
  if (!keepsPlainPassword(before)) return true;

  let credential = readCredential(before.credential);
  if (!credential) {
    if (!canHashPasswords()) return false;
    try {
      credential = await createCredential(before.password);
    } catch {
      return false;
    }
  }

  const users = loadUsers();
  const current = recordOf(users, key);
  if (!keepsPlainPassword(current) || current.password !== before.password) return true;
  const withoutPassword = Object.fromEntries(Object.entries(current).filter(([field]) => field !== 'password'));
  const kept = readCredential(current.credential) ? current.credential : credential;
  return writeUsers({ ...users, [key]: { ...withoutPassword, credential: kept } });
}

interface MigrationResult {
  migrated: number;
  failed: number;
}

let runningMigration: Promise<MigrationResult> | null = null;

// Moves every profile that still holds a plain-text password to a credential (see
// migratePlainPassword); the session is not touched, so whoever is signed in stays signed in. It can
// run any number of times: migrated profiles are left alone, and a call made while another one is
// running gets that one's result. Profiles that could not be moved keep working and are tried again.
export function migratePlainPasswords(): Promise<MigrationResult> {
  runningMigration ??= (async () => {
    const users = loadUsers();
    const keys = Object.keys(users).filter(key => keepsPlainPassword(users[key]));
    let migrated = 0;
    let failed = 0;
    for (const key of keys) {
      if (await migratePlainPassword(key)) migrated += 1;
      else failed += 1;
    }
    return { migrated, failed };
  })().finally(() => {
    runningMigration = null;
  });
  return runningMigration;
}
