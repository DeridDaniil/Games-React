// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import TicTacToe from './TicTacToe';
import TicTacToeSettings from './ui/Settings/TicTacToeSettings';
import { TicTacToeSettingsProvider } from './model/TicTacToeSettingsContext';
import { ProfileProvider } from '../../profile/model/ProfileContext';
import { loadSession, register } from '../../profile/lib/profileStorage';

beforeEach(() => {
  localStorage.clear();
  register('tester', 'Tester', 'secret');
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
});

// Default settings: friend mode on a 3x3 board, X moves first.
const renderGame = ({ withSettings = false } = {}) => {
  const { container } = render(
    <ProfileProvider>
      <TicTacToeSettingsProvider>
        {withSettings && <TicTacToeSettings />}
        <TicTacToe />
      </TicTacToeSettingsProvider>
    </ProfileProvider>
  );

  const cells = () => [...container.querySelectorAll('.tictactoe .cell')];
  const play = (...indices) => indices.forEach(index => fireEvent.click(cells()[index]));
  const marks = () => cells().map(cell => cell.textContent || '.').join('');

  return { play, marks };
};

const tictactoeStats = () => loadSession().stats.tictactoe;

describe('TicTacToe (friend mode)', () => {
  it('alternates X and O and keeps the game going while nobody has won', () => {
    const { play, marks } = renderGame();

    play(0, 4);

    expect(marks()).toBe('X...O....');
    expect(screen.getByRole('heading', { name: "Player's Move — X" })).toBeTruthy();
  });

  it('ignores clicks on occupied cells', () => {
    const { play, marks } = renderGame();

    play(0, 0);

    expect(marks()).toBe('X........');
    expect(screen.getByRole('heading', { name: "Player's Move — O" })).toBeTruthy();
  });

  it('announces the winner, stops the game and records the result', () => {
    const { play, marks } = renderGame();

    play(0, 3, 1, 4, 2);

    expect(screen.getByText('Winner — X')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Game Over' })).toBeTruthy();

    play(8);
    expect(marks()).toBe('XXXOO....');
    expect(tictactoeStats()).toEqual({ wins: 1, losses: 0, draws: 0 });
  });

  it('announces a draw when the board fills up without a line', () => {
    const { play } = renderGame();

    play(0, 1, 2, 4, 3, 5, 7, 6, 8);

    expect(screen.getByText('Draw')).toBeTruthy();
    expect(tictactoeStats()).toEqual({ wins: 0, losses: 0, draws: 1 });
  });

  it('counts a line completed on the last free cell as a win, not a draw', () => {
    const { play } = renderGame();

    play(0, 1, 2, 3, 4, 5, 7, 6, 8);

    expect(screen.getByText('Winner — X')).toBeTruthy();
    expect(screen.queryByText('Draw')).toBeNull();
    expect(tictactoeStats()).toEqual({ wins: 1, losses: 0, draws: 0 });
  });

  // Friend mode keeps the profile stats from X's point of view.
  it('records an O win as a loss in friend mode (current behaviour)', () => {
    const { play } = renderGame();

    play(0, 3, 1, 4, 8, 5);

    expect(screen.getByText('Winner — O')).toBeTruthy();
    expect(tictactoeStats()).toEqual({ wins: 0, losses: 1, draws: 0 });
  });

  it('starts a fresh game on restart', () => {
    const { play, marks } = renderGame();
    play(0, 3, 1, 4, 2);

    fireEvent.click(screen.getByRole('button', { name: 'Restart' }));

    expect(marks()).toBe('.........');
    expect(screen.queryByText('Winner — X')).toBeNull();
  });
});

describe('TicTacToe (vs computer)', () => {
  it('lets the computer answer after a short delay and block an open line', () => {
    vi.useFakeTimers();
    // Medium AI plays the first free cell when there is nothing to win or block.
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { play, marks } = renderGame({ withSettings: true });
    fireEvent.click(screen.getByRole('button', { name: 'vs Computer' }));

    play(0);
    expect(screen.getByRole('heading', { name: 'Computer is thinking...' })).toBeTruthy();
    expect(marks()).toBe('X........');

    act(() => { vi.advanceTimersByTime(400); });
    expect(marks()).toBe('XO.......');

    play(3);
    act(() => { vi.advanceTimersByTime(400); });
    expect(marks()).toBe('XO.X..O..');
    expect(screen.getByRole('heading', { name: 'Your Move — X' })).toBeTruthy();
  });
});
