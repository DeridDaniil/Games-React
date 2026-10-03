// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadSession, login, logout, register, saveProfile } from './profileStorage';
import { LEGACY_DEFAULT_AVATAR, defaultAvatar } from './avatar';
import type { AuthResult, Profile, Statistics, UserRecord } from '../model/types';

const USERS_KEY = 'games-react-users';
const SESSION_KEY = 'games-react-session';

const emptyStats = { wins: 0, losses: 0, draws: 0 };
const defaultStats = { tictactoe: emptyStats, chess: emptyStats, checkers: emptyStats };

// A stored profile as older versions may have left it: without an avatar, or with stats for only some games.
type StoredRecord = Omit<UserRecord, 'avatar' | 'stats'> & { avatar?: string; stats: Partial<Statistics> };

const storedUsers = (): Record<string, StoredRecord> => JSON.parse(localStorage.getItem(USERS_KEY) ?? 'null');
const storedSession = () => localStorage.getItem(SESSION_KEY);

// The profile of a registration or sign-in that has to succeed.
const signedIn = (result: AuthResult): Profile => {
  if (!result.profile) throw new Error(`Expected a profile, got the error "${result.error}"`);
  return result.profile;
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('register', () => {
  it('creates the user, stores it and starts a session', () => {
    const { profile, error } = register('tester', 'Tester', 'secret');

    expect(error).toBeUndefined();
    expect(profile).toMatchObject({ login: 'tester', name: 'Tester', password: 'secret' });
    expect(storedUsers()).toEqual({ tester: profile });
    expect(storedSession()).toBe('tester');
  });

  it('stores the login in lowercase', () => {
    const profile = signedIn(register('TeStEr', 'Tester', 'secret'));

    expect(profile.login).toBe('tester');
    expect(Object.keys(storedUsers())).toEqual(['tester']);
    expect(storedSession()).toBe('tester');
  });

  it('starts with empty stats for every game, the default avatar and a creation date', () => {
    const profile = signedIn(register('tester', 'Tester', 'secret'));

    expect(profile.stats).toEqual(defaultStats);
    expect(profile.avatar).toBe(defaultAvatar);
    expect(profile.avatar.startsWith('data:image/svg+xml,')).toBe(true);
    expect(new Date(profile.createdAt).toISOString()).toBe(profile.createdAt);
  });

  it('keeps the password as entered (current behaviour, stored in plain text)', () => {
    register('tester', 'Tester', 'secret');
    expect(storedUsers().tester.password).toBe('secret');
  });

  it('refuses a login that already exists, regardless of case', () => {
    register('tester', 'Tester', 'secret');

    expect(register('tester', 'Other', 'other')).toEqual({ error: 'User with this login already exists' });
    expect(register('TESTER', 'Other', 'other')).toEqual({ error: 'User with this login already exists' });
    expect(storedUsers().tester.name).toBe('Tester');
  });

  it('keeps previously registered users', () => {
    register('alice', 'Alice', 'a');
    register('bob', 'Bob', 'b');

    expect(Object.keys(storedUsers()).sort()).toEqual(['alice', 'bob']);
    expect(storedSession()).toBe('bob');
  });
});

describe('login', () => {
  beforeEach(() => {
    register('tester', 'Tester', 'secret');
    logout();
  });

  it('returns the profile and starts a session for the right login and password', () => {
    const { profile, error } = login('tester', 'secret');

    expect(error).toBeUndefined();
    expect(profile).toMatchObject({ login: 'tester', name: 'Tester', stats: defaultStats });
    expect(storedSession()).toBe('tester');
  });

  it('ignores the case of the login', () => {
    expect(signedIn(login('TeStEr', 'secret')).login).toBe('tester');
  });

  it('rejects an unknown login without starting a session', () => {
    expect(login('nobody', 'secret')).toEqual({ error: 'User not found' });
    expect(storedSession()).toBeNull();
  });

  it('rejects a wrong password without starting a session', () => {
    expect(login('tester', 'wrong')).toEqual({ error: 'Wrong password' });
    expect(storedSession()).toBeNull();
  });

  it('fills in stats that are missing from older stored profiles', () => {
    const users = storedUsers();
    users.tester.stats = { chess: { wins: 3, losses: 1, draws: 0 } };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    const profile = signedIn(login('tester', 'secret'));

    expect(profile.stats).toEqual({ ...defaultStats, chess: { wins: 3, losses: 1, draws: 0 } });
  });

  it('shows the default avatar of older profiles as the current one without rewriting the stored profile', () => {
    const users = storedUsers();
    users.tester.avatar = LEGACY_DEFAULT_AVATAR;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    expect(signedIn(login('tester', 'secret')).avatar).toBe(defaultAvatar);
    expect(storedUsers().tester.avatar).toBe(LEGACY_DEFAULT_AVATAR);
  });

  it('keeps an uploaded photo as it is', () => {
    const users = storedUsers();
    users.tester.avatar = 'data:image/jpeg;base64,AAAA';
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    expect(signedIn(login('tester', 'secret')).avatar).toBe('data:image/jpeg;base64,AAAA');
  });
});

describe('logout', () => {
  it('ends the session but keeps the stored users', () => {
    register('tester', 'Tester', 'secret');

    logout();

    expect(storedSession()).toBeNull();
    expect(loadSession()).toBeNull();
    expect(Object.keys(storedUsers())).toEqual(['tester']);
  });
});

describe('loadSession', () => {
  it('returns the signed-in user', () => {
    const { profile } = register('tester', 'Tester', 'secret');
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
    register('tester', 'Tester', 'secret');
    localStorage.setItem(SESSION_KEY, 'ghost');

    expect(loadSession()).toBeNull();
  });

  it('fills in stats that are missing from older stored profiles', () => {
    register('tester', 'Tester', 'secret');
    const users = storedUsers();
    delete users.tester.stats.checkers;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    expect(loadSession()?.stats).toEqual(defaultStats);
  });

  it('shows the default avatar of older or avatar-less profiles as the current one', () => {
    register('tester', 'Tester', 'secret');
    const users = storedUsers();
    users.tester.avatar = LEGACY_DEFAULT_AVATAR;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    expect(loadSession()?.avatar).toBe(defaultAvatar);

    delete users.tester.avatar;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    expect(loadSession()?.avatar).toBe(defaultAvatar);
  });
});

describe('saveProfile', () => {
  it('stores the updated profile of that user', () => {
    const profile = signedIn(register('tester', 'Tester', 'secret'));

    saveProfile({ ...profile, name: 'Renamed', stats: { ...profile.stats, chess: { wins: 1, losses: 0, draws: 0 } } });

    expect(loadSession()).toMatchObject({ name: 'Renamed', stats: { chess: { wins: 1, losses: 0, draws: 0 } } });
  });

  it('leaves the other users untouched', () => {
    const alice = signedIn(register('alice', 'Alice', 'a'));
    const bob = signedIn(register('bob', 'Bob', 'b'));

    saveProfile({ ...alice, name: 'Alice 2' });

    expect(storedUsers().bob).toEqual(bob);
    expect(storedUsers().alice.name).toBe('Alice 2');
  });
});

// Valid JSON that is not a map of profiles (damaged by hand or by another page) holds no profiles;
// registering then starts a proper map instead of throwing or losing the new profile.
describe('stored users that are not a map of profiles', () => {
  it.each([
    ['a number', '5'],
    ['a list', '[]'],
    ['text', '"tester"'],
  ])('count as no profiles when they are %s', (_, stored) => {
    localStorage.setItem(USERS_KEY, stored);
    localStorage.setItem(SESSION_KEY, 'tester');

    expect(loadSession()).toBeNull();
    expect(login('tester', 'secret')).toEqual({ error: 'User not found' });

    const profile = signedIn(register('tester', 'Tester', 'secret'));
    expect(storedUsers()).toEqual({ tester: profile });
  });
});

// A profile may carry fields or game results this version does not know (left by another version in
// the same browser); reading it and saving it again keeps them as they are.
describe('stored profile fields this version does not know', () => {
  it('are kept through signing in, loading the session and saving the profile', () => {
    const profile = signedIn(register('tester', 'Tester', 'secret'));
    const stored = { ...profile, theme: 'dark', stats: { ...profile.stats, connect4: { wins: 2, losses: 0, draws: 1 } } };
    localStorage.setItem(USERS_KEY, JSON.stringify({ tester: stored }));

    expect(signedIn(login('tester', 'secret'))).toEqual(stored);

    const loaded = loadSession();
    if (!loaded) throw new Error('Expected the stored profile to load');
    saveProfile({ ...loaded, name: 'Renamed' });

    const users: Record<string, unknown> = JSON.parse(localStorage.getItem(USERS_KEY) ?? 'null');
    expect(users.tester).toEqual({ ...stored, name: 'Renamed' });
  });
});
