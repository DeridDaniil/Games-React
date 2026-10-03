// @vitest-environment jsdom
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import GameEnds from './GameEnds';
import ChessContext from '../../../model/Context';
import { initChessGame } from '../../../model/constant';
import { ActionTypes, Status } from '../../../model/types';
import type { ChessAction, ChessState, ChessStatus } from '../../../model/types';
import { ProfileProvider } from '../../../../../profile/model/ProfileProvider';
import { loadSession, register } from '../../../../../profile/lib/profileStorage';
import { getElement } from '../../../../../../shared/test/dom';
import type { Dispatch } from 'react';

beforeEach(() => {
  localStorage.clear();
  register('tester', 'Tester', 'secret');
});

afterEach(() => {
  localStorage.clear();
});

const renderWithStatus = (
  status: ChessStatus,
  { strict = false, state = {} }: { strict?: boolean; state?: Partial<ChessState> } = {}
) => {
  const dispatch = vi.fn<Dispatch<ChessAction>>();
  const tree = (
    <ProfileProvider>
      <ChessContext.Provider value={{ chessState: { ...initChessGame, ...state, status }, dispatch }}>
        <GameEnds />
      </ChessContext.Provider>
    </ProfileProvider>
  );
  return { ...render(strict ? <StrictMode>{tree}</StrictMode> : tree), dispatch };
};

const chessStats = () => loadSession()?.stats.chess;
const noGames = { wins: 0, losses: 0, draws: 0 };

describe('Chess GameEnds', () => {
  // Profile stats are kept from White's point of view.
  it.each([
    [Status.white, 'White', 'wins'],
    [Status.black, 'Black', 'losses'],
    [Status.whiteOnTime, 'White', 'wins'],
    [Status.blackOnTime, 'Black', 'losses']
  ])('"%s" shows the %s king and records a %s', (status, winner, result) => {
    const { container } = renderWithStatus(status);

    expect(screen.getByRole('heading', { name: status })).toBeTruthy();
    expect(getElement(container, '.wins').classList.contains(winner)).toBe(true);
    expect(chessStats()).toEqual({ ...noGames, [result]: 1 });
  });

  it.each([Status.stalemate, Status.insufficient])('"%s" is shown as a draw and recorded as one', (status) => {
    const { container } = renderWithStatus(status);

    expect(screen.getByRole('heading', { name: 'Draw' })).toBeTruthy();
    expect(screen.getByText(status)).toBeTruthy();
    expect(container.querySelector('.draws')).not.toBeNull();
    expect(chessStats()).toEqual({ ...noGames, draws: 1 });
  });

  it('records the result only once under StrictMode', () => {
    renderWithStatus(Status.black, { strict: true });
    expect(chessStats()).toEqual({ ...noGames, losses: 1 });
  });

  it('marks the game as recorded, so the same game is never recorded twice', () => {
    const { dispatch } = renderWithStatus(Status.white);

    expect(dispatch).toHaveBeenCalledWith({ type: ActionTypes.RESULT_RECORDED });
  });

  // A game resumed by Take Back after it ended keeps the result recorded when it first ended.
  it('records nothing for a game whose result is already recorded', () => {
    renderWithStatus(Status.white, { state: { resultRecorded: true } });

    expect(screen.getByRole('heading', { name: Status.white })).toBeTruthy();
    expect(chessStats()).toEqual(noGames);
  });

  it.each([Status.ongoing, Status.promoting])('renders nothing and records nothing while "%s"', (status) => {
    const { container } = renderWithStatus(status);

    expect(container.innerHTML).toBe('');
    expect(chessStats()).toEqual(noGames);
  });
});
