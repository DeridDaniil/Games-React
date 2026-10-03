import { createContext, useContext } from 'react';
import type { TicTacToeSettings } from './types';

export interface TicTacToeSettingsContextValue {
  settings: TicTacToeSettings;
  // Takes the values to change; choosing a value that is already set changes nothing.
  updateSettings: (patch: Partial<TicTacToeSettings>) => void;
  // Goes up with every real change, so the game can start afresh on new settings.
  settingsVersion: number;
}

// Provided by TicTacToeSettingsProvider; there are no settings outside of it.
export const TicTacToeSettingsContext = createContext<TicTacToeSettingsContextValue | null>(null);

export function useTicTacToeSettings(): TicTacToeSettingsContextValue {
  const ctx = useContext(TicTacToeSettingsContext);
  if (!ctx) throw new Error('useTicTacToeSettings must be used within TicTacToeSettingsProvider');
  return ctx;
}
