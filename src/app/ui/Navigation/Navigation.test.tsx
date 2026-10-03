// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navigation from './Navigation';
import { ProfileProvider } from '../../../features/profile/model/ProfileProvider';
import { storeProfile } from '../../../features/profile/test/profileFixtures';

const renderAt = (path: string) => render(
  <MemoryRouter initialEntries={[path]}>
    <ProfileProvider>
      <Navigation />
    </ProfileProvider>
  </MemoryRouter>
);

beforeEach(() => {
  localStorage.clear();
  storeProfile();
});

afterEach(() => {
  localStorage.clear();
});

describe('Navigation', () => {
  it('links to the three games and the profile', () => {
    renderAt('/tictactoe');

    const nav = screen.getByRole('navigation', { name: 'Main' });
    const links = within(nav).getAllByRole('link');

    expect(links.map(link => link.textContent)).toEqual(['Tic Tac Toe', 'Chess', 'Checkers', 'Profile']);
    expect(links.map(link => link.getAttribute('href'))).toEqual(['/tictactoe', '/chess', '/checkers', '/profile']);
  });

  it('marks only the current page', () => {
    renderAt('/chess');

    expect(screen.getByRole('link', { name: 'Chess' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Tic Tac Toe' }).getAttribute('aria-current')).toBeNull();
    expect(screen.getByRole('link', { name: 'Profile' }).getAttribute('aria-current')).toBeNull();
  });

  it('shows the avatar inside the profile entry and names the player in its tooltip', () => {
    renderAt('/profile');

    const profile = screen.getByRole('link', { name: 'Profile' });
    expect(profile.getAttribute('aria-current')).toBe('page');
    expect(profile.getAttribute('title')).toBe('Tester');
    expect(profile.querySelector('img')).not.toBeNull();
  });

  it('only navigates: game info and settings are not part of it', () => {
    renderAt('/chess');

    expect(screen.queryByRole('button')).toBeNull();
  });
});
