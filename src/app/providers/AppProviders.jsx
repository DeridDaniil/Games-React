import { HashRouter } from 'react-router-dom';
import { ProfileProvider } from '../../features/profile/model/ProfileContext';
import { TicTacToeSettingsProvider } from '../../features/games/tic-tac-toe/model/TicTacToeSettingsContext';

// Application-wide providers: hash routing, the signed-in profile and the Tic-Tac-Toe settings.
// The app passed as children is forwarded to the innermost provider.
function AppProviders(props) {
  return (
    <HashRouter>
      <ProfileProvider>
        <TicTacToeSettingsProvider {...props} />
      </ProfileProvider>
    </HashRouter>
  );
}

export default AppProviders;
