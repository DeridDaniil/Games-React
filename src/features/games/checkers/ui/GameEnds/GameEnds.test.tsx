// @vitest-environment jsdom
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import GameEnds from './GameEnds';
import CheckersContext from '../../model/Context';
import { initCheckersGame } from '../../model/constant';
import { ActionTypes, Status } from '../../model/types';
import type { CheckersAction, CheckersState, CheckersStatus } from '../../model/types';
import { ProfileProvider } from '../../../../profile/model/ProfileProvider';
import { SAVE_ERROR, loadSession } from '../../../../profile/lib/profileStorage';
import { storeProfile } from '../../../../profile/test/profileFixtures';
import { getElement } from '../../../../../shared/test/dom';
import type { Dispatch } from 'react';

beforeEach(() => {
  localStorage.clear();
  storeProfile();
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

const renderWithStatus = (
  status: CheckersStatus,
  { strict = false, state = {} }: { strict?: boolean; state?: Partial<CheckersState> } = {}
) => {
  const dispatch = vi.fn<Dispatch<CheckersAction>>();
  const tree = (
    <ProfileProvider>
      <CheckersContext.Provider value={{ checkersState: { ...initCheckersGame, ...state, status }, dispatch }}>
        <GameEnds />
      </CheckersContext.Provider>
    </ProfileProvider>
  );
  return { ...render(strict ? <StrictMode>{tree}</StrictMode> : tree), dispatch };
};

const checkersStats = () => loadSession()?.stats.checkers;
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
    expect(getElement(container, '.wins').classList.contains(winner)).toBe(true);
    expect(checkersStats()).toEqual({ ...noGames, [result]: 1 });
  });

  it('records the result only once under StrictMode', () => {
    renderWithStatus(Status.whiteWins, { strict: true });
    expect(checkersStats()).toEqual({ ...noGames, wins: 1 });
  });

  it('marks the game as recorded, so the same game is never recorded twice', () => {
    const { dispatch } = renderWithStatus(Status.blackWins);

    expect(dispatch).toHaveBeenCalledWith({ type: ActionTypes.RESULT_RECORDED });
  });

  // The game still ends as it should. The player is told its result is not stored, and the game stays
  // unrecorded, so if Take Back resumes it, its result can be stored when it ends again.
  it('says so when the result cannot be stored, and leaves the game unrecorded', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    });

    const { dispatch } = renderWithStatus(Status.whiteWins);

    expect(screen.getByRole('heading', { name: Status.whiteWins })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain(SAVE_ERROR);
    expect(dispatch).not.toHaveBeenCalledWith({ type: ActionTypes.RESULT_RECORDED });
    expect(checkersStats()).toEqual(noGames);
  });

  // A game resumed by Take Back after it ended keeps the result recorded when it first ended.
  it('records nothing for a game whose result is already recorded', () => {
    renderWithStatus(Status.whiteOnTime, { state: { resultRecorded: true } });

    expect(screen.getByRole('heading', { name: Status.whiteOnTime })).toBeTruthy();
    expect(checkersStats()).toEqual(noGames);
  });

  it('renders nothing and records nothing while the game is ongoing', () => {
    const { container } = renderWithStatus(Status.ongoing);

    expect(container.innerHTML).toBe('');
    expect(checkersStats()).toEqual(noGames);
  });
});
