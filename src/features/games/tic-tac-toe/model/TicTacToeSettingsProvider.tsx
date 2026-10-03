import { useState } from 'react';
import type { ReactNode } from 'react';
import { TicTacToeSettingsContext } from './TicTacToeSettingsContext';
import type { TicTacToeSettings } from './types';

const defaultSettings: TicTacToeSettings = {
  mode: 'friend',
  difficulty: 'medium',
  boardSize: 3,
  playerSide: 'X',
};

export function TicTacToeSettingsProvider({ children }: { children: ReactNode }) {
  const [{ settings, settingsVersion }, setState] = useState({ settings: defaultSettings, settingsVersion: 0 });

  // A new version (and so a new game) only when a value really changes: choosing the option that
  // is already selected keeps the same state and nothing re-renders.
  const updateSettings = (patch: Partial<TicTacToeSettings>) => {
    setState(prev => {
      const next = { ...prev.settings, ...patch };
      const changed = next.mode !== prev.settings.mode
        || next.difficulty !== prev.settings.difficulty
        || next.boardSize !== prev.settings.boardSize
        || next.playerSide !== prev.settings.playerSide;
      return changed ? { settings: next, settingsVersion: prev.settingsVersion + 1 } : prev;
    });
  };

  return (
    <TicTacToeSettingsContext.Provider value={{ settings, updateSettings, settingsVersion }}>
      {children}
    </TicTacToeSettingsContext.Provider>
  );
}
