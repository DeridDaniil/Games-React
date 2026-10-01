import { createContext, useContext, useState } from 'react';

const TicTacToeSettingsContext = createContext();

const defaultSettings = {
  mode: 'friend',       // 'friend' | 'computer'
  difficulty: 'medium', // 'easy' | 'medium' | 'unbeatable'
  boardSize: 3,         // 3 | 5 | 7
  playerSide: 'X',      // 'X' | 'O'
};

export function TicTacToeSettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [settingsVersion, setSettingsVersion] = useState(0);

  const updateSettings = (patch) => {
    setSettings(prev => ({ ...prev, ...patch }));
    setSettingsVersion(v => v + 1);
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
