import type { ReactNode } from 'react';
import { HashRouter } from 'react-router-dom';
import { ProfileProvider } from '../../features/profile/model/ProfileProvider';
import { TicTacToeSettingsProvider } from '../../features/games/tic-tac-toe/model/TicTacToeSettingsProvider';

// Application-wide providers: hash routing, the signed-in profile and the Tic-Tac-Toe settings.
// The app passed as children is rendered inside the innermost provider.
function AppProviders({ children }: { children: ReactNode }) {
  return (
    <HashRouter>
      <ProfileProvider>
        <TicTacToeSettingsProvider>{children}</TicTacToeSettingsProvider>
      </ProfileProvider>
    </HashRouter>
  );
}

export default AppProviders;
