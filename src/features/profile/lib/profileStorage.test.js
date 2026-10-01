// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadSession, login, logout, register, saveProfile } from './profileStorage';
import { defaultAvatar } from './constants';

const USERS_KEY = 'games-react-users';
const SESSION_KEY = 'games-react-session';

const emptyStats = { wins: 0, losses: 0, draws: 0 };
const defaultStats = { tictactoe: emptyStats, chess: emptyStats, checkers: emptyStats };

const storedUsers = () => JSON.parse(localStorage.getItem(USERS_KEY));
const storedSession = () => localStorage.getItem(SESSION_KEY);

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
    const { profile } = register('TeStEr', 'Tester', 'secret');

    expect(profile.login).toBe('tester');
    expect(Object.keys(storedUsers())).toEqual(['tester']);
    expect(storedSession()).toBe('tester');
  });

  it('starts with empty stats for every game, the default avatar and a creation date', () => {
    const { profile } = register('tester', 'Tester', 'secret');

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
    expect(login('TeStEr', 'secret').profile.login).toBe('tester');
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

    const { profile } = login('tester', 'secret');

    expect(profile.stats).toEqual({ ...defaultStats, chess: { wins: 3, losses: 1, draws: 0 } });
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

    expect(loadSession().stats).toEqual(defaultStats);
  });
});

describe('saveProfile', () => {
  it('stores the updated profile of that user', () => {
    const { profile } = register('tester', 'Tester', 'secret');

    saveProfile({ ...profile, name: 'Renamed', stats: { ...profile.stats, chess: { wins: 1, losses: 0, draws: 0 } } });

    expect(loadSession()).toMatchObject({ name: 'Renamed', stats: { chess: { wins: 1, losses: 0, draws: 0 } } });
  });

  it('leaves the other users untouched', () => {
    const { profile: alice } = register('alice', 'Alice', 'a');
    const { profile: bob } = register('bob', 'Bob', 'b');

    saveProfile({ ...alice, name: 'Alice 2' });

    expect(storedUsers().bob).toEqual(bob);
    expect(storedUsers().alice.name).toBe('Alice 2');
  });
});
