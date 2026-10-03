import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  SAVE_ERROR,
  loadProfile,
  loadSession,
  migratePlainPasswords,
  saveProfile,
  register as storageRegister,
  login as storageLogin,
  logout as storageLogout,
} from '../lib/profileStorage';
import { ProfileContext } from './ProfileContext';
import type { GameId, Profile, ProfileChanges, ResultType, SaveResult } from './types';

// The profile signed in on this device and what can be done with it; every change is stored at once.
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(() => loadSession());

  // Profiles stored by an older version keep their password as typed until it is replaced by a
  // credential here; whoever is signed in stays signed in. A profile that cannot be moved yet keeps
  // working and is tried again on the next visit.
  useEffect(() => {
    migratePlainPasswords().then(({ failed }) => {
      if (failed > 0) console.warn(`${failed} local profile(s) still keep a plain-text password; moving them will be tried again on the next visit.`);
    });
  }, []);

  const register = useCallback(async (login: string, name: string, password: string) => {
    const result = await storageRegister(login, name, password);
    if (result.profile) setProfile(result.profile);
    return result;
  }, []);

  const login = useCallback(async (loginValue: string, password: string) => {
    const result = await storageLogin(loginValue, password);
    if (result.profile) setProfile(result.profile);
    return result;
  }, []);

  const logout = useCallback(() => {
    storageLogout();
    setProfile(null);
  }, []);

  // Every change goes to the profile this page shows, even if another tab has since signed in someone
  // else, and starts from what is stored for it now, so changes another tab stored are kept. It is
  // shown only once it is stored; without a signed-in profile there is nothing to change.
  const signedInLogin = profile?.login ?? null;
  const change = useCallback((update: (current: Profile) => Profile): SaveResult => {
    const current = signedInLogin === null ? null : loadProfile(signedInLogin);
    if (!current) return { ok: false, error: SAVE_ERROR };
    const updated = update(current);
    const saved = saveProfile(updated);
    if (saved.ok) setProfile(updated);
    return saved;
  }, [signedInLogin]);

  const updateProfile = useCallback(
    (updates: ProfileChanges) => change(current => ({ ...current, ...updates })),
    [change]
  );

  const recordResult = useCallback((game: GameId, result: ResultType) => change(current => {
    const gameStats = current.stats[game];
    return { ...current, stats: { ...current.stats, [game]: { ...gameStats, [result]: gameStats[result] + 1 } } };
  }), [change]);

  const resetStats = useCallback((game?: GameId) => change(current => {
    const empty = { wins: 0, losses: 0, draws: 0 };
    return game
      ? { ...current, stats: { ...current.stats, [game]: empty } }
      : { ...current, stats: { ...current.stats, tictactoe: { ...empty }, chess: { ...empty }, checkers: { ...empty } } };
  }), [change]);

  const hasProfile = !!profile;

  return (
    <ProfileContext.Provider value={{
      profile, hasProfile,
      register, login, logout,
      updateProfile, recordResult, resetStats,
    }}>
      {children}
    </ProfileContext.Provider>
  );
}
