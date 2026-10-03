// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useProfile } from './ProfileContext';
import { ProfileProvider } from './ProfileProvider';
import { SAVE_ERROR, loadSession } from '../lib/profileStorage';
import { readCredential } from '../lib/credentials';
import { isRecord } from '../lib/isRecord';
import { SESSION_KEY, TEST_PASSWORD, storeLegacyProfile, storeProfile, storedUsers } from '../test/profileFixtures';
import type { AuthResult, SaveResult } from './types';

const empty = { wins: 0, losses: 0, draws: 0 };

const renderProfile = () => renderHook(() => useProfile(), { wrapper: ProfileProvider });

const storedUser = (login: string): Record<string, unknown> => {
  const user = storedUsers()[login];
  if (!isRecord(user)) throw new Error(`No stored record for ${login}`);
  return user;
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('ProfileProvider', () => {
  it('starts signed out when there is no session', () => {
    const { result } = renderProfile();

    expect(result.current.profile).toBeNull();
    expect(result.current.hasProfile).toBe(false);
  });

  it('starts with the profile of the stored session', () => {
    storeProfile();

    const { result } = renderProfile();

    expect(result.current.hasProfile).toBe(true);
    expect(result.current.profile).toMatchObject({ login: 'tester', name: 'Tester' });
  });

  it('signs a newly registered profile in and returns it', async () => {
    const { result } = renderProfile();

    let outcome: AuthResult | undefined;
    await act(async () => {
      outcome = await result.current.register('tester', 'Tester', 'secret');
    });

    expect(outcome?.profile).toMatchObject({ login: 'tester' });
    expect(result.current.profile).toEqual(outcome?.profile);
    expect(loadSession()?.login).toBe('tester');
  });

  it('returns the error and stays signed out when the login is taken', async () => {
    storeProfile('tester', 'Tester', { signedIn: false });
    const { result } = renderProfile();

    let outcome: AuthResult | undefined;
    await act(async () => {
      outcome = await result.current.register('tester', 'Other', 'other');
    });

    expect(outcome).toEqual({ error: 'User with this login already exists' });
    expect(result.current.hasProfile).toBe(false);
  });

  it('signs in with the right password only', async () => {
    storeProfile('tester', 'Tester', { signedIn: false });
    const { result } = renderProfile();

    let outcome: AuthResult | undefined;
    await act(async () => {
      outcome = await result.current.login('tester', 'wrong');
    });
    expect(outcome).toEqual({ error: 'Wrong password' });
    expect(result.current.hasProfile).toBe(false);

    await act(async () => {
      await result.current.login('tester', TEST_PASSWORD);
    });
    expect(result.current.profile?.login).toBe('tester');
  });

  it('never puts the credential in the profile it provides', async () => {
    storeProfile('tester', 'Tester', { signedIn: false });
    const { result } = renderProfile();

    await act(async () => {
      await result.current.login('tester', TEST_PASSWORD);
    });

    expect(result.current.profile).not.toHaveProperty('credential');
    expect(result.current.profile).not.toHaveProperty('password');
  });

  it('signs out but keeps the profile on this device', () => {
    storeProfile();
    const { result } = renderProfile();

    act(() => result.current.logout());

    expect(result.current.profile).toBeNull();
    expect(loadSession()).toBeNull();
    expect(storedUser('tester').name).toBe('Tester');
  });

  it('merges profile changes and stores them', () => {
    storeProfile();
    const { result } = renderProfile();

    let saved: SaveResult | undefined;
    act(() => {
      saved = result.current.updateProfile({ name: 'Renamed' });
    });

    expect(saved).toEqual({ ok: true });
    expect(result.current.profile).toMatchObject({ login: 'tester', name: 'Renamed' });
    expect(storedUser('tester').name).toBe('Renamed');
  });

  // Nothing in the app edits a profile while signed out; if anything did, it must not invent one.
  it('changes nothing and stores nothing when nobody is signed in', () => {
    const { result } = renderProfile();

    let saved: SaveResult | undefined;
    act(() => {
      saved = result.current.updateProfile({ name: 'Nobody' });
    });

    expect(saved).toEqual({ ok: false, error: SAVE_ERROR });
    expect(result.current.profile).toBeNull();
    expect(result.current.hasProfile).toBe(false);
    expect(localStorage.getItem('games-react-users')).toBeNull();
  });

  it('shows no change that could not be stored', () => {
    storeProfile();
    const { result } = renderProfile();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    });

    let saved: SaveResult | undefined;
    act(() => {
      saved = result.current.updateProfile({ name: 'Renamed' });
    });
    act(() => {
      result.current.recordResult('chess', 'wins');
    });

    expect(saved).toEqual({ ok: false, error: SAVE_ERROR });
    expect(result.current.profile).toMatchObject({ name: 'Tester', stats: { chess: empty } });
  });

  it('records one result of a game and stores it', () => {
    storeProfile();
    const { result } = renderProfile();

    act(() => result.current.recordResult('chess', 'wins'));
    act(() => result.current.recordResult('chess', 'draws'));

    expect(result.current.profile?.stats.chess).toEqual({ wins: 1, losses: 0, draws: 1 });
    expect(loadSession()?.stats.chess).toEqual({ wins: 1, losses: 0, draws: 1 });
    expect(result.current.profile?.stats.tictactoe).toEqual(empty);
  });

  // Tabs of the browser share the storage, and so the session, but each shows its own profile.
  it('records for the profile this page shows when another tab signed in as someone else', () => {
    storeProfile('alice', 'Alice');
    const { result } = renderProfile();
    storeProfile('bob', 'Bob');

    act(() => result.current.recordResult('chess', 'wins'));

    expect(result.current.profile).toMatchObject({ login: 'alice', stats: { chess: { wins: 1, losses: 0, draws: 0 } } });
    expect(storedUser('alice').stats).toMatchObject({ chess: { wins: 1, losses: 0, draws: 0 } });
    expect(storedUser('bob').stats).toMatchObject({ chess: empty });
  });

  it('keeps recording for the profile this page shows when another tab logged out', () => {
    storeProfile();
    const { result } = renderProfile();
    localStorage.removeItem(SESSION_KEY);

    let saved: SaveResult | undefined;
    act(() => {
      saved = result.current.recordResult('chess', 'wins');
    });

    expect(saved).toEqual({ ok: true });
    expect(storedUser('tester').stats).toMatchObject({ chess: { wins: 1, losses: 0, draws: 0 } });
  });

  it('starts every change from the stored profile, so results stored by another tab are kept', () => {
    storeProfile();
    const { result } = renderProfile();
    const stored = storedUser('tester');
    localStorage.setItem('games-react-users', JSON.stringify({
      tester: { ...stored, stats: { tictactoe: { wins: 2, losses: 0, draws: 0 }, chess: empty, checkers: empty } },
    }));

    act(() => result.current.recordResult('chess', 'wins'));

    expect(storedUser('tester').stats).toMatchObject({ tictactoe: { wins: 2, losses: 0, draws: 0 }, chess: { wins: 1, losses: 0, draws: 0 } });
    expect(result.current.profile?.stats.tictactoe).toEqual({ wins: 2, losses: 0, draws: 0 });
  });

  it('resets one game, or every game when none is named', () => {
    storeProfile();
    const { result } = renderProfile();
    act(() => result.current.recordResult('chess', 'wins'));
    act(() => result.current.recordResult('checkers', 'losses'));

    act(() => result.current.resetStats('chess'));

    expect(result.current.profile?.stats.chess).toEqual(empty);
    expect(result.current.profile?.stats.checkers).toEqual({ wins: 0, losses: 1, draws: 0 });

    act(() => result.current.resetStats());

    expect(loadSession()?.stats).toEqual({ tictactoe: empty, chess: empty, checkers: empty });
  });

  it('keeps an older profile signed in while its plain-text password is replaced by a credential', async () => {
    storeLegacyProfile('old', 'Old', 'pass1234', { signedIn: true });

    const { result } = renderProfile();

    expect(result.current.profile).toMatchObject({ login: 'old', name: 'Old' });
    await waitFor(() => expect(readCredential(storedUser('old').credential)).not.toBeNull());
    expect(storedUser('old')).not.toHaveProperty('password');
    expect(localStorage.getItem(SESSION_KEY)).toBe('old');
    expect(result.current.profile).toMatchObject({ login: 'old', name: 'Old' });
  });
});

describe('useProfile', () => {
  it('cannot be used outside the provider', () => {
    // React reports the render error as an uncaught window error and on the console before
    // rethrowing it; both reports are expected here, so they are kept out of the test output.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const swallow = (event: ErrorEvent) => event.preventDefault();
    window.addEventListener('error', swallow);

    expect(() => renderHook(() => useProfile())).toThrow('useProfile must be used within ProfileProvider');

    window.removeEventListener('error', swallow);
    consoleError.mockRestore();
  });
});
