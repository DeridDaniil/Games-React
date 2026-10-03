// @vitest-environment jsdom
// Whole-game flows through the real components and reducer, driven the way a browser drives
// HTML5 drag and drop. Assertions are about what the player sees, not about internal actions.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createEvent, fireEvent, render, screen, within } from '@testing-library/react';
import Chess from './Chess';
import { ProfileProvider } from '../../profile/model/ProfileProvider';
import { loadSession } from '../../profile/lib/profileStorage';
import { storeProfile } from '../../profile/test/profileFixtures';
import { boardRect, boardWith, sq } from '../shared/test/boardTestUtils';
import { getElement, ofType } from '../../../shared/test/dom';
import type { ChessPiece, ChessState } from './model/types';
import type { PlayerColor } from '../shared/model/types';

// Lets a test start the game from a chosen position; null keeps the real initial state.
const start = vi.hoisted((): { state: ChessState | null } => ({ state: null }));
vi.mock(import('./model/constant'), async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, get initChessGame() { return start.state ?? actual.initChessGame; } };
});
const { initChessGame } = await vi.importActual<typeof import('./model/constant')>('./model/constant');

const startFrom = (pieces: Record<string, ChessPiece>, turn: PlayerColor = 'white') => {
  start.state = { ...initChessGame, position: [boardWith(pieces)], turn, castleDirection: { white: 'none', black: 'none' } };
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

const renderChess = () => {
  const { container } = render(<ProfileProvider><Chess /></ProfileProvider>);
  const layer = getElement(container, '.figures');
  layer.getBoundingClientRect = () => boardRect(BOARD_PX);

  const pieceElement = (square: string) => {
    const [y, x] = sq(square);
    return container.querySelector(`.figures .p-${y}${x}`);
  };

  const pieceOn = (square: string) => {
    const element = pieceElement(square);
    return element ? [...element.classList].find(name => /^(white|black)-/.test(name)) : null;
  };

  const pickUp = (from: string) => {
    const piece = pieceElement(from);
    if (!piece) throw new Error(`No piece on ${from}`);
    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(piece, { dataTransfer });
    return dataTransfer;
  };

  const dropOn = (dataTransfer: ReturnType<typeof createDataTransfer>, target: string) => {
    const [y, x] = sq(target);
    expect(fireEvent.dragOver(layer, { dataTransfer })).toBe(false);
    const drop = createEvent.drop(layer, { dataTransfer });
    Object.defineProperty(drop, 'clientX', { value: x * CELL_PX + CELL_PX / 2 });
    Object.defineProperty(drop, 'clientY', { value: (7 - y) * CELL_PX + CELL_PX / 2 });
    fireEvent(layer, drop);
  };

  const move = (from: string, target: string) => dropOn(pickUp(from), target);
  const play = (...moves: [string, string][]) => moves.forEach(([from, target]) => move(from, target));
  const movesList = () => [...container.querySelectorAll('.game-move-history__move')].map(move => move.textContent);
  const choosePromotion = (figure: ChessPiece) => fireEvent.click(getElement(container, `.popup .${figure}`));

  // A tap (or click) in the middle of a square, landing on the piece there if there is one.
  const tap = (square: string) => {
    const [y, x] = sq(square);
    const target = pieceElement(square) ?? layer;
    const click = createEvent.click(target);
    Object.defineProperty(click, 'clientX', { value: x * CELL_PX + CELL_PX / 2 });
    Object.defineProperty(click, 'clientY', { value: (7 - y) * CELL_PX + CELL_PX / 2 });
    fireEvent(target, click);
  };

  // The board squares are listed from a8 to h1.
  const cellOn = (square: string) => {
    const [y, x] = sq(square);
    return ofType(container.querySelectorAll('.chessBoard .cell')[(7 - y) * 8 + x], HTMLElement);
  };
  const highlightedCount = () => container.querySelectorAll('.cell.highlight, .cell.attacking').length;
  const selectedCount = () => container.querySelectorAll('.cell.selected').length;

  return { container, pieceElement, pieceOn, pickUp, dropOn, move, play, movesList, choosePromotion, tap, cellOn, highlightedCount, selectedCount };
};

// The timer card is the closest ancestor with a colour modifier (game-timer--white / --black).
const clock = (label: string) =>
  ofType(screen.getByText(label).closest('[class*="game-timer--"]'), HTMLElement).textContent?.match(/\d\d:\d\d/)?.[0];
const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });
const chessStats = () => loadSession()?.stats.chess;

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  storeProfile();
});

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
  start.state = null;
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

  it('writes 1. e4 e5 2. Nf3 with N for the knight', () => {
    const game = renderChess();

    game.play(['e2', 'e4'], ['e7', 'e5'], ['g1', 'f3']);

    expect(game.movesList()).toEqual(['e4', 'e5', 'Nf3']);
  });

  it('castles kingside, moving the king and the rook together', () => {
    const game = renderChess();

    game.play(['e2', 'e4'], ['e7', 'e5'], ['g1', 'f3'], ['b8', 'c6'], ['f1', 'c4'], ['f8', 'c5'], ['e1', 'g1']);

    expect(game.pieceOn('g1')).toBe('white-king');
    expect(game.pieceOn('f1')).toBe('white-rook');
    expect(game.pieceOn('h1')).toBeNull();
    expect(game.pieceOn('e1')).toBeNull();
    expect(game.movesList().at(-1)).toBe('0-0');
  });

  const queensideReady: [string, string][] = [['d2', 'd4'], ['d7', 'd5'], ['b1', 'c3'], ['b8', 'c6'], ['c1', 'f4'], ['c8', 'f5'], ['d1', 'd2'], ['d8', 'd7']];

  it('castles queenside and writes it as 0-0-0', () => {
    const game = renderChess();

    game.play(...queensideReady, ['e1', 'c1']);

    expect(game.pieceOn('c1')).toBe('white-king');
    expect(game.pieceOn('d1')).toBe('white-rook');
    expect(game.pieceOn('a1')).toBeNull();
    expect(game.movesList().at(-1)).toBe('0-0-0');
  });

  it('gives queenside castling back when the rook move that lost it is taken back', () => {
    const game = renderChess();
    game.play(...queensideReady, ['a1', 'b1']);

    fireEvent.click(screen.getByText('Take Back'));
    game.move('e1', 'c1');

    expect(game.pieceOn('c1')).toBe('white-king');
    expect(game.pieceOn('d1')).toBe('white-rook');
  });

  it('does not let a rook that went back to its corner castle again', () => {
    const game = renderChess();
    game.play(...queensideReady, ['a1', 'b1'], ['a7', 'a6'], ['b1', 'a1'], ['a6', 'a5']);

    game.move('e1', 'c1');

    expect(game.pieceOn('e1')).toBe('white-king');
    expect(game.pieceOn('c1')).toBeNull();
  });

  it('gives both castling sides back when a king move is taken back', () => {
    const game = renderChess();
    game.play(['e2', 'e4'], ['e7', 'e5'], ['g1', 'f3'], ['b8', 'c6'], ['f1', 'c4'], ['f8', 'c5'], ['e1', 'e2']);

    fireEvent.click(screen.getByText('Take Back'));
    game.move('e1', 'g1');

    expect(game.pieceOn('g1')).toBe('white-king');
    expect(game.pieceOn('f1')).toBe('white-rook');
  });

  it("ends the game after fool's mate, highlights the check and records the loss", () => {
    const game = renderChess();

    game.play(['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4'], ['d8', 'h4']);

    expect(screen.getByRole('heading', { name: 'Black wins' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Black wins');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'New Game' }));
    expect(game.container.querySelectorAll('.cell.checked')).toHaveLength(1);
    expect(chessStats()).toEqual({ wins: 0, losses: 1, draws: 0 });
  });

  it('resumes a finished game on Take Back and still records that game only once', () => {
    const game = renderChess();
    game.play(['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4'], ['d8', 'h4']);
    expect(chessStats()).toEqual({ wins: 0, losses: 1, draws: 0 });

    fireEvent.click(screen.getByText('Take Back'));
    expect(document.querySelector('.game_ends')).toBeNull();

    game.move('d8', 'h4');

    expect(screen.getByRole('heading', { name: 'Black wins' })).toBeTruthy();
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
    expect(game.movesList().slice(-2)).toEqual(['bxa8=Q', 'gxh1=N']);
  });

  it('Take Back while the promotion choice is open only cancels the choice', () => {
    const game = renderChess();
    game.play(['a2', 'a4'], ['h7', 'h5'], ['a4', 'a5'], ['h5', 'h4'], ['a5', 'a6'], ['h4', 'h3'], ['a6', 'b7'], ['h3', 'g2']);
    const movesBefore = game.movesList();

    game.move('b7', 'a8');
    expect(game.container.querySelector('.promotion-choise')).not.toBeNull();

    fireEvent.click(screen.getByText('Take Back'));

    expect(game.container.querySelector('.promotion-choise')).toBeNull();
    expect(game.pieceOn('b7')).toBe('white-pawn');
    expect(game.pieceOn('g2')).toBe('black-pawn');
    expect(game.movesList()).toEqual(movesBefore);

    // White is still to move and can promote after all.
    game.move('b7', 'a8');
    game.choosePromotion('white-queen');
    expect(game.pieceOn('a8')).toBe('white-queen');
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

  it('ends the game when Black surrenders: White wins and the profile records a win', () => {
    const game = renderChess();
    game.move('e2', 'e4');

    fireEvent.click(screen.getByText('Surrender'));
    const confirm = ofType(within(screen.getByRole('dialog')).getByRole('button', { name: 'Surrender' }), HTMLButtonElement);
    expect(confirm.disabled).toBe(true);
    advance(2000);
    fireEvent.click(confirm);
    advance(250);

    expect(screen.getByRole('heading', { name: 'White wins' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('White winsBlack surrendered');
    expect(game.pieceOn('e4')).toBe('white-pawn');
    expect(game.movesList()).toEqual(['e4']);
    expect(chessStats()).toEqual({ wins: 1, losses: 0, draws: 0 });

    fireEvent.click(screen.getByRole('button', { name: 'New Game' }));

    expect(document.querySelector('.game_ends')).toBeNull();
    expect(game.pieceOn('e2')).toBe('white-pawn');
    expect(game.movesList()).toEqual([]);
    expect(chessStats()).toEqual({ wins: 1, losses: 0, draws: 0 });
  });

  it('ends the game when White surrenders: Black wins and the profile records a loss', () => {
    renderChess();

    fireEvent.click(screen.getByText('Surrender'));
    advance(2000);
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Surrender' }));
    advance(250);

    expect(screen.getByRole('heading', { name: 'Black wins' })).toBeTruthy();
    expect(screen.getByText('White surrendered')).toBeTruthy();
    expect(chessStats()).toEqual({ wins: 0, losses: 1, draws: 0 });
  });

  it('asks for the surrender in a modal dialog with the chess message', () => {
    renderChess();

    fireEvent.click(screen.getByText('Surrender'));

    const dialog = screen.getByRole('dialog', { name: 'Confirm Surrender' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(within(dialog).getByText(/This will end the current game\./)).toBeTruthy();
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

describe('Chess moves by tap or click', () => {
  it('moves a piece by tapping it and then one of its highlighted squares', () => {
    const game = renderChess();

    game.tap('e2');
    expect(game.cellOn('e2').classList.contains('selected')).toBe(true);
    expect(game.cellOn('e3').classList.contains('highlight')).toBe(true);
    expect(game.cellOn('e4').classList.contains('highlight')).toBe(true);
    expect(game.highlightedCount()).toBe(2);

    game.tap('e4');
    game.tap('e7');
    game.tap('e5');

    expect(game.pieceOn('e4')).toBe('white-pawn');
    expect(game.pieceOn('e5')).toBe('black-pawn');
    expect(game.movesList()).toEqual(['e4', 'e5']);
    expect(game.highlightedCount()).toBe(0);
    expect(game.selectedCount()).toBe(0);
  });

  it('puts the piece down when it is tapped again', () => {
    const game = renderChess();

    game.tap('e2');
    game.tap('e2');

    expect(game.selectedCount()).toBe(0);
    expect(game.highlightedCount()).toBe(0);
    expect(game.movesList()).toEqual([]);
  });

  it('switches to another piece of the side to move when that piece is tapped', () => {
    const game = renderChess();

    game.tap('e2');
    game.tap('g1');

    expect(game.cellOn('g1').classList.contains('selected')).toBe(true);
    expect(game.selectedCount()).toBe(1);
    expect(game.cellOn('f3').classList.contains('highlight')).toBe(true);
    expect(game.cellOn('h3').classList.contains('highlight')).toBe(true);
    expect(game.highlightedCount()).toBe(2);
  });

  it('drops the selection when a square that is not highlighted is tapped', () => {
    const game = renderChess();

    game.tap('e2');
    game.tap('e5');

    expect(game.pieceOn('e2')).toBe('white-pawn');
    expect(game.pieceOn('e5')).toBeNull();
    expect(game.movesList()).toEqual([]);
    expect(game.selectedCount()).toBe(0);
    expect(game.highlightedCount()).toBe(0);
  });

  it('ignores taps on the pieces of the side that is not to move', () => {
    const game = renderChess();

    game.tap('e7');

    expect(game.selectedCount()).toBe(0);
    expect(game.highlightedCount()).toBe(0);
  });

  it('starts the clock when White selects a piece by tap', () => {
    const game = renderChess();

    game.tap('e2');
    advance(2000);

    expect([clock('White'), clock('Black')]).toEqual(['04:58', '05:00']);
  });

  it('opens the promotion choice when a pawn is tapped onto the last rank', () => {
    startFrom({ e1: 'white-king', b7: 'white-pawn', h8: 'black-king' });
    const game = renderChess();

    game.tap('b7');
    game.tap('b8');
    expect(game.container.querySelector('.promotion-choise')).not.toBeNull();
    expect(game.pieceOn('b7')).toBe('white-pawn');

    game.choosePromotion('white-queen');

    expect(game.pieceOn('b8')).toBe('white-queen');
    expect(game.movesList()).toEqual(['b8=Q']);
  });

  it('clears the highlights and shows the piece again when a drag ends off the board', () => {
    const game = renderChess();

    game.pickUp('e2');
    advance(0);
    const piece = ofType(game.pieceElement('e2'), HTMLElement);
    expect(piece.style.display).toBe('none');
    expect(game.highlightedCount()).toBe(2);

    fireEvent.dragEnd(piece, { dataTransfer: { dropEffect: 'none' } });

    expect(piece.style.display).toBe('block');
    expect(game.highlightedCount()).toBe(0);
    expect(game.selectedCount()).toBe(0);
    expect(game.movesList()).toEqual([]);
  });
});

describe('Chess endings from chosen positions', () => {
  const resultOverlay = () => document.querySelector('.game_ends');

  it('ends the game when a promotion checkmates and records the win', () => {
    startFrom({ b6: 'white-king', c7: 'white-pawn', a8: 'black-king' });
    const game = renderChess();

    game.move('c7', 'c8');
    game.choosePromotion('white-queen');

    expect(screen.getByRole('heading', { name: 'White wins' })).toBeTruthy();
    expect(game.movesList()).toEqual(['c8=Q']);
    expect(chessStats()).toEqual({ wins: 1, losses: 0, draws: 0 });
  });

  it('puts the game back in play when the mating promotion is taken back', () => {
    startFrom({ b6: 'white-king', c7: 'white-pawn', a8: 'black-king' });
    const game = renderChess();
    game.move('c7', 'c8');
    game.choosePromotion('white-rook');

    fireEvent.click(screen.getByText('Take Back'));

    expect(resultOverlay()).toBeNull();
    expect(game.pieceOn('c7')).toBe('white-pawn');
    expect(game.movesList()).toEqual([]);
  });

  it('ends the game in a draw when a promotion stalemates', () => {
    startFrom({ c1: 'white-king', g7: 'white-pawn', a1: 'black-king' });
    const game = renderChess();

    game.move('g7', 'g8');
    game.choosePromotion('white-queen');

    expect(screen.getByRole('heading', { name: 'Draw' })).toBeTruthy();
    expect(screen.getByText('Game draws due to stalemate')).toBeTruthy();
    expect(chessStats()).toEqual({ wins: 0, losses: 0, draws: 1 });
  });

  it('ends the game in a draw when an under-promotion leaves insufficient material', () => {
    startFrom({ b6: 'white-king', c7: 'white-pawn', a8: 'black-king' });
    const game = renderChess();

    game.move('c7', 'c8');
    game.choosePromotion('white-knight');

    expect(screen.getByText('Game draws due to insufficient material')).toBeTruthy();
    expect(game.movesList()).toEqual(['c8=N']);
  });

  it('keeps playing when the only reply is an en passant capture', () => {
    startFrom({ a1: 'white-king', e5: 'white-pawn', b3: 'black-queen', e6: 'black-knight', h8: 'black-king', d7: 'black-pawn' }, 'black');
    const game = renderChess();

    game.move('d7', 'd5');
    expect(resultOverlay()).toBeNull();

    game.move('e5', 'd6');
    expect(game.pieceOn('d6')).toBe('white-pawn');
    expect(game.pieceOn('d5')).toBeNull();
    expect(game.movesList()).toEqual(['d5', 'exd6']);
  });

  it('is no checkmate when an en passant capture removes the checking pawn', () => {
    startFrom({ e4: 'white-king', e5: 'white-pawn', d7: 'black-pawn', c6: 'black-pawn', f8: 'black-rook', a3: 'black-rook', b5: 'black-knight', h8: 'black-king' }, 'black');
    const game = renderChess();

    game.move('d7', 'd5');
    expect(resultOverlay()).toBeNull();
    expect(game.container.querySelectorAll('.cell.checked')).toHaveLength(1);

    game.move('e5', 'd6');
    expect(game.pieceOn('d6')).toBe('white-pawn');
    expect(game.container.querySelectorAll('.cell.checked')).toHaveLength(0);
  });
});
