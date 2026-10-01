// @vitest-environment jsdom
// Checkers-specific clock semantics only; the shared timer itself is covered by GameClock.test.jsx.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import CheckersClock from './CheckersClock';
import CheckersContext from '../../model/Context';
import { DEFAULT_TIME_CONTROL_MS, initCheckersGame } from '../../model/constant';
import { ActionTypes, Status } from '../../model/types';

const running = { clockStarted: true, status: Status.ongoing };

const renderClock = (overrides = {}) => {
  const dispatch = vi.fn();
  const tree = (state) => (
    <CheckersContext.Provider value={{ checkersState: { ...initCheckersGame, ...state }, dispatch }}>
      <CheckersClock />
    </CheckersContext.Provider>
  );
  const view = render(tree(overrides));
  return { dispatch, update: (state) => view.rerender(tree(state)) };
};

const card = (label) => screen.getByText(label).closest('[class*="game-timer--"]');
const timeOf = (label) => card(label).textContent.match(/\d\d:\d\d/)[0];
const barWidth = (label) => card(label).querySelector('[class*="bar-fill"]').style.width;
const isActive = (label) => card(label).classList.contains('game-timer--active');
const advance = (ms) => act(() => { vi.advanceTimersByTime(ms); });

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('CheckersClock', () => {
  it('shows both checkers times against the checkers time control', () => {
    renderClock({ whiteTime: DEFAULT_TIME_CONTROL_MS / 2, blackTime: 60_000 });

    expect([timeOf('White'), timeOf('Black')]).toEqual(['02:30', '01:00']);
    expect([barWidth('White'), barWidth('Black')]).toEqual(['50%', '20%']);
  });

  it('dispatches the checkers tick action every second while the game is ongoing', () => {
    const { dispatch } = renderClock({ ...running, turn: 'white' });

    advance(3_000);

    expect(dispatch).toHaveBeenCalledTimes(3);
    expect(dispatch).toHaveBeenCalledWith({ type: ActionTypes.TICK, payload: { delta: 1000 } });
    expect([isActive('White'), isActive('Black')]).toEqual([true, false]);
  });

  it('does not tick before the clock is started', () => {
    const { dispatch } = renderClock({ clockStarted: false });

    advance(5_000);

    expect(dispatch).not.toHaveBeenCalled();
    expect([isActive('White'), isActive('Black')]).toEqual([false, false]);
  });

  it.each([
    Status.whiteWins,
    Status.blackWins,
    Status.draw,
    Status.whiteOnTime,
    Status.blackOnTime,
    Status.whiteSurrender,
    Status.blackSurrender
  ])('does not tick once the game has ended: %s', (status) => {
    const { dispatch } = renderClock({ ...running, status });

    advance(3_000);

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('stops ticking when a player surrenders while the clock is running', () => {
    const { dispatch, update } = renderClock(running);
    advance(1_000);

    update({ ...running, status: Status.blackSurrender });
    advance(5_000);

    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});
