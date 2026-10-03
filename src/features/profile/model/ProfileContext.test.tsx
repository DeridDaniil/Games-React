// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useProfile } from './ProfileContext';
import { ProfileProvider } from './ProfileProvider';
import { loadSession, register as storageRegister } from '../lib/profileStorage';
import type { AuthResult, UserRecord } from './types';

const empty = { wins: 0, losses: 0, draws: 0 };

const renderProfile = () => renderHook(() => useProfile(), { wrapper: ProfileProvider });

const storedUser = (login: string): UserRecord => JSON.parse(localStorage.getItem('games-react-users') ?? '{}')[login];

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('ProfileProvider', () => {
  it('starts signed out when there is no session', () => {
    const { result } = renderProfile();

    expect(result.current.profile).toBeNull();
    expect(result.current.hasProfile).toBe(false);
  });

  it('starts with the profile of the stored session', () => {
    storageRegister('tester', 'Tester', 'secret');

    const { result } = renderProfile();

    expect(result.current.hasProfile).toBe(true);
    expect(result.current.profile).toMatchObject({ login: 'tester', name: 'Tester' });
  });

  it('signs a newly registered profile in and returns it', () => {
    const { result } = renderProfile();

    let outcome: AuthResult | undefined;
    act(() => {
      outcome = result.current.register('tester', 'Tester', 'secret');
    });

    expect(outcome?.profile).toMatchObject({ login: 'tester' });
    expect(result.current.profile).toEqual(outcome?.profile);
    expect(loadSession()?.login).toBe('tester');
  });

  it('returns the error and stays signed out when the login is taken', () => {
    storageRegister('tester', 'Tester', 'secret');
    localStorage.removeItem('games-react-session');
    const { result } = renderProfile();

    let outcome: AuthResult | undefined;
    act(() => {
      outcome = result.current.register('tester', 'Other', 'other');
    });

    expect(outcome).toEqual({ error: 'User with this login already exists' });
    expect(result.current.hasProfile).toBe(false);
  });

  it('signs in with the right password only', () => {
    storageRegister('tester', 'Tester', 'secret');
    localStorage.removeItem('games-react-session');
    const { result } = renderProfile();

    act(() => {
      expect(result.current.login('tester', 'wrong')).toEqual({ error: 'Wrong password' });
    });
    expect(result.current.hasProfile).toBe(false);

    act(() => {
      result.current.login('tester', 'secret');
    });
    expect(result.current.profile?.login).toBe('tester');
  });

  it('signs out but keeps the profile on this device', () => {
    storageRegister('tester', 'Tester', 'secret');
    const { result } = renderProfile();

    act(() => result.current.logout());

    expect(result.current.profile).toBeNull();
    expect(loadSession()).toBeNull();
    expect(storedUser('tester').name).toBe('Tester');
  });

  it('merges profile changes and stores them', () => {
    storageRegister('tester', 'Tester', 'secret');
    const { result } = renderProfile();

    act(() => result.current.updateProfile({ name: 'Renamed' }));

    expect(result.current.profile).toMatchObject({ login: 'tester', name: 'Renamed' });
    expect(storedUser('tester').name).toBe('Renamed');
  });

  // Nothing in the app edits a profile while signed out; if anything did, it must not invent one.
  it('changes nothing and stores nothing when nobody is signed in', () => {
    const { result } = renderProfile();

    act(() => result.current.updateProfile({ name: 'Nobody' }));

    expect(result.current.profile).toBeNull();
    expect(result.current.hasProfile).toBe(false);
    expect(localStorage.getItem('games-react-users')).toBeNull();
  });

  it('records one result of a game and stores it', () => {
    storageRegister('tester', 'Tester', 'secret');
    const { result } = renderProfile();

    act(() => result.current.recordResult('chess', 'wins'));
    act(() => result.current.recordResult('chess', 'draws'));

    expect(result.current.profile?.stats.chess).toEqual({ wins: 1, losses: 0, draws: 1 });
    expect(storedUser('tester').stats.chess).toEqual({ wins: 1, losses: 0, draws: 1 });
    expect(result.current.profile?.stats.tictactoe).toEqual(empty);
  });

  it('resets one game, or every game when none is named', () => {
    storageRegister('tester', 'Tester', 'secret');
    const { result } = renderProfile();
    act(() => result.current.recordResult('chess', 'wins'));
    act(() => result.current.recordResult('checkers', 'losses'));

    act(() => result.current.resetStats('chess'));

    expect(result.current.profile?.stats.chess).toEqual(empty);
    expect(result.current.profile?.stats.checkers).toEqual({ wins: 0, losses: 1, draws: 0 });

    act(() => result.current.resetStats());

    expect(storedUser('tester').stats).toEqual({ tictactoe: empty, chess: empty, checkers: empty });
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
