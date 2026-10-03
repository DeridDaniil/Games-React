import { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  loadSession,
  saveProfile,
  register as storageRegister,
  login as storageLogin,
  logout as storageLogout,
} from '../lib/profileStorage';
import { ProfileContext } from './ProfileContext';
import type { GameId, Profile, ProfileChanges, ResultType } from './types';

// The profile signed in on this device and what can be done with it; every change is stored at once.
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(() => loadSession());

  const register = useCallback((login: string, name: string, password: string) => {
    const result = storageRegister(login, name, password);
    if (result.profile) setProfile(result.profile);
    return result;
  }, []);

  const login = useCallback((loginValue: string, password: string) => {
    const result = storageLogin(loginValue, password);
    if (result.profile) setProfile(result.profile);
    return result;
  }, []);

  const logout = useCallback(() => {
    storageLogout();
    setProfile(null);
  }, []);

  // Like the other changes, this needs a signed-in profile: without one there is nothing to update.
  const updateProfile = useCallback((updates: ProfileChanges) => {
    setProfile(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      saveProfile(updated);
      return updated;
    });
  }, []);

  const recordResult = useCallback((game: GameId, result: ResultType) => {
    setProfile(prev => {
      if (!prev) return prev;
      const gameStats = prev.stats[game];
      const updated = {
        ...prev,
        stats: {
          ...prev.stats,
          [game]: {
            ...gameStats,
            [result]: gameStats[result] + 1,
          },
        },
      };
      saveProfile(updated);
      return updated;
    });
  }, []);

  const resetStats = useCallback((game?: GameId) => {
    setProfile(prev => {
      if (!prev) return prev;
      const empty = { wins: 0, losses: 0, draws: 0 };
      const resetted = game
        ? { ...prev, stats: { ...prev.stats, [game]: empty } }
        : { ...prev, stats: { tictactoe: { ...empty }, chess: { ...empty }, checkers: { ...empty } } };
      saveProfile(resetted);
      return resetted;
    });
  }, []);

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
