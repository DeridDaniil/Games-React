import { describe, expect, it } from 'vitest';
import { moveFigures, movePawns } from './move';
import arbiter from './arbiter';
import { createPosition } from '../helper';
import { at, boardWith, pieceAt, sq } from '../../../shared/test/boardTestUtils';

const to = (square: string) => {
  const [y, x] = sq(square);
  return { y, x };
};

describe('movePawns', () => {
  it('moves a pawn forward and empties the starting square', () => {
    const position = createPosition();
    const next = movePawns({ position, figure: 'white-pawn', ...at('e2'), ...to('e4') });

    expect(pieceAt(next, 'e2')).toBe('');
    expect(pieceAt(next, 'e4')).toBe('white-pawn');
  });

  it('replaces the captured piece on a diagonal capture', () => {
    const position = boardWith({ e4: 'white-pawn', d5: 'black-knight' });
    const next = movePawns({ position, figure: 'white-pawn', ...at('e4'), ...to('d5') });

    expect(pieceAt(next, 'd5')).toBe('white-pawn');
    expect(pieceAt(next, 'e4')).toBe('');
  });

  it('removes the passed pawn on an en passant capture', () => {
    const position = boardWith({ e5: 'white-pawn', d5: 'black-pawn' });
    const next = movePawns({ position, figure: 'white-pawn', ...at('e5'), ...to('d6') });

    expect(pieceAt(next, 'd6')).toBe('white-pawn');
    expect(pieceAt(next, 'd5')).toBe('');
    expect(pieceAt(next, 'e5')).toBe('');
  });

  it('removes the passed pawn on an en passant capture by black', () => {
    const position = boardWith({ d4: 'black-pawn', e4: 'white-pawn' });
    const next = movePawns({ position, figure: 'black-pawn', ...at('d4'), ...to('e3') });

    expect(pieceAt(next, 'e3')).toBe('black-pawn');
    expect(pieceAt(next, 'e4')).toBe('');
  });

  it('does not promote by itself: a pawn reaching the last rank stays a pawn', () => {
    const position = boardWith({ a7: 'white-pawn' });
    const next = movePawns({ position, figure: 'white-pawn', ...at('a7'), ...to('a8') });

    expect(pieceAt(next, 'a8')).toBe('white-pawn');
  });
});

describe('moveFigures', () => {
  it('moves a piece and captures whatever stands on the target square', () => {
    const position = boardWith({ g1: 'white-knight', f3: 'black-pawn' });
    const next = moveFigures({ position, figure: 'white-knight', ...at('g1'), ...to('f3') });

    expect(pieceAt(next, 'f3')).toBe('white-knight');
    expect(pieceAt(next, 'g1')).toBe('');
  });

  it('moves the rook from h1 to f1 on kingside castling', () => {
    const position = boardWith({ e1: 'white-king', h1: 'white-rook', a1: 'white-rook' });
    const next = moveFigures({ position, figure: 'white-king', ...at('e1'), ...to('g1') });

    expect(pieceAt(next, 'g1')).toBe('white-king');
    expect(pieceAt(next, 'f1')).toBe('white-rook');
    expect(pieceAt(next, 'h1')).toBe('');
    expect(pieceAt(next, 'e1')).toBe('');
    expect(pieceAt(next, 'a1')).toBe('white-rook');
  });

  it('moves the rook from a8 to d8 on queenside castling', () => {
    const position = boardWith({ e8: 'black-king', a8: 'black-rook', h8: 'black-rook' });
    const next = moveFigures({ position, figure: 'black-king', ...at('e8'), ...to('c8') });

    expect(pieceAt(next, 'c8')).toBe('black-king');
    expect(pieceAt(next, 'd8')).toBe('black-rook');
    expect(pieceAt(next, 'a8')).toBe('');
    expect(pieceAt(next, 'h8')).toBe('black-rook');
  });

  it('does not touch rooks on a normal one-square king move', () => {
    const position = boardWith({ e1: 'white-king', h1: 'white-rook' });
    const next = moveFigures({ position, figure: 'white-king', ...at('e1'), ...to('f1') });

    expect(pieceAt(next, 'f1')).toBe('white-king');
    expect(pieceAt(next, 'h1')).toBe('white-rook');
  });
});

describe('arbiter.performMove', () => {
  it('uses pawn rules for pawns (en passant removal)', () => {
    const position = boardWith({ e5: 'white-pawn', d5: 'black-pawn' });
    const next = arbiter.performMove({ position, figure: 'white-pawn', ...at('e5'), ...to('d6') });

    expect(pieceAt(next, 'd5')).toBe('');
  });

  it('uses figure rules for other pieces (castling rook relocation)', () => {
    const position = boardWith({ e1: 'white-king', h1: 'white-rook' });
    const next = arbiter.performMove({ position, figure: 'white-king', ...at('e1'), ...to('g1') });

    expect(pieceAt(next, 'f1')).toBe('white-rook');
  });

  it('returns a new position and never mutates the original one', () => {
    const position = createPosition();
    const snapshot = JSON.stringify(position);

    const next = arbiter.performMove({ position, figure: 'white-pawn', ...at('e2'), ...to('e4') });

    expect(next).not.toBe(position);
    expect(JSON.stringify(position)).toBe(snapshot);
  });
});
