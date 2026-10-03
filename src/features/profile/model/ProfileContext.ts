import { createContext, useContext } from 'react';
import type { AuthResult, GameId, Profile, ProfileChanges, ResultType, SaveResult } from './types';

// Registering and signing in check the password (Web Crypto), so they finish later. The changes are
// stored at once and say whether that worked; the profile only shows a change once it is stored.
interface ProfileContextValue {
  profile: Profile | null;
  hasProfile: boolean;
  register: (login: string, name: string, password: string) => Promise<AuthResult>;
  login: (login: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  updateProfile: (changes: ProfileChanges) => SaveResult;
  recordResult: (game: GameId, result: ResultType) => SaveResult;
  // Without a game, every game is reset.
  resetStats: (game?: GameId) => SaveResult;
}

// Provided by ProfileProvider; there is no profile API outside of it.
export const ProfileContext = createContext<ProfileContextValue | null>(null);

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
