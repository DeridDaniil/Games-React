// @vitest-environment jsdom
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { ProfileProvider } from '../features/profile/model/ProfileContext';
import { TicTacToeSettingsProvider } from '../features/games/tic-tac-toe/model/TicTacToeSettingsContext';
import { register } from '../features/profile/lib/profileStorage';

// Same tree as main.jsx (StrictMode + providers), with an in-memory router to pick the starting route.
const renderAt = (route) => render(
  <StrictMode>
    <MemoryRouter initialEntries={[route]}>
      <ProfileProvider>
        <TicTacToeSettingsProvider>
          <App />
        </TicTacToeSettingsProvider>
      </ProfileProvider>
    </MemoryRouter>
  </StrictMode>
);

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('App routing (smoke)', () => {
  it('sends a visitor without a profile to the login page', () => {
    renderAt('/chess');
    expect(screen.getByRole('heading', { name: 'Login' })).toBeTruthy();
  });

  describe('with a signed-in profile', () => {
    beforeEach(() => {
      register('tester', 'Tester', 'secret');
    });

    it('opens Tic-Tac-Toe', () => {
      renderAt('/tictactoe');
      expect(screen.getByRole('heading', { level: 1, name: 'Tic Tac Toe' })).toBeTruthy();
    });

    it('opens Chess with all pieces in their starting position', () => {
      const { container } = renderAt('/chess');

      expect(screen.getByRole('heading', { level: 1, name: 'Chess' })).toBeTruthy();
      expect(container.querySelectorAll('.figures .figure')).toHaveLength(32);
    });

    it('opens Checkers with all checkers in their starting position', () => {
      const { container } = renderAt('/checkers');

      expect(screen.getByRole('heading', { level: 1, name: 'Checkers' })).toBeTruthy();
      expect(container.querySelectorAll('.checker-figures .checker')).toHaveLength(24);
    });

    it('opens the profile page', () => {
      renderAt('/profile');

      expect(screen.getByRole('heading', { name: 'Tester' })).toBeTruthy();
      expect(screen.getByRole('heading', { name: 'Statistics' })).toBeTruthy();
    });

    it('redirects unknown routes to Tic-Tac-Toe', () => {
      renderAt('/does-not-exist');
      expect(screen.getByRole('heading', { level: 1, name: 'Tic Tac Toe' })).toBeTruthy();
    });
  });
});
