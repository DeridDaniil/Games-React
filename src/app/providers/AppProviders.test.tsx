// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import AppProviders from './AppProviders';
import { useProfile } from '../../features/profile/model/ProfileContext';
import { useTicTacToeSettings } from '../../features/games/tic-tac-toe/model/TicTacToeSettingsContext';

function Probe() {
  const { pathname } = useLocation();
  const { hasProfile } = useProfile();
  const { settings } = useTicTacToeSettings();
  return <p>{`${pathname} ${hasProfile} ${settings.mode}`}</p>;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  window.location.hash = '';
});

describe('AppProviders', () => {
  it('gives the app hash routing, the profile and the Tic-Tac-Toe settings', () => {
    window.location.hash = '#/chess';

    render(
      <AppProviders>
        <Probe />
      </AppProviders>
    );

    expect(screen.getByText('/chess false friend')).toBeTruthy();
  });
});
