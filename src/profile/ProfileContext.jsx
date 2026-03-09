import { createContext, useContext, useState, useCallback } from 'react';
import {
  loadSession,
  saveProfile,
  register as storageRegister,
  login as storageLogin,
  logout as storageLogout,
} from './profileStorage';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(() => loadSession());

  const register = useCallback((login, name, password) => {
    const result = storageRegister(login, name, password);
    if (result.profile) setProfile(result.profile);
    return result;
  }, []);

  const login = useCallback((loginValue, password) => {
    const result = storageLogin(loginValue, password);
    if (result.profile) setProfile(result.profile);
    return result;
  }, []);

  const logout = useCallback(() => {
    storageLogout();
    setProfile(null);
  }, []);

  const updateProfile = useCallback((updates) => {
    setProfile(prev => {
      const updated = { ...prev, ...updates };
      saveProfile(updated);
      return updated;
    });
  }, []);

  const recordResult = useCallback((game, result) => {
    setProfile(prev => {
      if (!prev) return prev;
      const gameStats = prev.stats[game] || { wins: 0, losses: 0, draws: 0 };
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

  const resetStats = useCallback((game) => {
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

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
