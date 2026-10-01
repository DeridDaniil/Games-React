// @vitest-environment jsdom
// Whole-game flows through the real components and reducer, driven the way a browser drives
// HTML5 drag and drop. Assertions are about what the player sees, not about internal actions.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createEvent, fireEvent, render, screen } from '@testing-library/react';
import Checkers from './Checkers';
import { ProfileProvider } from '../../profile/model/ProfileContext';
import { loadSession, register } from '../../profile/lib/profileStorage';
import { sq } from '../shared/test/boardTestUtils';

const BOARD_PX = 800;
const CELL_PX = BOARD_PX / 8;

const createDataTransfer = () => {
  const data = {};
  const key = (type) => (type === 'text' ? 'text/plain' : type);
  return {
    effectAllowed: 'all',
    dropEffect: 'none',
    setData: (type, value) => { data[key(type)] = value; },
    getData: (type) => data[key(type)] ?? ''
  };
};

const renderCheckers = () => {
  const { container } = render(<ProfileProvider><Checkers /></ProfileProvider>);
  const layer = container.querySelector('.checker-figures');
  layer.getBoundingClientRect = () => ({ width: BOARD_PX, height: BOARD_PX, top: 0, left: 0, right: BOARD_PX, bottom: BOARD_PX });

  const pieceElement = (square) => {
    const [y, x] = sq(square);
    return container.querySelector(`.checker-figures .p-${y}${x}`);
  };

  const pieceOn = (square) => {
    const element = pieceElement(square);
    return element ? [...element.classList].find(name => /^(white|black)-/.test(name)) : null;
  };

  const squareName = (element) => {
    const [, y, x] = element.className.match(/\bp-(\d)(\d)\b/);
    return 'abcdefgh'[Number(x)] + (Number(y) + 1);
  };

  // Squares of the given colour's checkers that can currently be picked up.
  const draggable = (colour) => [...container.querySelectorAll(`.checker-figures .${colour}-checker, .checker-figures .${colour}-queen`)]
    .filter(element => element.getAttribute('draggable') === 'true')
    .map(squareName)
    .sort();

  // Returns the dataTransfer, or null when the checker refused to be picked up.
  const pickUp = (from) => {
    const piece = pieceElement(from);
    if (!piece) throw new Error(`No checker on ${from}`);
    const dataTransfer = createDataTransfer();
    return fireEvent.dragStart(piece, { dataTransfer }) ? dataTransfer : null;
  };

  const dropOn = (dataTransfer, target) => {
    const [y, x] = sq(target);
    expect(fireEvent.dragOver(layer, { dataTransfer })).toBe(false);
    const drop = createEvent.drop(layer, { dataTransfer });
    Object.defineProperty(drop, 'clientX', { value: x * CELL_PX + CELL_PX / 2 });
    Object.defineProperty(drop, 'clientY', { value: (7 - y) * CELL_PX + CELL_PX / 2 });
    fireEvent(layer, drop);
  };

  const move = (from, target) => {
    const dataTransfer = pickUp(from);
    if (!dataTransfer) throw new Error(`The checker on ${from} cannot be picked up`);
    dropOn(dataTransfer, target);
  };
  const play = (...moves) => moves.forEach(([from, target]) => move(from, target));
  const movesList = () => [...container.querySelector('.game-move-history').children].map(row => row.textContent);

  return { pieceOn, draggable, pickUp, dropOn, move, play, movesList };
};

// The timer card is the closest ancestor with a colour modifier (game-timer--white / --black).
const clock = (label) => screen.getByText(label).closest('[class*="game-timer--"]').textContent.match(/\d\d:\d\d/)[0];
const advance = (ms) => act(() => { vi.advanceTimersByTime(ms); });
const checkersStats = () => loadSession().stats.checkers;

const surrender = () => {
  fireEvent.click(screen.getByText('Surrender'));
  advance(2000);
  fireEvent.click(screen.getByRole('button', { name: 'Surrender' }));
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

    game.move('c3', 'e5');
    expect(game.pieceOn('d4')).toBeNull();
    expect(game.pieceOn('e5')).toBe('black-checker');
    expect(game.draggable('black')).toEqual([]);
    expect(game.movesList().slice(-2)).toEqual(['a5xc3', 'c3xe5']);
  });

  it('starts the clock after the first completed move', () => {
    const game = renderCheckers();

    const dataTransfer = game.pickUp('c3');
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

  it('ends the game against the side to move on surrender and records it only once', () => {
    const game = renderCheckers();
    game.move('c3', 'd4');

    surrender();
    expect(screen.getByRole('heading', { name: 'Black surrendered' })).toBeTruthy();
    expect(checkersStats()).toEqual({ wins: 1, losses: 0, draws: 0 });

    // The Surrender button stays clickable next to the game-over overlay.
    surrender();
    expect(screen.getByRole('heading', { name: 'Black surrendered' })).toBeTruthy();
    expect(checkersStats()).toEqual({ wins: 1, losses: 0, draws: 0 });
  });

  it('opens the surrender dialog right after its tile, inside the actions row', () => {
    renderCheckers();

    fireEvent.click(screen.getByText('Surrender'));

    const tile = screen.getByText('Surrender', { selector: '.game-action span' }).parentElement;
    expect(tile.parentElement.classList.contains('game-control-panel__actions')).toBe(true);
    expect(tile.nextElementSibling.classList.contains('game-surrender-dialog')).toBe(true);
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
