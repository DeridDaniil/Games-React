// @vitest-environment jsdom
// Whole-game flows through the real components and reducer, driven the way a browser drives
// HTML5 drag and drop. Assertions are about what the player sees, not about internal actions.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createEvent, fireEvent, render, screen, within } from '@testing-library/react';
import Checkers from './Checkers';
import { ProfileProvider } from '../../profile/model/ProfileProvider';
import { loadSession, register } from '../../profile/lib/profileStorage';
import { boardRect, boardWith, sq } from '../shared/test/boardTestUtils';
import { getElement, ofType } from '../../../shared/test/dom';
import type { CheckerPiece, CheckersState } from './model/types';
import type { PlayerColor } from '../shared/model/types';

// Lets a test start the game from a chosen position; null keeps the real initial state.
const start = vi.hoisted((): { state: CheckersState | null } => ({ state: null }));
vi.mock(import('./model/constant'), async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, get initCheckersGame() { return start.state ?? actual.initCheckersGame; } };
});
const { initCheckersGame } = await vi.importActual<typeof import('./model/constant')>('./model/constant');

const startFrom = (pieces: Record<string, CheckerPiece>, turn: PlayerColor = 'white') => {
  start.state = { ...initCheckersGame, position: [boardWith(pieces)], turn };
};

const BOARD_PX = 800;
const CELL_PX = BOARD_PX / 8;

const createDataTransfer = () => {
  const data: Record<string, string> = {};
  const key = (type: string) => (type === 'text' ? 'text/plain' : type);
  return {
    effectAllowed: 'all',
    dropEffect: 'none',
    setData: (type: string, value: string) => { data[key(type)] = value; },
    getData: (type: string) => data[key(type)] ?? ''
  };
};

const renderCheckers = () => {
  const { container } = render(<ProfileProvider><Checkers /></ProfileProvider>);
  const layer = getElement(container, '.checker-figures');
  layer.getBoundingClientRect = () => boardRect(BOARD_PX);

  const pieceElement = (square: string) => {
    const [y, x] = sq(square);
    return container.querySelector(`.checker-figures .p-${y}${x}`);
  };

  const pieceOn = (square: string) => {
    const element = pieceElement(square);
    return element ? [...element.classList].find(name => /^(white|black)-/.test(name)) : null;
  };

  const squareName = (element: Element) => {
    const match = element.className.match(/\bp-(\d)(\d)\b/);
    if (!match) throw new Error(`Not a piece: "${element.className}"`);
    const [, y, x] = match;
    return 'abcdefgh'[Number(x)] + (Number(y) + 1);
  };

  // Squares of the given colour's checkers that can currently be picked up.
  const draggable = (colour: PlayerColor) => [...container.querySelectorAll(`.checker-figures .${colour}-checker, .checker-figures .${colour}-queen`)]
    .filter(element => element.getAttribute('draggable') === 'true')
    .map(squareName)
    .sort();

  // Returns the dataTransfer, or null when the checker refused to be picked up.
  const pickUp = (from: string) => {
    const piece = pieceElement(from);
    if (!piece) throw new Error(`No checker on ${from}`);
    const dataTransfer = createDataTransfer();
    return fireEvent.dragStart(piece, { dataTransfer }) ? dataTransfer : null;
  };

  const dropOn = (dataTransfer: ReturnType<typeof createDataTransfer>, target: string) => {
    const [y, x] = sq(target);
    expect(fireEvent.dragOver(layer, { dataTransfer })).toBe(false);
    const drop = createEvent.drop(layer, { dataTransfer });
    Object.defineProperty(drop, 'clientX', { value: x * CELL_PX + CELL_PX / 2 });
    Object.defineProperty(drop, 'clientY', { value: (7 - y) * CELL_PX + CELL_PX / 2 });
    fireEvent(layer, drop);
  };

  const move = (from: string, target: string) => {
    const dataTransfer = pickUp(from);
    if (!dataTransfer) throw new Error(`The checker on ${from} cannot be picked up`);
    dropOn(dataTransfer, target);
  };
  const play = (...moves: [string, string][]) => moves.forEach(([from, target]) => move(from, target));
  const movesList = () => [...container.querySelectorAll('.game-move-history__move')].map(move => move.textContent);
  // Each numbered row of the moves panel as "<number> <white move> <black move>".
  const historyRows = () => [...container.querySelectorAll('.game-move-history__row')]
    .map(row => [...row.children].map(cell => cell.textContent).join(' '));

  return { pieceOn, draggable, pickUp, dropOn, move, play, movesList, historyRows };
};

// The timer card is the closest ancestor with a colour modifier (game-timer--white / --black).
const clock = (label: string) =>
  ofType(screen.getByText(label).closest('[class*="game-timer--"]'), HTMLElement).textContent?.match(/\d\d:\d\d/)?.[0];
const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });
const checkersStats = () => loadSession()?.stats.checkers;

const surrender = () => {
  fireEvent.click(screen.getByText('Surrender'));
  advance(2000);
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Surrender' }));
  advance(250);
};

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  register('tester', 'Tester', 'secret');
});

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
  start.state = null;
});

describe('Checkers (whole game)', () => {
  it('plays c3-d4 by dragging a checker and lists the move', () => {
    const game = renderCheckers();

    game.move('c3', 'd4');

    expect(game.pieceOn('d4')).toBe('white-checker');
    expect(game.pieceOn('c3')).toBeNull();
    expect(game.movesList()).toEqual(['c3-d4']);
  });

  it('refuses to pick up a checker of the side that is not to move', () => {
    const game = renderCheckers();

    expect(game.draggable('black')).toEqual([]);
    expect(game.pickUp('f6')).toBeNull();
    // Without a forced capture every checker of the side to move can be picked up, even a blocked one.
    expect(game.draggable('white')).toHaveLength(12);
  });

  it('forces the capture and lets the same checker continue a chain capture', () => {
    const game = renderCheckers();
    game.play(['a3', 'b4'], ['b6', 'a5'], ['c3', 'd4']);

    // a5 must capture b4; every other black checker is blocked.
    expect(game.draggable('black')).toEqual(['a5']);
    expect(game.pickUp('h6')).toBeNull();

    game.move('a5', 'c3');
    expect(game.pieceOn('b4')).toBeNull();
    expect(game.pieceOn('c3')).toBe('black-checker');
    // The chain is not over: only the capturing checker may move, and it is still Black's turn.
    expect(game.draggable('black')).toEqual(['c3']);
    expect(game.draggable('white')).toEqual([]);
    // An unfinished chain is not a move yet.
    expect(game.movesList()).toEqual(['a3-b4', 'b6-a5', 'c3-d4']);

    game.move('c3', 'e5');
    expect(game.pieceOn('d4')).toBeNull();
    expect(game.pieceOn('e5')).toBe('black-checker');
    expect(game.draggable('black')).toEqual([]);
    expect(game.movesList()).toEqual(['a3-b4', 'b6-a5', 'c3-d4', 'a5xc3xe5']);
    // One numbered row per pair of turns, however many jumps a turn had.
    expect(game.historyRows()).toEqual(['1 a3-b4 b6-a5', '2 c3-d4 a5xc3xe5']);
  });

  it('takes back a whole chain capture in one go and gives the turn back to its player', () => {
    const game = renderCheckers();
    game.play(['a3', 'b4'], ['b6', 'a5'], ['c3', 'd4'], ['a5', 'c3'], ['c3', 'e5']);

    fireEvent.click(screen.getByText('Take Back'));

    expect(game.pieceOn('a5')).toBe('black-checker');
    expect(game.pieceOn('b4')).toBe('white-checker');
    expect(game.pieceOn('d4')).toBe('white-checker');
    expect(game.pieceOn('c3')).toBeNull();
    expect(game.pieceOn('e5')).toBeNull();
    expect(game.movesList()).toEqual(['a3-b4', 'b6-a5', 'c3-d4']);
    expect(game.draggable('black')).toEqual(['a5']);
    expect(game.draggable('white')).toEqual([]);
  });

  it('takes back an unfinished chain to the start of the turn, clock included', () => {
    const game = renderCheckers();
    game.play(['a3', 'b4'], ['b6', 'a5'], ['c3', 'd4']);
    advance(4000);
    game.move('a5', 'c3');
    advance(3000);
    expect(clock('Black')).toBe('04:53');

    fireEvent.click(screen.getByText('Take Back'));

    expect(game.pieceOn('a5')).toBe('black-checker');
    expect(game.pieceOn('b4')).toBe('white-checker');
    expect(game.pieceOn('c3')).toBeNull();
    expect(game.movesList()).toEqual(['a3-b4', 'b6-a5', 'c3-d4']);
    expect(game.draggable('black')).toEqual(['a5']);
    expect(clock('Black')).toBe('05:00');
  });

  it('starts the clock after the first completed move', () => {
    const game = renderCheckers();

    const dataTransfer = game.pickUp('c3');
    if (!dataTransfer) throw new Error('The checker on c3 cannot be picked up');
    advance(2000);
    expect([clock('White'), clock('Black')]).toEqual(['05:00', '05:00']);

    game.dropOn(dataTransfer, 'd4');
    advance(3000);
    expect([clock('White'), clock('Black')]).toEqual(['05:00', '04:57']);
  });

  it('awards the game to White when Black runs out of time and records it as a win', () => {
    const game = renderCheckers();
    game.move('c3', 'd4');

    advance(5 * 60 * 1000);

    expect(screen.getByRole('heading', { name: 'White wins on time' })).toBeTruthy();
    expect(checkersStats()).toEqual({ wins: 1, losses: 0, draws: 0 });
  });

  it('resumes a finished game on Take Back and still records that game only once', () => {
    const game = renderCheckers();
    game.move('c3', 'd4');
    advance(5 * 60 * 1000);
    expect(checkersStats()).toEqual({ wins: 1, losses: 0, draws: 0 });

    fireEvent.click(screen.getByText('Take Back'));

    expect(screen.queryByRole('heading', { name: 'White wins on time' })).toBeNull();
    expect(game.pieceOn('c3')).toBe('white-checker');
    expect(game.draggable('white')).toContain('c3');

    game.move('c3', 'd4');
    advance(5 * 60 * 1000);

    expect(screen.getByRole('heading', { name: 'White wins on time' })).toBeTruthy();
    expect(checkersStats()).toEqual({ wins: 1, losses: 0, draws: 0 });
  });

  it('ends the game against the side to move on surrender and records it only once', () => {
    const game = renderCheckers();
    game.move('c3', 'd4');

    surrender();
    expect(screen.getByRole('heading', { name: 'Black surrendered' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Black surrendered');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'New Game' }));
    expect(checkersStats()).toEqual({ wins: 1, losses: 0, draws: 0 });

    // The Surrender button stays clickable next to the game-over overlay.
    surrender();
    expect(screen.getByRole('heading', { name: 'Black surrendered' })).toBeTruthy();
    expect(checkersStats()).toEqual({ wins: 1, losses: 0, draws: 0 });
  });

  it('asks for the surrender in a modal dialog with the checkers message', () => {
    renderCheckers();

    fireEvent.click(screen.getByText('Surrender'));

    const dialog = screen.getByRole('dialog', { name: 'Confirm Surrender' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(within(dialog).getByText('Are you sure you want to surrender? This will end the current game.')).toBeTruthy();
  });

  it('takes back the last move from the Take Back tile', () => {
    const game = renderCheckers();
    game.play(['c3', 'd4'], ['b6', 'a5']);

    fireEvent.click(screen.getByText('Take Back'));

    expect(game.pieceOn('a5')).toBeNull();
    expect(game.pieceOn('b6')).toBe('black-checker');
    expect(game.pieceOn('d4')).toBe('white-checker');
    expect(game.movesList()).toEqual(['c3-d4']);
  });
});

describe('Checkers chain captures from chosen positions', () => {
  it('lists a triple capture as one move and takes it back in one go', () => {
    startFrom({ a3: 'white-checker', b4: 'black-checker', d6: 'black-checker', f6: 'black-checker', h8: 'black-checker' });
    const game = renderCheckers();

    game.play(['a3', 'c5'], ['c5', 'e7'], ['e7', 'g5']);

    expect(game.movesList()).toEqual(['a3xc5xe7xg5']);
    expect(['b4', 'd6', 'f6'].map(game.pieceOn)).toEqual([null, null, null]);
    expect(game.pieceOn('g5')).toBe('white-checker');
    expect(game.draggable('black')).toEqual(['h8']);

    fireEvent.click(screen.getByText('Take Back'));

    expect(game.movesList()).toEqual([]);
    expect(game.pieceOn('a3')).toBe('white-checker');
    expect(['b4', 'd6', 'f6'].map(game.pieceOn)).toEqual(['black-checker', 'black-checker', 'black-checker']);
    expect(game.pieceOn('g5')).toBeNull();
    expect(game.draggable('white')).toEqual(['a3']);
  });

  it('promotes in the middle of a chain, lists it as one move and undoes the promotion with it', () => {
    startFrom({ c6: 'white-checker', d7: 'black-checker', f7: 'black-checker', h2: 'black-checker' });
    const game = renderCheckers();

    game.play(['c6', 'e8'], ['e8', 'g6']);

    expect(game.pieceOn('g6')).toBe('white-queen');
    expect(game.movesList()).toEqual(['c6xe8xg6']);

    fireEvent.click(screen.getByText('Take Back'));

    expect(game.pieceOn('c6')).toBe('white-checker');
    expect(game.pieceOn('d7')).toBe('black-checker');
    expect(game.pieceOn('f7')).toBe('black-checker');
    expect(game.pieceOn('e8')).toBeNull();
    expect(game.pieceOn('g6')).toBeNull();
    expect(game.movesList()).toEqual([]);
  });
});
