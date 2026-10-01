// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import GameClock from './GameClock';

const INITIAL_MS = 5 * 60 * 1000;

const renderClock = (overrides = {}) => {
  const onTick = vi.fn();
  const clock = (props) => (
    <GameClock
      whiteTime={INITIAL_MS}
      blackTime={INITIAL_MS}
      turn="white"
      isRunning={false}
      onTick={onTick}
      initialTimeMs={INITIAL_MS}
      {...props}
    />
  );
  const view = render(clock(overrides));
  return { onTick, unmount: view.unmount, update: (props) => view.rerender(clock(props)) };
};

// The timer card is the closest ancestor with a colour modifier (game-timer--white / --black).
const card = (label) => screen.getByText(label).closest('[class*="game-timer--"]');
const timeOf = (label) => card(label).textContent.match(/\d\d:\d\d/)[0];
const hasState = (label, state) => card(label).className.split(' ').some(name => name.endsWith(`--${state}`));
const barWidth = (label) => card(label).querySelector('[class*="bar-fill"]').style.width;
const advance = (ms) => act(() => { vi.advanceTimersByTime(ms); });

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('GameClock display', () => {
  it('shows five minutes as 05:00 with a full bar for both players', () => {
    renderClock();

    expect([timeOf('White'), timeOf('Black')]).toEqual(['05:00', '05:00']);
    expect([barWidth('White'), barWidth('Black')]).toEqual(['100%', '100%']);
  });

  it('enters the low state at 30 seconds and the critical state at 10 seconds', () => {
    const { update } = renderClock({ whiteTime: 30_000, blackTime: 10_000 });

    expect([timeOf('White'), timeOf('Black')]).toEqual(['00:30', '00:10']);
    expect([hasState('White', 'low'), hasState('White', 'critical')]).toEqual([true, false]);
    expect([hasState('Black', 'low'), hasState('Black', 'critical')]).toEqual([true, true]);

    update({ whiteTime: 31_000, blackTime: 11_000 });

    expect([hasState('White', 'low'), hasState('White', 'critical')]).toEqual([false, false]);
    expect([hasState('Black', 'low'), hasState('Black', 'critical')]).toEqual([true, false]);
  });

  it('shows a negative remaining time as 00:00 with an empty bar', () => {
    renderClock({ whiteTime: -5_000 });

    expect(timeOf('White')).toBe('00:00');
    expect(barWidth('White')).toBe('0%');
  });

  it('keeps the bar between 0 and 100 percent of the initial time', () => {
    renderClock({ whiteTime: 2 * INITIAL_MS, blackTime: INITIAL_MS / 2 });

    expect(barWidth('White')).toBe('100%');
    expect(barWidth('Black')).toBe('50%');
  });

  it('falls back to the initial time and a full bar for an invalid time', () => {
    renderClock({ blackTime: Number.NaN, initialTimeMs: 3 * 60 * 1000 });

    expect(timeOf('Black')).toBe('03:00');
    expect(barWidth('Black')).toBe('100%');
  });

  it('marks only the side to move as active, and only while the clock runs', () => {
    const { update } = renderClock({ isRunning: true, turn: 'black' });

    expect([hasState('White', 'active'), hasState('Black', 'active')]).toEqual([false, true]);

    update({ isRunning: false, turn: 'black' });

    expect([hasState('White', 'active'), hasState('Black', 'active')]).toEqual([false, false]);
  });
});

describe('GameClock ticking', () => {
  it('does not tick while the clock is not running', () => {
    const { onTick } = renderClock({ isRunning: false });

    advance(5_000);

    expect(onTick).not.toHaveBeenCalled();
  });

  it('calls onTick once a second while running', () => {
    const { onTick } = renderClock({ isRunning: true });

    advance(3_000);

    expect(onTick).toHaveBeenCalledTimes(3);
  });

  it('clears its interval when unmounted', () => {
    const { onTick, unmount } = renderClock({ isRunning: true });
    advance(1_000);

    unmount();
    advance(5_000);

    expect(onTick).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('stops ticking once isRunning turns false', () => {
    const { onTick, update } = renderClock({ isRunning: true });
    advance(1_000);

    update({ isRunning: false });
    advance(5_000);

    expect(onTick).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['White has no time left', { whiteTime: 0 }],
    ['Black has no time left', { blackTime: 0 }],
    ["White's time is invalid", { whiteTime: Number.NaN }],
    ["Black's time is invalid", { blackTime: Number.NaN }]
  ])('does not tick, and shows nobody active, when %s', (_, times) => {
    const { onTick } = renderClock({ isRunning: true, ...times });

    advance(3_000);

    expect(onTick).not.toHaveBeenCalled();
    expect([hasState('White', 'active'), hasState('Black', 'active')]).toEqual([false, false]);
  });

  it('restarts the second when the turn changes', () => {
    const { onTick, update } = renderClock({ isRunning: true, turn: 'white' });
    advance(600);

    update({ isRunning: true, turn: 'black' });
    advance(600);
    expect(onTick).not.toHaveBeenCalled();

    advance(400);
    expect(onTick).toHaveBeenCalledTimes(1);
  });

  it('calls the latest onTick without restarting the second', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { update } = renderClock({ isRunning: true, onTick: first });
    advance(600);

    update({ isRunning: true, onTick: second });
    advance(400);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
