// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import ProfileCreate from './ProfileCreate';
import { ProfileProvider } from '../../model/ProfileProvider';
import { loadSession, logout, register } from '../../lib/profileStorage';
import type { UserRecord } from '../../model/types';
import { ofType } from '../../../../shared/test/dom';

function LocationProbe() {
  const { pathname } = useLocation();
  return <output aria-label="Current route">{pathname}</output>;
}

const renderPage = () => render(
  <MemoryRouter initialEntries={['/profile/create']}>
    <ProfileProvider>
      <Routes>
        <Route path="/profile/create" element={<ProfileCreate />} />
        <Route path="/tictactoe" element={<h1>Tic Tac Toe</h1>} />
      </Routes>
      <LocationProbe />
    </ProfileProvider>
  </MemoryRouter>
);

const currentRoute = () => screen.getByRole('status', { name: 'Current route' }).textContent;
const field = (label: string) => ofType(screen.getByLabelText(label), HTMLInputElement);
const fill = (label: string, value: string) => fireEvent.change(field(label), { target: { value } });
const tab = (name: string) => screen.getByRole('tab', { name });
const submit = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const alertText = () => screen.getByRole('alert').textContent;
const isInvalid = (label: string) => field(label).getAttribute('aria-invalid') === 'true';
const storedUsers = (): Record<string, UserRecord> | null => JSON.parse(localStorage.getItem('games-react-users') ?? 'null');

const signUpTester = () => {
  register('tester', 'Tester', 'secret');
  logout();
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('ProfileCreate', () => {
  describe('modes', () => {
    it('opens in sign-in mode with the login and password fields only', () => {
      renderPage();

      expect(tab('Sign in').getAttribute('aria-selected')).toBe('true');
      expect(tab('Register').getAttribute('aria-selected')).toBe('false');
      expect(field('Login').getAttribute('autocomplete')).toBe('username');
      expect(field('Password').getAttribute('type')).toBe('password');
      expect(field('Password').getAttribute('autocomplete')).toBe('current-password');
      expect(screen.queryByLabelText('Display name')).toBeNull();
      expect(screen.getByRole('button', { name: 'Sign in' }).getAttribute('type')).toBe('submit');
      expect(document.activeElement).toBe(field('Login'));
    });

    it('switches to registration and back', () => {
      renderPage();

      fireEvent.click(tab('Register'));

      expect(tab('Register').getAttribute('aria-selected')).toBe('true');
      const panel = screen.getByRole('tabpanel', { name: 'Register' });
      expect(tab('Register').getAttribute('aria-controls')).toBe(panel.id);
      expect(panel.querySelector('form')).not.toBeNull();
      expect(field('Display name').getAttribute('autocomplete')).toBe('nickname');
      expect(field('Password').getAttribute('autocomplete')).toBe('new-password');
      expect(screen.getByText('At least 3 characters')).toBeTruthy();
      expect(screen.getByText('At least 4 characters')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Create profile' })).toBeTruthy();

      fireEvent.click(tab('Sign in'));

      expect(screen.queryByLabelText('Display name')).toBeNull();
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
    });

    it('moves between the modes with the arrow keys, Home and End', () => {
      renderPage();

      fireEvent.keyDown(tab('Sign in'), { key: 'ArrowRight' });
      expect(tab('Register').getAttribute('aria-selected')).toBe('true');
      expect(document.activeElement).toBe(tab('Register'));
      expect(tab('Register').tabIndex).toBe(0);
      expect(tab('Sign in').tabIndex).toBe(-1);

      fireEvent.keyDown(tab('Register'), { key: 'ArrowLeft' });
      expect(document.activeElement).toBe(tab('Sign in'));

      fireEvent.keyDown(tab('Sign in'), { key: 'End' });
      expect(tab('Register').getAttribute('aria-selected')).toBe('true');

      fireEvent.keyDown(tab('Register'), { key: 'Home' });
      expect(tab('Sign in').getAttribute('aria-selected')).toBe('true');
    });

    it('leaves arrow keys pressed with a modifier to the browser', () => {
      renderPage();

      fireEvent.keyDown(tab('Sign in'), { key: 'ArrowRight', altKey: true });
      fireEvent.keyDown(tab('Sign in'), { key: 'End', ctrlKey: true });

      expect(tab('Sign in').getAttribute('aria-selected')).toBe('true');
    });

    it('keeps what was typed and drops the error when the mode changes', () => {
      renderPage();
      fill('Login', 'tester');
      submit('Sign in');
      expect(screen.getByRole('alert')).toBeTruthy();

      fireEvent.click(tab('Register'));

      expect(screen.queryByRole('alert')).toBeNull();
      expect(field('Login').value).toBe('tester');
    });
  });

  describe('validation (rules unchanged)', () => {
    it('asks to fill in every field and marks the empty ones', () => {
      renderPage();

      submit('Sign in');

      expect(alertText()).toBe('Fill in all fields');
      expect(isInvalid('Login')).toBe(true);
      expect(isInvalid('Password')).toBe(true);
      expect(field('Login').getAttribute('aria-describedby')).toBe('auth-error');
      expect(screen.getByRole('alert').id).toBe('auth-error');
    });

    it('asks for a display name when registering', () => {
      renderPage();
      fireEvent.click(tab('Register'));
      fill('Login', 'tester');
      fill('Password', 'secret');

      submit('Create profile');

      expect(alertText()).toBe('Fill in all fields');
      expect(isInvalid('Display name')).toBe(true);
      expect(isInvalid('Login')).toBe(false);
      expect(field('Display name').getAttribute('aria-describedby')).toBe('auth-name-hint auth-error');
    });

    it('checks the length of a new login, then of a new password', () => {
      renderPage();
      fireEvent.click(tab('Register'));
      fill('Login', 'ab');
      fill('Display name', 'Tester');
      fill('Password', '123');

      submit('Create profile');
      expect(alertText()).toBe('Login must be at least 3 characters');
      expect(isInvalid('Login')).toBe(true);
      expect(isInvalid('Password')).toBe(false);

      fill('Login', 'abc');
      submit('Create profile');
      expect(alertText()).toBe('Password must be at least 4 characters');
      expect(isInvalid('Password')).toBe(true);
      expect(isInvalid('Login')).toBe(false);

      expect(storedUsers()).toBeNull();
    });

    it('does not check lengths when signing in', () => {
      renderPage();
      fill('Login', 'ab');
      fill('Password', '1');

      submit('Sign in');

      expect(alertText()).toBe('User not found');
    });

    it('announces a repeated error again', () => {
      renderPage();
      submit('Sign in');
      const first = screen.getByRole('alert');

      submit('Sign in');

      expect(screen.getByRole('alert')).not.toBe(first);
      expect(alertText()).toBe('Fill in all fields');
    });
  });

  describe('signing in', () => {
    it('signs in and goes to Tic Tac Toe', async () => {
      signUpTester();
      renderPage();
      fill('Login', '  TeStEr ');
      fill('Password', 'secret');

      submit('Sign in');

      expect(await screen.findByRole('heading', { name: 'Tic Tac Toe' })).toBeTruthy();
      expect(currentRoute()).toBe('/tictactoe');
      expect(loadSession()).toMatchObject({ login: 'tester', name: 'Tester' });
    });

    it('marks the login for an unknown user and stays on the page', () => {
      signUpTester();
      renderPage();
      fill('Login', 'nobody');
      fill('Password', 'secret');

      submit('Sign in');

      expect(alertText()).toBe('User not found');
      expect(isInvalid('Login')).toBe(true);
      expect(isInvalid('Password')).toBe(false);
      expect(currentRoute()).toBe('/profile/create');
      expect(loadSession()).toBeNull();
    });

    it('marks the password when it is wrong', () => {
      signUpTester();
      renderPage();
      fill('Login', 'tester');
      fill('Password', 'wrong');

      submit('Sign in');

      expect(alertText()).toBe('Wrong password');
      expect(isInvalid('Password')).toBe(true);
      expect(isInvalid('Login')).toBe(false);
      expect(loadSession()).toBeNull();
    });
  });

  describe('registering', () => {
    it('creates the profile and goes to Tic Tac Toe', async () => {
      renderPage();
      fireEvent.click(tab('Register'));
      fill('Login', 'Newcomer');
      fill('Display name', ' Newcomer ');
      fill('Password', 'secret');

      submit('Create profile');

      expect(await screen.findByRole('heading', { name: 'Tic Tac Toe' })).toBeTruthy();
      expect(currentRoute()).toBe('/tictactoe');
      expect(storedUsers()?.newcomer).toMatchObject({ login: 'newcomer', name: 'Newcomer' });
      expect(loadSession()?.login).toBe('newcomer');
    });

    it('refuses a login that is already taken', () => {
      signUpTester();
      renderPage();
      fireEvent.click(tab('Register'));
      fill('Login', 'TESTER');
      fill('Display name', 'Someone else');
      fill('Password', 'other');

      submit('Create profile');

      expect(alertText()).toBe('User with this login already exists');
      expect(isInvalid('Login')).toBe(true);
      expect(storedUsers()?.tester.name).toBe('Tester');
      expect(currentRoute()).toBe('/profile/create');
    });
  });

  it('says that profiles stay on this device and claims nothing more', () => {
    renderPage();

    expect(screen.getByText('Profiles and statistics are stored on this device.')).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/secure|cloud|encrypt|online/i);
  });
});
