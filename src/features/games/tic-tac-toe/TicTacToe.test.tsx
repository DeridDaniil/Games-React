// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import TicTacToe from './TicTacToe';
import TicTacToeSettings from './ui/Settings/TicTacToeSettings';
import { TicTacToeSettingsProvider } from './model/TicTacToeSettingsProvider';
import { ProfileProvider } from '../../profile/model/ProfileProvider';
import { SAVE_ERROR, loadSession } from '../../profile/lib/profileStorage';
import { storeProfile } from '../../profile/test/profileFixtures';
import { ofType } from '../../../shared/test/dom';

beforeEach(() => {
  localStorage.clear();
  storeProfile();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
});

// Default settings: friend mode on a 3x3 board, X moves first.
const renderGame = ({ withSettings = false } = {}) => {
  const { container, unmount } = render(
    <ProfileProvider>
      <TicTacToeSettingsProvider>
        {withSettings && <TicTacToeSettings />}
        <TicTacToe />
      </TicTacToeSettingsProvider>
    </ProfileProvider>
  );

  const cells = () => [...container.querySelectorAll('.tictactoe .cell')].map(cell => ofType(cell, HTMLButtonElement));
  const play = (...indices: number[]) => indices.forEach(index => fireEvent.click(cells()[index]));
  const marks = () => cells().map(cell => cell.textContent || '.').join('');
  const choose = (option: string) => fireEvent.click(screen.getByRole('button', { name: option }));
  const restart = () => fireEvent.click(screen.getByRole('button', { name: 'Restart' }));

  return { cells, play, marks, choose, restart, unmount };
};

const count = (text: string, mark: string) => [...text].filter(cell => cell === mark).length;

const tictactoeStats = () => loadSession()?.stats.tictactoe;

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

  // The game still ends as usual; the player is told its result is not stored, until the next game.
  it('says so when the result cannot be stored, until a new game starts', () => {
    const { play, restart } = renderGame();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    });

    play(0, 3, 1, 4, 2);

    expect(screen.getByText('Winner — X')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe(SAVE_ERROR);
    expect(tictactoeStats()).toEqual({ wins: 0, losses: 0, draws: 0 });

    restart();

    expect(screen.queryByRole('alert')).toBeNull();
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

describe('TicTacToe board cells', () => {
  const unavailableCells = () => within(screen.getByRole('group', { name: 'Board' }))
    .getAllByRole('button')
    .filter(cell => cell.getAttribute('aria-disabled') === 'true');

  it('are labelled buttons that say whether they can still be played', () => {
    renderGame();
    const corner = screen.getByRole('button', { name: 'Row 1 column 1, empty' });

    expect(corner.getAttribute('type')).toBe('button');
    expect(corner.getAttribute('aria-disabled')).toBeNull();

    fireEvent.click(corner);

    expect(screen.getByRole('button', { name: 'Row 1 column 1, X' }).getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByRole('button', { name: 'Row 3 column 3, empty' }).getAttribute('aria-disabled')).toBeNull();
  });

  it('are all unavailable once the game is over, and the result is shown beside the board', () => {
    const { play } = renderGame();
    // The live region exists before the result, so the result is announced when it appears.
    expect(screen.getByRole('status').textContent).toBe('');

    play(0, 3, 1, 4, 2);

    expect(unavailableCells()).toHaveLength(9);
    expect(screen.getByRole('status').textContent).toBe('Winner — X');
  });

  it('are unavailable while the computer is thinking', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { play } = renderGame({ withSettings: true });
    fireEvent.click(screen.getByRole('button', { name: 'vs Computer' }));

    play(0);
    expect(unavailableCells()).toHaveLength(9);

    act(() => { vi.advanceTimersByTime(400); });
    expect(unavailableCells()).toHaveLength(2);
  });
});

describe('TicTacToe computer moves and restarts', () => {
  const think = () => act(() => { vi.advanceTimersByTime(400); });

  // vs Computer, the computer playing X: it is thinking about its first move straight away.
  const computerFirst = () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const game = renderGame({ withSettings: true });
    game.choose('vs Computer');
    game.choose('O (second)');
    expect(screen.getByRole('heading', { name: 'Computer is thinking...' })).toBeTruthy();
    return game;
  };

  it('lets the computer playing X start again after a restart while it was thinking', () => {
    const game = computerFirst();

    game.restart();
    think();

    expect(count(game.marks(), 'X')).toBe(1);
    expect(screen.getByRole('heading', { name: 'Your Move — O' })).toBeTruthy();
  });

  it('never lets the timer of the old game add a second move', () => {
    const game = computerFirst();
    act(() => { vi.advanceTimersByTime(200); });

    game.restart();
    think();
    think();

    expect(count(game.marks(), 'X')).toBe(1);
    expect(count(game.marks(), 'O')).toBe(0);
  });

  it('keeps exactly one pending computer move after several quick restarts', () => {
    const game = computerFirst();

    game.restart();
    game.restart();
    game.restart();

    expect(vi.getTimerCount()).toBe(1);
    think();
    expect(count(game.marks(), 'X')).toBe(1);
  });

  it('only gives the new game a computer move when the settings change while it thinks', () => {
    const game = computerFirst();

    game.choose('X (first)');
    think();

    expect(game.marks()).toBe('.........');
    expect(screen.getByRole('heading', { name: 'Your Move — X' })).toBeTruthy();

    game.choose('O (second)');
    game.choose('5x5');
    think();

    expect(game.cells()).toHaveLength(25);
    expect(count(game.marks(), 'X')).toBe(1);
  });

  it('leaves no timer behind when the game is closed while the computer thinks', () => {
    const game = computerFirst();

    game.unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('TicTacToe settings', () => {
  it('keeps the game when the option that is already selected is clicked', () => {
    const game = renderGame({ withSettings: true });
    game.play(0, 4);

    game.choose('vs Friend');
    game.choose('3x3');

    expect(game.marks()).toBe('X...O....');
  });

  it('shows Your Side only against the computer and keeps the side chosen there', () => {
    const game = renderGame({ withSettings: true });
    const side = (label: string) => screen.getByRole('button', { name: label }).getAttribute('aria-pressed');

    expect(screen.queryByText('Your Side')).toBeNull();
    expect(screen.queryByRole('button', { name: 'X (first)' })).toBeNull();

    game.choose('vs Computer');
    expect(screen.getByText('Your Side')).toBeTruthy();
    game.choose('O (second)');

    game.choose('vs Friend');
    expect(screen.queryByText('Your Side')).toBeNull();

    game.choose('vs Computer');
    expect(side('O (second)')).toBe('true');
    expect(side('X (first)')).toBe('false');
  });

  it('starts a new game when a different option is chosen', () => {
    const game = renderGame({ withSettings: true });
    game.play(0, 4);

    game.choose('5x5');

    expect(game.cells()).toHaveLength(25);
    expect(count(game.marks(), '.')).toBe(25);
  });

  it('says that only a different option starts a new game', () => {
    renderGame({ withSettings: true });

    expect(screen.getByText('Choosing a different option starts a new game.')).toBeTruthy();
  });
});

describe('TicTacToe keyboard navigation', () => {
  const key = (cell: Element, name: string) => fireEvent.keyDown(cell, { key: name });
  const tabStops = (cells: HTMLButtonElement[]) => cells.filter(cell => cell.tabIndex === 0);

  it('puts a single cell of the board in the tab order', () => {
    const game = renderGame({ withSettings: true });
    expect(tabStops(game.cells())).toEqual([game.cells()[0]]);

    game.choose('7x7');

    expect(game.cells()).toHaveLength(49);
    expect(tabStops(game.cells())).toHaveLength(1);
  });

  it('moves focus between cells with the arrow keys and stops at the edges', () => {
    const game = renderGame();
    const cells = game.cells();
    cells[0].focus();

    key(cells[0], 'ArrowUp');
    key(cells[0], 'ArrowLeft');
    expect(document.activeElement).toBe(cells[0]);

    key(cells[0], 'ArrowRight');
    expect(document.activeElement).toBe(cells[1]);
    key(cells[1], 'ArrowDown');
    expect(document.activeElement).toBe(cells[4]);
    key(cells[4], 'ArrowDown');
    key(cells[7], 'ArrowDown');
    expect(document.activeElement).toBe(cells[7]);
    key(cells[7], 'ArrowRight');
    key(cells[8], 'ArrowRight');
    expect(document.activeElement).toBe(cells[8]);

    expect(tabStops(game.cells())).toEqual([cells[8]]);
  });

  it('keeps focus on the cell that was just played', () => {
    const game = renderGame();
    const cells = game.cells();
    cells[0].focus();
    key(cells[0], 'ArrowRight');
    key(cells[1], 'ArrowDown');

    fireEvent.click(cells[4]);

    expect(game.marks()).toBe('....X....');
    expect(document.activeElement).toBe(cells[4]);
    expect(tabStops(game.cells())).toEqual([cells[4]]);
  });

  it('lets occupied cells be focused but not played again', () => {
    const game = renderGame();
    game.play(0);
    const cells = game.cells();
    // Focusing another cell moves the roving tab stop (a state update), so it happens inside act.
    act(() => { cells[1].focus(); });

    key(cells[1], 'ArrowLeft');
    fireEvent.click(cells[0]);

    expect(document.activeElement).toBe(cells[0]);
    expect(cells[0].getAttribute('aria-disabled')).toBe('true');
    expect(game.marks()).toBe('X........');
  });

  it('leaves arrow keys pressed with a modifier to the browser', () => {
    const game = renderGame();
    const cells = game.cells();
    cells[0].focus();

    fireEvent.keyDown(cells[0], { key: 'ArrowRight', altKey: true });

    expect(document.activeElement).toBe(cells[0]);
  });
});
