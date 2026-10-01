// @vitest-environment jsdom
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import GameEnds from './GameEnds';
import CheckersContext from '../../model/Context';
import { initCheckersGame } from '../../model/constant';
import { Status } from '../../model/types';
import { ProfileProvider } from '../../../../profile/model/ProfileContext';
import { loadSession, register } from '../../../../profile/lib/profileStorage';

beforeEach(() => {
  localStorage.clear();
  register('tester', 'Tester', 'secret');
});

afterEach(() => {
  localStorage.clear();
});

const renderWithStatus = (status, { strict = false } = {}) => {
  const tree = (
    <ProfileProvider>
      <CheckersContext.Provider value={{ checkersState: { ...initCheckersGame, status }, dispatch: vi.fn() }}>
        <GameEnds />
      </CheckersContext.Provider>
    </ProfileProvider>
  );
  return render(strict ? <StrictMode>{tree}</StrictMode> : tree);
};

const checkersStats = () => loadSession().stats.checkers;
const noGames = { wins: 0, losses: 0, draws: 0 };

describe('Checkers GameEnds', () => {
  // Profile stats are kept from White's point of view.
  it.each([
    [Status.whiteWins, 'white', 'wins'],
    [Status.blackWins, 'black', 'losses'],
    [Status.whiteOnTime, 'white', 'wins'],
    [Status.blackOnTime, 'black', 'losses'],
    [Status.blackSurrender, 'white', 'wins'],
    [Status.whiteSurrender, 'black', 'losses']
  ])('"%s" shows the %s checker and records a %s', (status, winner, result) => {
    const { container } = renderWithStatus(status);

    expect(screen.getByRole('heading', { name: status })).toBeTruthy();
    expect(container.querySelector('.wins').classList.contains(winner)).toBe(true);
    expect(checkersStats()).toEqual({ ...noGames, [result]: 1 });
  });

  it('records the result only once under StrictMode', () => {
    renderWithStatus(Status.whiteWins, { strict: true });
    expect(checkersStats()).toEqual({ ...noGames, wins: 1 });
  });

  it('renders nothing and records nothing while the game is ongoing', () => {
    const { container } = renderWithStatus(Status.ongoing);

    expect(container.innerHTML).toBe('');
    expect(checkersStats()).toEqual(noGames);
  });
});
