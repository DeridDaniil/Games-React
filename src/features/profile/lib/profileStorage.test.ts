// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NO_CRYPTO_ERROR, SAVE_ERROR, loadSession, login, logout, migratePlainPasswords, register, saveProfile } from './profileStorage';
import { LEGACY_DEFAULT_AVATAR, defaultAvatar } from './avatar';
import { PBKDF2_ITERATIONS, readCredential, verifyPassword } from './credentials';
import { isRecord } from './isRecord';
import { SESSION_KEY, TEST_PASSWORD, USERS_KEY, storeLegacyProfile, storeProfile, storedUsers } from '../test/profileFixtures';
import type { AuthResult, PasswordCredential, Profile } from '../model/types';

const emptyStats = { wins: 0, losses: 0, draws: 0 };
const defaultStats = { tictactoe: emptyStats, chess: emptyStats, checkers: emptyStats };

const storedSession = () => localStorage.getItem(SESSION_KEY);

// The stored record of a login.
const record = (login: string): Record<string, unknown> => {
  const value = storedUsers()[login];
  if (!isRecord(value)) throw new Error(`No stored record for ${login}`);
  return value;
};
const putRecord = (login: string, value: object) =>
  localStorage.setItem(USERS_KEY, JSON.stringify({ ...storedUsers(), [login]: value }));

// The credential stored for a login, which has to be a valid one.
const credentialOf = (login: string): PasswordCredential => {
  const credential = readCredential(record(login).credential);
  if (!credential) throw new Error(`No valid credential stored for ${login}`);
  return credential;
};

// The profile of a registration or sign-in that has to succeed.
const signedIn = (result: AuthResult): Profile => {
  if (!result.profile) throw new Error(`Expected a profile, got the error "${result.error}"`);
  return result.profile;
};

// Every localStorage write fails from now on, the way it does when the storage is full.
const fillStorage = () => vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
  throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
});

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('register', () => {
  it('creates the user, stores it and starts a session', async () => {
    const { profile, error } = await register('tester', 'Tester', 'secret');

    expect(error).toBeUndefined();
    expect(profile).toEqual({ login: 'tester', name: 'Tester', avatar: defaultAvatar, stats: defaultStats, createdAt: expect.any(String) });
    expect(Object.keys(storedUsers())).toEqual(['tester']);
    expect(storedSession()).toBe('tester');
  });

  it('stores the login in lowercase', async () => {
    const profile = signedIn(await register('TeStEr', 'Tester', 'secret'));

    expect(profile.login).toBe('tester');
    expect(Object.keys(storedUsers())).toEqual(['tester']);
    expect(storedSession()).toBe('tester');
  });

  it('starts with empty stats for every game, the default avatar and a creation date', async () => {
    const profile = signedIn(await register('tester', 'Tester', 'secret'));

    expect(profile.stats).toEqual(defaultStats);
    expect(profile.avatar).toBe(defaultAvatar);
    expect(profile.avatar.startsWith('data:image/svg+xml,')).toBe(true);
    expect(new Date(profile.createdAt).toISOString()).toBe(profile.createdAt);
  });

  it('never stores the password, only a salted PBKDF2-SHA-256 credential', async () => {
    await register('tester', 'Tester', 'secret');

    expect(record('tester')).not.toHaveProperty('password');
    expect(localStorage.getItem(USERS_KEY)).not.toContain('secret');
    const credential = credentialOf('tester');
    expect(credential).toMatchObject({ version: 1, algorithm: 'PBKDF2-SHA-256', iterations: PBKDF2_ITERATIONS });
    // 16 random bytes of salt and a 256-bit hash, in base64.
    expect(atob(credential.salt)).toHaveLength(16);
    expect(atob(credential.hash)).toHaveLength(32);
    expect(await verifyPassword('secret', credential)).toBe(true);
    expect(await verifyPassword('Secret', credential)).toBe(false);
  });

  it('gives every profile its own random salt', async () => {
    await register('alice', 'Alice', 'same');
    await register('bob', 'Bob', 'same');

    expect(credentialOf('alice').salt).not.toBe(credentialOf('bob').salt);
    expect(credentialOf('alice').hash).not.toBe(credentialOf('bob').hash);
  });

  it('refuses a login that already exists, regardless of case', async () => {
    await register('tester', 'Tester', 'secret');

    expect(await register('tester', 'Other', 'other')).toEqual({ error: 'User with this login already exists' });
    expect(await register('TESTER', 'Other', 'other')).toEqual({ error: 'User with this login already exists' });
    expect(record('tester').name).toBe('Tester');
  });

  it('keeps previously registered users', async () => {
    await register('alice', 'Alice', 'a');
    await register('bob', 'Bob', 'b');

    expect(Object.keys(storedUsers()).sort()).toEqual(['alice', 'bob']);
    expect(storedSession()).toBe('bob');
  });

  it('says so and signs nobody in when the profile cannot be stored', async () => {
    fillStorage();

    expect(await register('tester', 'Tester', 'secret')).toEqual({ error: SAVE_ERROR });
    vi.restoreAllMocks();
    expect(storedUsers()).toEqual({});
    expect(storedSession()).toBeNull();
  });

  // The profile and its session are two writes. A profile stored without its session would say the
  // registration failed and still take the login.
  it('stores nothing when the session cannot be started, so the login stays free', async () => {
    storeProfile('other', 'Other', { signedIn: false });
    const usersBefore = storedUsers();
    const writeItem = localStorage.setItem.bind(localStorage);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      if (key === SESSION_KEY) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      writeItem(key, value);
    });

    expect(await register('tester', 'Tester', 'secret')).toEqual({ error: SAVE_ERROR });
    expect(storedUsers()).toEqual(usersBefore);

    vi.restoreAllMocks();
    expect(signedIn(await register('tester', 'Tester', 'secret')).login).toBe('tester');
  });

  it('says so when the page cannot hash passwords (no Web Crypto)', async () => {
    vi.stubGlobal('crypto', {});

    expect(await register('tester', 'Tester', 'secret')).toEqual({ error: NO_CRYPTO_ERROR });
    expect(storedUsers()).toEqual({});
  });
});

describe('login', () => {
  beforeEach(() => {
    storeProfile('tester', 'Tester', { signedIn: false });
  });

  it('returns the profile and starts a session for the right login and password', async () => {
    const { profile, error } = await login('tester', TEST_PASSWORD);

    expect(error).toBeUndefined();
    expect(profile).toMatchObject({ login: 'tester', name: 'Tester', stats: defaultStats });
    expect(storedSession()).toBe('tester');
  });

  it('ignores the case of the login', async () => {
    expect(signedIn(await login('TeStEr', TEST_PASSWORD)).login).toBe('tester');
  });

  it('rejects an unknown login without starting a session', async () => {
    expect(await login('nobody', TEST_PASSWORD)).toEqual({ error: 'User not found' });
    expect(storedSession()).toBeNull();
  });

  it('rejects a wrong password without starting a session', async () => {
    expect(await login('tester', 'wrong')).toEqual({ error: 'Wrong password' });
    expect(storedSession()).toBeNull();
  });

  it('never hands out the credential with the profile', async () => {
    const profile = signedIn(await login('tester', TEST_PASSWORD));

    expect(profile).not.toHaveProperty('credential');
    expect(profile).not.toHaveProperty('password');
  });

  it('signs in a profile registered with the full iteration count', async () => {
    await register('real', 'Real', 'pass1234');
    logout();

    expect(signedIn(await login('real', 'pass1234')).name).toBe('Real');
    expect(await login('real', 'pass12345')).toEqual({ error: 'Wrong password' });
  });

  it('fills in stats that are missing from older stored profiles', async () => {
    putRecord('tester', { ...record('tester'), stats: { chess: { wins: 3, losses: 1, draws: 0 } } });

    const profile = signedIn(await login('tester', TEST_PASSWORD));

    expect(profile.stats).toEqual({ ...defaultStats, chess: { wins: 3, losses: 1, draws: 0 } });
  });

  it('shows the default avatar of older profiles as the current one without rewriting the stored profile', async () => {
    putRecord('tester', { ...record('tester'), avatar: LEGACY_DEFAULT_AVATAR });

    expect(signedIn(await login('tester', TEST_PASSWORD)).avatar).toBe(defaultAvatar);
    expect(record('tester').avatar).toBe(LEGACY_DEFAULT_AVATAR);
  });

  it('keeps an uploaded photo as it is', async () => {
    putRecord('tester', { ...record('tester'), avatar: 'data:image/jpeg;base64,AAAA' });

    expect(signedIn(await login('tester', TEST_PASSWORD)).avatar).toBe('data:image/jpeg;base64,AAAA');
  });

  // A damaged credential cannot be checked, so the profile has nothing to sign in with; that is not
  // the page lacking Web Crypto.
  it('refuses a profile whose credential is damaged as a wrong password', async () => {
    putRecord('tester', { ...record('tester'), credential: { ...credentialOf('tester'), salt: 'A' } });

    expect(await login('tester', TEST_PASSWORD)).toEqual({ error: 'Wrong password' });
    expect(storedSession()).toBeNull();
  });
});

// Logins are the keys of the stored map, and only its own entries are profiles: a login that names a
// property every object has is just another login.
describe('logins that name properties of every object', () => {
  it('are unknown until registered', async () => {
    expect(await login('constructor', 'secret')).toEqual({ error: 'User not found' });
    expect(await login('__proto__', 'secret')).toEqual({ error: 'User not found' });
  });

  it('can be registered and then signed in', async () => {
    expect(signedIn(await register('constructor', 'Builder', 'secret')).login).toBe('constructor');
    logout();

    expect(signedIn(await login('constructor', 'secret')).name).toBe('Builder');
    expect(loadSession()).toMatchObject({ login: 'constructor', name: 'Builder' });
  });
});

describe('logout', () => {
  it('ends the session but keeps the stored users', () => {
    storeProfile();

    logout();

    expect(storedSession()).toBeNull();
    expect(loadSession()).toBeNull();
    expect(Object.keys(storedUsers())).toEqual(['tester']);
  });
});

describe('loadSession', () => {
  it('returns the signed-in user', () => {
    const profile = storeProfile();
    expect(loadSession()).toEqual(profile);
  });

  it('returns null when nobody is signed in', () => {
    expect(loadSession()).toBeNull();
  });

  it('returns null instead of throwing when the stored users are corrupted', () => {
    localStorage.setItem(USERS_KEY, '{not json');
    localStorage.setItem(SESSION_KEY, 'tester');

    expect(loadSession()).toBeNull();
  });

  it('returns null when the session points to a user that does not exist', () => {
    storeProfile();
    localStorage.setItem(SESSION_KEY, 'ghost');

    expect(loadSession()).toBeNull();
  });

  it('fills in stats that are missing from older stored profiles', () => {
    storeProfile();
    putRecord('tester', { ...record('tester'), stats: { tictactoe: emptyStats, chess: emptyStats } });

    expect(loadSession()?.stats).toEqual(defaultStats);
  });

  it('shows the default avatar of older or avatar-less profiles as the current one', () => {
    storeProfile();
    putRecord('tester', { ...record('tester'), avatar: LEGACY_DEFAULT_AVATAR });

    expect(loadSession()?.avatar).toBe(defaultAvatar);

    const withoutAvatar = Object.fromEntries(Object.entries(record('tester')).filter(([field]) => field !== 'avatar'));
    putRecord('tester', withoutAvatar);

    expect(loadSession()?.avatar).toBe(defaultAvatar);
  });
});

describe('saveProfile', () => {
  it('stores the updated profile of that user', () => {
    const profile = storeProfile();

    expect(saveProfile({ ...profile, name: 'Renamed', stats: { ...profile.stats, chess: { wins: 1, losses: 0, draws: 0 } } })).toEqual({ ok: true });

    expect(loadSession()).toMatchObject({ name: 'Renamed', stats: { chess: { wins: 1, losses: 0, draws: 0 } } });
  });

  it('leaves the other users untouched', () => {
    const alice = storeProfile('alice', 'Alice');
    storeProfile('bob', 'Bob');
    const bob = record('bob');

    saveProfile({ ...alice, name: 'Alice 2' });

    expect(record('bob')).toEqual(bob);
    expect(record('alice').name).toBe('Alice 2');
  });

  it('keeps the credential, so the profile can still sign in', async () => {
    const profile = storeProfile();
    const credential = credentialOf('tester');

    saveProfile({ ...profile, name: 'Renamed' });

    expect(credentialOf('tester')).toEqual(credential);
    logout();
    expect(signedIn(await login('tester', TEST_PASSWORD)).name).toBe('Renamed');
  });

  it('reports a full storage and keeps the stored profile as it was', () => {
    const profile = storeProfile();
    const before = record('tester');
    fillStorage();

    expect(saveProfile({ ...profile, name: 'Renamed', avatar: 'data:image/jpeg;base64,AAAA' })).toEqual({ ok: false, error: SAVE_ERROR });

    vi.restoreAllMocks();
    expect(record('tester')).toEqual(before);
  });
});

// Valid JSON that is not a map of profiles (damaged by hand or by another page) holds no profiles;
// registering then starts a proper map instead of throwing or losing the new profile.
describe('stored users that are not a map of profiles', () => {
  it.each([
    ['a number', '5'],
    ['a list', '[]'],
    ['text', '"tester"'],
  ])('count as no profiles when they are %s', async (_, stored) => {
    localStorage.setItem(USERS_KEY, stored);
    localStorage.setItem(SESSION_KEY, 'tester');

    expect(loadSession()).toBeNull();
    expect(await login('tester', 'secret')).toEqual({ error: 'User not found' });

    const profile = signedIn(await register('tester', 'Tester', 'secret'));
    expect(storedUsers()).toEqual({ tester: { ...profile, credential: credentialOf('tester') } });
  });
});

// A profile may carry fields or game results this version does not know (left by another version in
// the same browser); reading it and saving it again keeps them in storage.
describe('stored profile fields this version does not know', () => {
  it('are kept through signing in, loading the session and saving the profile', async () => {
    const profile = storeProfile('tester', 'Tester', { signedIn: false });
    const connect4 = { wins: 2, losses: 0, draws: 1 };
    putRecord('tester', { ...record('tester'), theme: 'dark', stats: { ...profile.stats, connect4 } });

    expect(signedIn(await login('tester', TEST_PASSWORD)).stats).toEqual({ ...profile.stats, connect4 });

    const loaded = loadSession();
    if (!loaded) throw new Error('Expected the stored profile to load');
    saveProfile({ ...loaded, name: 'Renamed' });

    expect(record('tester')).toMatchObject({ name: 'Renamed', theme: 'dark', stats: { connect4 }, credential: credentialOf('tester') });
  });
});

// Stages 1-7 stored the password as typed. Such profiles keep working and lose the plain text: when
// they sign in, and for all of them when the app starts (migratePlainPasswords).
describe('profiles stored by an older version with a plain-text password', () => {
  it('sign in with that password, which is then replaced by a credential', async () => {
    storeLegacyProfile('old', 'Old', 'pass1234');
    putRecord('old', { ...record('old'), theme: 'dark' });

    const profile = signedIn(await login('old', 'pass1234'));

    expect(profile).toMatchObject({ login: 'old', name: 'Old', stats: defaultStats });
    expect(record('old')).not.toHaveProperty('password');
    expect(record('old')).toMatchObject({ name: 'Old', theme: 'dark', createdAt: '2026-01-01T00:00:00.000Z' });
    expect(await verifyPassword('pass1234', credentialOf('old'))).toBe(true);
  });

  it('refuse a wrong password and stay as they were', async () => {
    const legacy = storeLegacyProfile('old', 'Old', 'pass1234');

    expect(await login('old', 'nope')).toEqual({ error: 'Wrong password' });
    expect(record('old')).toEqual(legacy);
  });

  it('are all moved to credentials at once, keeping everything else', async () => {
    storeLegacyProfile('anna', 'Anna', 'first1');
    storeLegacyProfile('boris', 'Boris', 'second2');
    putRecord('boris', { ...record('boris'), stats: { ...defaultStats, chess: { wins: 4, losses: 1, draws: 0 } } });
    storeProfile('cleo', 'Cleo', { signedIn: false });
    const cleo = record('cleo');

    expect(await migratePlainPasswords()).toEqual({ migrated: 2, failed: 0 });

    const stored = localStorage.getItem(USERS_KEY) ?? '';
    expect(stored).not.toContain('"password"');
    expect(stored).not.toContain('first1');
    expect(stored).not.toContain('second2');
    expect(await verifyPassword('first1', credentialOf('anna'))).toBe(true);
    expect(await verifyPassword('second2', credentialOf('boris'))).toBe(true);
    expect(record('boris').stats).toEqual({ ...defaultStats, chess: { wins: 4, losses: 1, draws: 0 } });
    expect(record('cleo')).toEqual(cleo);
  });

  // No ordinary path leaves both, but a plain-text password must not stay just because a credential
  // is already there; the credential is kept as it is.
  it('lose a plain-text password left next to a credential', async () => {
    storeProfile('mixed', 'Mixed', { signedIn: false });
    const credential = credentialOf('mixed');
    putRecord('mixed', { ...record('mixed'), password: 'leftover' });

    expect(await migratePlainPasswords()).toEqual({ migrated: 1, failed: 0 });

    expect(record('mixed')).not.toHaveProperty('password');
    expect(credentialOf('mixed')).toEqual(credential);
    expect(signedIn(await login('mixed', TEST_PASSWORD)).name).toBe('Mixed');
  });

  it('are moved only once however often the migration runs', async () => {
    storeLegacyProfile('old', 'Old', 'pass1234');
    await migratePlainPasswords();
    const credential = credentialOf('old');

    expect(await migratePlainPasswords()).toEqual({ migrated: 0, failed: 0 });
    expect(credentialOf('old')).toEqual(credential);
  });

  it('share one migration when it is started twice at the same time', async () => {
    storeLegacyProfile('old', 'Old', 'pass1234');

    const [first, second] = await Promise.all([migratePlainPasswords(), migratePlainPasswords()]);

    expect(first).toBe(second);
    expect(first).toEqual({ migrated: 1, failed: 0 });
  });

  it('stay signed in while they are moved', async () => {
    const legacy = storeLegacyProfile('old', 'Old', 'pass1234', { signedIn: true });
    const before = loadSession();
    expect(before).toMatchObject({ login: 'old', name: legacy.name });

    await migratePlainPasswords();

    expect(storedSession()).toBe('old');
    expect(loadSession()).toEqual(before);
  });

  it('keep their old record when the new one cannot be stored, and are moved on a later try', async () => {
    const legacy = storeLegacyProfile('old', 'Old', 'pass1234');
    fillStorage();

    expect(await migratePlainPasswords()).toEqual({ migrated: 0, failed: 1 });

    vi.restoreAllMocks();
    expect(record('old')).toEqual(legacy);
    expect(signedIn(await login('old', 'pass1234')).name).toBe('Old');
    expect(record('old')).not.toHaveProperty('password');
  });

  it('keep their old record when the page cannot hash passwords', async () => {
    const legacy = storeLegacyProfile('old', 'Old', 'pass1234');
    vi.stubGlobal('crypto', {});

    expect(await migratePlainPasswords()).toEqual({ migrated: 0, failed: 1 });
    expect(record('old')).toEqual(legacy);
  });
});
