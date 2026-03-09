import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { ProfileProvider } from './profile/ProfileContext'
import { TicTacToeSettingsProvider } from './Games/TicTacToe/context/TicTacToeSettingsContext'
import './index.scss'
import App from './components/App/App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <ProfileProvider>
        <TicTacToeSettingsProvider>
          <App />
        </TicTacToeSettingsProvider>
      </ProfileProvider>
    </HashRouter>
  </StrictMode>,
)
