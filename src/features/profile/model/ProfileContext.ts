import { createContext, useContext } from 'react';
import type { AuthResult, GameId, Profile, ProfileChanges, ResultType } from './types';

export interface ProfileContextValue {
  profile: Profile | null;
  hasProfile: boolean;
  register: (login: string, name: string, password: string) => AuthResult;
  login: (login: string, password: string) => AuthResult;
  logout: () => void;
  updateProfile: (changes: ProfileChanges) => void;
  recordResult: (game: GameId, result: ResultType) => void;
  // Without a game, every game is reset.
  resetStats: (game?: GameId) => void;
}

// Provided by ProfileProvider; there is no profile API outside of it.
export const ProfileContext = createContext<ProfileContextValue | null>(null);

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
