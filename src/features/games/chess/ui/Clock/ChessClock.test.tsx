// @vitest-environment jsdom
// Chess-specific clock semantics only; the shared timer itself is covered by GameClock.test.tsx.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import ChessClock from './ChessClock';
import ChessContext from '../../model/Context';
import { DEFAULT_TIME_CONTROL_MS, initChessGame } from '../../model/constant';
import { ActionTypes, Status } from '../../model/types';
import type { ChessAction, ChessState } from '../../model/types';
import { getElement, ofType } from '../../../../../shared/test/dom';
import type { Dispatch } from 'react';

const running = { clockStarted: true, status: Status.ongoing };

const renderClock = (overrides: Partial<ChessState> = {}) => {
  const dispatch = vi.fn<Dispatch<ChessAction>>();
  const tree = (state: Partial<ChessState>) => (
    <ChessContext.Provider value={{ chessState: { ...initChessGame, ...state }, dispatch }}>
      <ChessClock />
    </ChessContext.Provider>
  );
  const view = render(tree(overrides));
  return { dispatch, update: (state: Partial<ChessState>) => view.rerender(tree(state)) };
};

const card = (label: string) => ofType(screen.getByText(label).closest('[class*="game-timer--"]'), HTMLElement);
const timeOf = (label: string) => card(label).textContent?.match(/\d\d:\d\d/)?.[0];
const barWidth = (label: string) => getElement(card(label), '[class*="bar-fill"]').style.width;
const isActive = (label: string) => card(label).classList.contains('game-timer--active');
const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ChessClock', () => {
  it('shows both chess times against the chess time control', () => {
    renderClock({ whiteTime: 60_000, blackTime: DEFAULT_TIME_CONTROL_MS / 2 });

    expect([timeOf('White'), timeOf('Black')]).toEqual(['01:00', '02:30']);
    expect([barWidth('White'), barWidth('Black')]).toEqual(['20%', '50%']);
  });

  it('dispatches the chess tick action every second while the game is ongoing', () => {
    const { dispatch } = renderClock({ ...running, turn: 'black' });

    advance(3_000);

    expect(dispatch).toHaveBeenCalledTimes(3);
    expect(dispatch).toHaveBeenCalledWith({ type: ActionTypes.TICK, payload: { delta: 1000 } });
    expect([isActive('White'), isActive('Black')]).toEqual([false, true]);
  });

  it('keeps ticking while a promotion piece is being chosen', () => {
    const { dispatch } = renderClock({ ...running, status: Status.promoting });

    advance(2_000);

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(isActive('White')).toBe(true);
  });

  it('does not tick before the clock is started', () => {
    const { dispatch } = renderClock({ clockStarted: false });

    advance(5_000);

    expect(dispatch).not.toHaveBeenCalled();
    expect([isActive('White'), isActive('Black')]).toEqual([false, false]);
  });

  it.each([
    Status.white,
    Status.black,
    Status.stalemate,
    Status.insufficient,
    Status.whiteOnTime,
    Status.blackOnTime
  ])('does not tick once the game has ended: %s', (status) => {
    const { dispatch } = renderClock({ ...running, status });

    advance(3_000);

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('stops ticking when the game ends while the clock is running', () => {
    const { dispatch, update } = renderClock(running);
    advance(1_000);

    update({ ...running, status: Status.white });
    advance(5_000);

    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});
