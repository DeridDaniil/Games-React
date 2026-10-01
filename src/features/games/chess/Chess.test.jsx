// @vitest-environment jsdom
// Whole-game flows through the real components and reducer, driven the way a browser drives
// HTML5 drag and drop. Assertions are about what the player sees, not about internal actions.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createEvent, fireEvent, render, screen } from '@testing-library/react';
import Chess from './Chess';
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

const renderChess = () => {
  const { container } = render(<ProfileProvider><Chess /></ProfileProvider>);
  const layer = container.querySelector('.figures');
  layer.getBoundingClientRect = () => ({ width: BOARD_PX, height: BOARD_PX, top: 0, left: 0, right: BOARD_PX, bottom: BOARD_PX });

  const pieceElement = (square) => {
    const [y, x] = sq(square);
    return container.querySelector(`.figures .p-${y}${x}`);
  };

  const pieceOn = (square) => {
    const element = pieceElement(square);
    return element ? [...element.classList].find(name => /^(white|black)-/.test(name)) : null;
  };

  const pickUp = (from) => {
    const piece = pieceElement(from);
    if (!piece) throw new Error(`No piece on ${from}`);
    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(piece, { dataTransfer });
    return dataTransfer;
  };

  const dropOn = (dataTransfer, target) => {
    const [y, x] = sq(target);
    expect(fireEvent.dragOver(layer, { dataTransfer })).toBe(false);
    const drop = createEvent.drop(layer, { dataTransfer });
    Object.defineProperty(drop, 'clientX', { value: x * CELL_PX + CELL_PX / 2 });
    Object.defineProperty(drop, 'clientY', { value: (7 - y) * CELL_PX + CELL_PX / 2 });
    fireEvent(layer, drop);
  };

  const move = (from, target) => dropOn(pickUp(from), target);
  const play = (...moves) => moves.forEach(([from, target]) => move(from, target));
  const movesList = () => [...container.querySelector('.game-move-history').children].map(row => row.textContent);
  const choosePromotion = (figure) => fireEvent.click(container.querySelector(`.popup .${figure}`));

  return { container, pieceOn, pickUp, dropOn, move, play, movesList, choosePromotion };
};

// The timer card is the closest ancestor with a colour modifier (game-timer--white / --black).
const clock = (label) => screen.getByText(label).closest('[class*="game-timer--"]').textContent.match(/\d\d:\d\d/)[0];
const advance = (ms) => act(() => { vi.advanceTimersByTime(ms); });
const chessStats = () => loadSession().stats.chess;

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  register('tester', 'Tester', 'secret');
});

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

describe('Chess (whole game)', () => {
  it('plays 1. e4 e5 by dragging pieces and lists the moves', () => {
    const game = renderChess();

    game.move('e2', 'e4');
    game.move('e7', 'e5');

    expect(game.pieceOn('e4')).toBe('white-pawn');
    expect(game.pieceOn('e2')).toBeNull();
    expect(game.pieceOn('e5')).toBe('black-pawn');
    expect(game.movesList()).toEqual(['e4', 'e5']);
  });

  it('ignores a piece of the side that is not to move', () => {
    const game = renderChess();

    game.move('e7', 'e5');

    expect(game.pieceOn('e7')).toBe('black-pawn');
    expect(game.pieceOn('e5')).toBeNull();
    expect(game.movesList()).toEqual([]);
  });

  it('does not let a pawn jump over a piece standing in front of it', () => {
    const game = renderChess();
    game.play(['g1', 'f3'], ['e7', 'e5'], ['f3', 'g5'], ['d8', 'g5']);
    game.play(['d2', 'd3'], ['g5', 'e3']);

    game.move('e2', 'e4');

    expect(game.pieceOn('e2')).toBe('white-pawn');
    expect(game.pieceOn('e4')).toBeNull();
  });

  it('captures en passant and removes the passed pawn', () => {
    const game = renderChess();

    game.play(['e2', 'e4'], ['a7', 'a6'], ['e4', 'e5'], ['d7', 'd5'], ['e5', 'd6']);

    expect(game.pieceOn('d6')).toBe('white-pawn');
    expect(game.pieceOn('d5')).toBeNull();
    expect(game.movesList().at(-1)).toBe('exd6');
  });

  it('castles kingside, moving the king and the rook together', () => {
    const game = renderChess();

    game.play(['e2', 'e4'], ['e7', 'e5'], ['g1', 'f3'], ['b8', 'c6'], ['f1', 'c4'], ['f8', 'c5'], ['e1', 'g1']);

    expect(game.pieceOn('g1')).toBe('white-king');
    expect(game.pieceOn('f1')).toBe('white-rook');
    expect(game.pieceOn('h1')).toBeNull();
    expect(game.pieceOn('e1')).toBeNull();
  });

  it("ends the game after fool's mate, highlights the check and records the loss", () => {
    const game = renderChess();

    game.play(['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4'], ['d8', 'h4']);

    expect(screen.getByRole('heading', { name: 'Black wins' })).toBeTruthy();
    expect(game.container.querySelectorAll('.cell.checked')).toHaveLength(1);
    expect(chessStats()).toEqual({ wins: 0, losses: 1, draws: 0 });
  });

  it('promotes pawns of both colours through the promotion choice', () => {
    const game = renderChess();
    game.play(['a2', 'a4'], ['h7', 'h5'], ['a4', 'a5'], ['h5', 'h4'], ['a5', 'a6'], ['h4', 'h3'], ['a6', 'b7'], ['h3', 'g2']);

    game.move('b7', 'a8');
    expect(game.pieceOn('a8')).toBe('black-rook');
    game.choosePromotion('white-queen');

    game.move('g2', 'h1');
    game.choosePromotion('black-knight');

    expect(game.pieceOn('a8')).toBe('white-queen');
    expect(game.pieceOn('b7')).toBeNull();
    expect(game.pieceOn('h1')).toBe('black-knight');
    expect(game.pieceOn('g2')).toBeNull();
    // Promotion suffixes are a known notation quirk (see PromotionBox tests).
    expect(game.movesList().slice(-2)).toEqual(['bxa8=WQ', 'gxh1=BKN']);
  });

  it('starts the clock when White picks up a piece and runs only the clock of the side to move', () => {
    const game = renderChess();

    advance(3000);
    expect([clock('White'), clock('Black')]).toEqual(['05:00', '05:00']);

    const dataTransfer = game.pickUp('e2');
    advance(2000);
    expect([clock('White'), clock('Black')]).toEqual(['04:58', '05:00']);

    game.dropOn(dataTransfer, 'e4');
    advance(3000);
    expect([clock('White'), clock('Black')]).toEqual(['04:58', '04:57']);
  });

  it('awards the game to Black when White runs out of time', () => {
    const game = renderChess();
    game.pickUp('e2');

    advance(5 * 60 * 1000);

    expect(screen.getByRole('heading', { name: 'Black wins on time' })).toBeTruthy();
    expect(clock('White')).toBe('00:00');
    expect(chessStats()).toEqual({ wins: 0, losses: 1, draws: 0 });
  });

  it('surrender starts a new game without recording a result (current behaviour)', () => {
    const game = renderChess();
    game.move('e2', 'e4');

    fireEvent.click(screen.getByText('Surrender'));
    const confirm = screen.getByRole('button', { name: 'Surrender' });
    expect(confirm.disabled).toBe(true);
    advance(2000);
    fireEvent.click(confirm);
    advance(250);

    expect(game.pieceOn('e2')).toBe('white-pawn');
    expect(game.pieceOn('e4')).toBeNull();
    expect(game.movesList()).toEqual([]);
    expect(chessStats()).toEqual({ wins: 0, losses: 0, draws: 0 });
  });

  it('opens the surrender dialog right after its tile, inside the actions row', () => {
    renderChess();

    fireEvent.click(screen.getByText('Surrender'));

    const tile = screen.getByText('Surrender', { selector: '.game-action span' }).parentElement;
    expect(tile.parentElement.classList.contains('game-control-panel__actions')).toBe(true);
    expect(tile.nextElementSibling.classList.contains('game-surrender-dialog')).toBe(true);
  });

  it('keeps the game when the surrender is cancelled', () => {
    const game = renderChess();
    game.move('e2', 'e4');

    fireEvent.click(screen.getByText('Surrender'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    advance(250);

    expect(screen.queryByRole('heading', { name: 'Confirm Surrender' })).toBeNull();
    expect(game.pieceOn('e4')).toBe('white-pawn');
    expect(game.movesList()).toEqual(['e4']);
  });

  it('takes back the last move from the Take Back tile', () => {
    const game = renderChess();
    game.play(['e2', 'e4'], ['e7', 'e5']);

    fireEvent.click(screen.getByText('Take Back'));

    expect(game.pieceOn('e5')).toBeNull();
    expect(game.pieceOn('e7')).toBe('black-pawn');
    expect(game.pieceOn('e4')).toBe('white-pawn');
    expect(game.movesList()).toEqual(['e4']);
  });
});
