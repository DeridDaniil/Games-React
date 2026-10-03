import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AppProviders from './app/providers/AppProviders'
import './shared/styles/globals.scss'
import App from './app/App'

const root = document.getElementById('root')
if (!root) throw new Error('index.html has no #root element to render the app into')

createRoot(root).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
