import { describe, expect, it } from 'vitest';
import arbiter from './arbiter';
import { getBishopMoves, getFigures, getKnightMoves, getRookMoves } from './getMoves';
import { createPosition } from '../helper';
import { at, boardWith, pieceAt, sq, toSquares } from '../../../shared/test/boardTestUtils';
import type { CastlingRights, ChessCell, ChessPiece, ChessPosition } from '../../model/types';
import type { PlayerColor } from '../../../shared/model/types';

type Pieces = Record<string, ChessCell>;

// The piece on an occupied square.
const pieceOn = (position: ChessPosition, square: string): ChessPiece => {
  const piece = pieceAt(position, square);
  if (!piece) throw new Error(`No piece on ${square}`);
  return piece;
};

// Without castling rights in `extra` none are given, so no castling move can show up.
const validMoves = (
  position: ChessPosition,
  square: string,
  extra: { prevPosition?: ChessPosition; castleDirection?: CastlingRights } = {}
) =>
  toSquares(arbiter.getValidMoves({ position, figure: pieceOn(position, square), ...at(square), castleDirection: 'none', ...extra }));

// Plays a sequence of [from, to] moves through the engine itself.
const play = (position: ChessPosition, moves: [string, string][]) => moves.reduce((current, [from, target]) => {
  const [y, x] = sq(target);
  return arbiter.performMove({ position: current, figure: pieceOn(current, from), ...at(from), y, x });
}, position);

const countLegalMoves = (position: ChessPosition, player: PlayerColor) => getFigures(position, player)
  .reduce((total, f) => total + arbiter.getValidMoves({ position, castleDirection: 'both', ...f }).length, 0);

describe('arbiter.getRegularMoves', () => {
  it('dispatches to the generator matching the piece type', () => {
    const position = boardWith({ d4: 'white-knight', a1: 'white-rook', f1: 'white-bishop' });

    expect(arbiter.getRegularMoves({ position, figure: 'white-knight', ...at('d4') }))
      .toEqual(getKnightMoves({ position, figure: 'white-knight', ...at('d4') }));
    expect(arbiter.getRegularMoves({ position, figure: 'white-rook', ...at('a1') }))
      .toEqual(getRookMoves({ position, figure: 'white-rook', ...at('a1') }));
    expect(arbiter.getRegularMoves({ position, figure: 'white-bishop', ...at('f1') }))
      .toEqual(getBishopMoves({ position, figure: 'white-bishop', ...at('f1') }));
  });
});

describe('arbiter.getValidMoves', () => {
  it('gives white exactly 20 legal moves in the initial position', () => {
    expect(countLegalMoves(createPosition(), 'white')).toBe(20);
  });

  it('gives black exactly 20 legal replies after 1. e4', () => {
    expect(countLegalMoves(play(createPosition(), [['e2', 'e4']]), 'black')).toBe(20);
  });

  it('adds diagonal captures to pawn moves', () => {
    const position = boardWith({ e1: 'white-king', e8: 'black-king', e4: 'white-pawn', d5: 'black-pawn' });
    expect(validMoves(position, 'e4')).toEqual(['d5', 'e5']);
  });

  it('adds en passant when the previous position is provided', () => {
    const kings: Pieces = { e1: 'white-king', e8: 'black-king' };
    const prevPosition = boardWith({ ...kings, e5: 'white-pawn', f7: 'black-pawn' });
    const position = boardWith({ ...kings, e5: 'white-pawn', f5: 'black-pawn' });

    expect(validMoves(position, 'e5', { prevPosition })).toEqual(['e6', 'f6']);
  });

  it('includes pawn moves and captures onto the last rank (promotion squares)', () => {
    const position = boardWith({ e1: 'white-king', h8: 'black-king', a7: 'white-pawn', b8: 'black-rook' });
    expect(validMoves(position, 'a7')).toEqual(['a8', 'b8']);
  });

  it('adds castling moves for the king', () => {
    const position = boardWith({ e1: 'white-king', a1: 'white-rook', h1: 'white-rook', e8: 'black-king' });
    expect(validMoves(position, 'e1', { castleDirection: 'both' })).toEqual(['c1', 'd1', 'd2', 'e2', 'f1', 'f2', 'g1']);
    expect(validMoves(position, 'e1', { castleDirection: 'none' })).toEqual(['d1', 'd2', 'e2', 'f1', 'f2']);
  });

  it('does not let the king step into check', () => {
    const position = boardWith({ e1: 'white-king', d8: 'black-rook', h8: 'black-king' });
    expect(validMoves(position, 'e1')).toEqual(['e2', 'f1', 'f2']);
  });

  it('does not let a pinned piece leave the pin line', () => {
    const position = boardWith({ e1: 'white-king', e2: 'white-bishop', e8: 'black-rook', a8: 'black-king' });
    expect(validMoves(position, 'e2')).toEqual([]);
  });

  it('lets a pinned rook move along the pin line, including capturing the pinner', () => {
    const position = boardWith({ e1: 'white-king', e2: 'white-rook', e8: 'black-rook', a8: 'black-king' });
    expect(validMoves(position, 'e2')).toEqual(['e3', 'e4', 'e5', 'e6', 'e7', 'e8']);
  });

  it('only allows moves that resolve a check', () => {
    const position = boardWith({ e1: 'white-king', a2: 'white-rook', e8: 'black-rook', h8: 'black-king' });
    expect(validMoves(position, 'a2')).toEqual(['e2']);
  });
});

describe('arbiter.isPlayerInCheck', () => {
  const inCheck = (pieces: Pieces, player: PlayerColor = 'white') =>
    arbiter.isPlayerInCheck({ positionAfterMove: boardWith(pieces), player });

  it('detects checks from sliding pieces', () => {
    expect(inCheck({ e1: 'white-king', e8: 'black-rook', a8: 'black-king' })).toBe(true);
    expect(inCheck({ e1: 'white-king', a5: 'black-bishop', h8: 'black-king' })).toBe(true);
    expect(inCheck({ e1: 'white-king', h4: 'black-queen', a8: 'black-king' })).toBe(true);
  });

  it('detects checks from knights and pawns', () => {
    expect(inCheck({ e1: 'white-king', d3: 'black-knight', a8: 'black-king' })).toBe(true);
    expect(inCheck({ e4: 'white-king', d5: 'black-pawn', a8: 'black-king' })).toBe(true);
    expect(inCheck({ e8: 'black-king', d7: 'white-pawn', a1: 'white-king' }, 'black')).toBe(true);
  });

  it('does not count a pawn standing directly in front as a check', () => {
    expect(inCheck({ e4: 'white-king', e5: 'black-pawn', a8: 'black-king' })).toBe(false);
  });

  it('does not see through blocking pieces', () => {
    expect(inCheck({ e1: 'white-king', e2: 'white-pawn', e8: 'black-rook', a8: 'black-king' })).toBe(false);
    expect(inCheck({ e1: 'white-king', d2: 'white-knight', a5: 'black-bishop', h8: 'black-king' })).toBe(false);
  });

  it('reports no check in the initial position', () => {
    expect(arbiter.isPlayerInCheck({ positionAfterMove: createPosition(), player: 'white' })).toBe(false);
    expect(arbiter.isPlayerInCheck({ positionAfterMove: createPosition(), player: 'black' })).toBe(false);
  });
});

describe('arbiter.isCheckmate', () => {
  it("detects fool's mate", () => {
    const position = play(createPosition(), [['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4'], ['d8', 'h4']]);

    expect(arbiter.isCheckmate(position, 'white', 'both')).toBe(true);
    expect(arbiter.isCheckmate(position, 'black', 'both')).toBe(false);
  });

  it('detects a back-rank mate', () => {
    const position = boardWith({ g1: 'white-king', f2: 'white-pawn', g2: 'white-pawn', h2: 'white-pawn', a1: 'black-rook', g8: 'black-king' });
    expect(arbiter.isCheckmate(position, 'white', 'none')).toBe(true);
  });

  it('is false for a check that can be escaped, blocked or captured', () => {
    const escapable = boardWith({ e1: 'white-king', e8: 'black-rook', a8: 'black-king' });
    // The bishop can only interpose on b1 (it cannot reach a1).
    const blockable = boardWith({ g1: 'white-king', f2: 'white-pawn', g2: 'white-pawn', h2: 'white-pawn', e4: 'white-bishop', a1: 'black-rook', g8: 'black-king' });
    const capturable = boardWith({ g1: 'white-king', f2: 'white-pawn', g2: 'white-pawn', h2: 'white-pawn', a7: 'white-rook', a1: 'black-rook', g8: 'black-king' });

    expect(arbiter.isCheckmate(escapable, 'white', 'none')).toBe(false);
    expect(arbiter.isCheckmate(blockable, 'white', 'none')).toBe(false);
    expect(arbiter.isCheckmate(capturable, 'white', 'none')).toBe(false);
  });

  it('is false for a stalemate (no check)', () => {
    const position = boardWith({ a8: 'black-king', b6: 'white-queen', h1: 'white-king' });
    expect(arbiter.isCheckmate(position, 'black', 'none')).toBe(false);
  });
});

describe('arbiter.isStalemate', () => {
  it('detects a king with no legal moves that is not in check', () => {
    const position = boardWith({ a8: 'black-king', b6: 'white-queen', h1: 'white-king' });
    expect(arbiter.isStalemate(position, 'black', 'none')).toBe(true);
  });

  it('is false when the player is checkmated', () => {
    const position = boardWith({ g1: 'white-king', f2: 'white-pawn', g2: 'white-pawn', h2: 'white-pawn', a1: 'black-rook', g8: 'black-king' });
    expect(arbiter.isStalemate(position, 'white', 'none')).toBe(false);
  });

  it('is false when another piece can still move', () => {
    const position = boardWith({ a8: 'black-king', b6: 'white-queen', h1: 'white-king', h7: 'black-pawn' });
    expect(arbiter.isStalemate(position, 'black', 'none')).toBe(false);
  });

  it('is false in the initial position', () => {
    expect(arbiter.isStalemate(createPosition(), 'white', 'both')).toBe(false);
  });

  it('counts an en passant capture as a legal move when given the position before the last move', () => {
    const before = boardWith({ a1: 'white-king', e5: 'white-pawn', b3: 'black-queen', e6: 'black-knight', h8: 'black-king', d7: 'black-pawn' });
    const after = boardWith({ a1: 'white-king', e5: 'white-pawn', b3: 'black-queen', e6: 'black-knight', h8: 'black-king', d5: 'black-pawn' });

    expect(validMoves(after, 'e5', { prevPosition: before })).toEqual(['d6']);
    expect(arbiter.isStalemate(after, 'white', 'none', before)).toBe(false);
  });
});

describe('arbiter.isCheckmate with en passant', () => {
  // d7-d5 checks the king on e4; every other escape is covered and d5 is protected by c6.
  const before = boardWith({ e4: 'white-king', e5: 'white-pawn', d7: 'black-pawn', c6: 'black-pawn', f8: 'black-rook', a3: 'black-rook', b5: 'black-knight', h8: 'black-king' });
  const after = boardWith({ e4: 'white-king', e5: 'white-pawn', d5: 'black-pawn', c6: 'black-pawn', f8: 'black-rook', a3: 'black-rook', b5: 'black-knight', h8: 'black-king' });

  it('is false when capturing the checking pawn en passant is the way out', () => {
    expect(arbiter.isPlayerInCheck({ positionAfterMove: after, player: 'white' })).toBe(true);
    expect(validMoves(after, 'e4', { prevPosition: before })).toEqual([]);
    expect(validMoves(after, 'e5', { prevPosition: before })).toEqual(['d6']);
    expect(arbiter.isCheckmate(after, 'white', 'none', before)).toBe(false);
  });
});

describe('arbiter.insufficientMaterial', () => {
  const insufficient = (pieces: Pieces) => arbiter.insufficientMaterial(boardWith(pieces));

  it('is true for king against king', () => {
    expect(insufficient({ e1: 'white-king', e8: 'black-king' })).toBe(true);
  });

  it('is true for king and a single minor piece against king', () => {
    expect(insufficient({ e1: 'white-king', e8: 'black-king', c1: 'white-bishop' })).toBe(true);
    expect(insufficient({ e1: 'white-king', e8: 'black-king', g8: 'black-knight' })).toBe(true);
  });

  it('is true for opposing bishops on squares of the same colour', () => {
    expect(insufficient({ e1: 'white-king', e8: 'black-king', c1: 'white-bishop', f8: 'black-bishop' })).toBe(true);
  });

  it('is false for opposing bishops on squares of different colours', () => {
    expect(insufficient({ e1: 'white-king', e8: 'black-king', c1: 'white-bishop', c8: 'black-bishop' })).toBe(false);
  });

  it('is false when mating material remains', () => {
    expect(insufficient({ e1: 'white-king', e8: 'black-king', a1: 'white-rook' })).toBe(false);
    expect(insufficient({ e1: 'white-king', e8: 'black-king', d1: 'white-queen' })).toBe(false);
    expect(insufficient({ e1: 'white-king', e8: 'black-king', a2: 'white-pawn' })).toBe(false);
    expect(insufficient({ e1: 'white-king', e8: 'black-king', c1: 'white-bishop', f1: 'white-bishop' })).toBe(false);
    expect(insufficient({ e1: 'white-king', e8: 'black-king', b1: 'white-knight', g8: 'black-knight' })).toBe(false);
    expect(arbiter.insufficientMaterial(createPosition())).toBe(false);
  });
});
