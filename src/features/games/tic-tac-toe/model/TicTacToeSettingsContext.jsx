import { createContext, useContext, useState } from 'react';

const TicTacToeSettingsContext = createContext();

const defaultSettings = {
  mode: 'friend',       // 'friend' | 'computer'
  difficulty: 'medium', // 'easy' | 'medium' | 'unbeatable'
  boardSize: 3,         // 3 | 5 | 7
  playerSide: 'X',      // 'X' | 'O'
};

export function TicTacToeSettingsProvider({ children }) {
  const [{ settings, settingsVersion }, setState] = useState({ settings: defaultSettings, settingsVersion: 0 });

  // A new version (and so a new game) only when a value really changes: choosing the option that
  // is already selected keeps the same state and nothing re-renders.
  const updateSettings = (patch) => {
    setState(prev => {
      const changed = Object.entries(patch).some(([key, value]) => prev.settings[key] !== value);
      return changed
        ? { settings: { ...prev.settings, ...patch }, settingsVersion: prev.settingsVersion + 1 }
        : prev;
    });
  };

  return (
    <TicTacToeSettingsContext.Provider value={{ settings, updateSettings, settingsVersion }}>
      {children}
    </TicTacToeSettingsContext.Provider>
  );
}

export function useTicTacToeSettings() {
  const ctx = useContext(TicTacToeSettingsContext);
  if (!ctx) throw new Error('useTicTacToeSettings must be used within TicTacToeSettingsProvider');
  return ctx;
}
