// @vitest-environment jsdom
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import App from './App';
import { ProfileProvider } from '../features/profile/model/ProfileProvider';
import { TicTacToeSettingsProvider } from '../features/games/tic-tac-toe/model/TicTacToeSettingsProvider';
import { loadSession, register } from '../features/profile/lib/profileStorage';

// Shows where the router is, so a test can tell a redirect from a page that merely looks right.
function LocationProbe() {
  const { pathname } = useLocation();
  return <output aria-label="Current route">{pathname}</output>;
}

// Same tree as main.tsx (StrictMode + providers), with an in-memory router to pick the starting route.
const renderAt = (route: string) => render(
  <StrictMode>
    <MemoryRouter initialEntries={[route]}>
      <ProfileProvider>
        <TicTacToeSettingsProvider>
          <App />
          <LocationProbe />
        </TicTacToeSettingsProvider>
      </ProfileProvider>
    </MemoryRouter>
  </StrictMode>
);

const currentRoute = () => screen.getByRole('status', { name: 'Current route' }).textContent;

const fill = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

const submit = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

const expectTicTacToe = async () => {
  expect(await screen.findByRole('heading', { level: 1, name: 'Tic Tac Toe' })).toBeTruthy();
  expect(currentRoute()).toBe('/tictactoe');
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('App routing (smoke)', () => {
  it('sends a visitor without a profile to the sign-in page', () => {
    renderAt('/chess');

    expect(currentRoute()).toBe('/profile/create');
    expect(screen.getByRole('tab', { name: 'Sign in', selected: true })).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Main' })).toBeNull();
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

      expect(screen.getByRole('heading', { level: 1, name: 'Tester' })).toBeTruthy();
      expect(screen.getByRole('heading', { level: 2, name: 'Games' })).toBeTruthy();
    });

    it('redirects unknown routes to Tic-Tac-Toe', () => {
      renderAt('/does-not-exist');
      expect(screen.getByRole('heading', { level: 1, name: 'Tic Tac Toe' })).toBeTruthy();
    });

    it('sends a signed-in visitor of the sign-in page to Tic-Tac-Toe', async () => {
      renderAt('/profile/create');
      await expectTicTacToe();
    });

    it('logs out to the sign-in page and keeps the profile on this device', async () => {
      renderAt('/profile');

      fireEvent.click(screen.getByRole('button', { name: 'Log out' }));

      expect(await screen.findByRole('tab', { name: 'Sign in', selected: true })).toBeTruthy();
      expect(currentRoute()).toBe('/profile/create');
      expect(loadSession()).toBeNull();
      expect(Object.keys(JSON.parse(localStorage.getItem('games-react-users') ?? '{}'))).toEqual(['tester']);
    });
  });

  // Regression: the gate used to send a freshly signed-in user from /profile/create to /profile
  // before the form's own navigation to /tictactoe was applied.
  describe('after signing in or registering', () => {
    it('lands on Tic-Tac-Toe after signing in', async () => {
      register('tester', 'Tester', 'secret');
      localStorage.removeItem('games-react-session');
      renderAt('/profile/create');

      fill('Login', 'tester');
      fill('Password', 'secret');
      submit('Sign in');

      await expectTicTacToe();
    });

    it('lands on Tic-Tac-Toe after registering', async () => {
      renderAt('/profile/create');

      fireEvent.click(screen.getByRole('tab', { name: 'Register' }));
      fill('Login', 'newcomer');
      fill('Display name', 'Newcomer');
      fill('Password', 'secret');
      submit('Create profile');

      await expectTicTacToe();
      expect(loadSession()).toMatchObject({ login: 'newcomer', name: 'Newcomer' });
    });

    it('lands on Tic-Tac-Toe when the sign-in page was opened from a game link', async () => {
      register('tester', 'Tester', 'secret');
      localStorage.removeItem('games-react-session');
      renderAt('/chess');

      fill('Login', 'tester');
      fill('Password', 'secret');
      submit('Sign in');

      await expectTicTacToe();
    });
  });
});
