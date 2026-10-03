import { describe, expect, it } from 'vitest';
import { getCastlingMoves, keepCastlingRights } from './castling';
import { createPosition } from '../helper';
import { at, boardWith, toSquares } from '../../../shared/test/boardTestUtils';
import type { CastlingRights, ChessCell, ChessPosition } from '../../model/types';
import type { PlayerColor } from '../../../shared/model/types';

type Pieces = Record<string, ChessCell>;

describe('getCastlingMoves', () => {
  const whiteHome: Pieces = { e1: 'white-king', a1: 'white-rook', h1: 'white-rook', e8: 'black-king' };
  const blackHome: Pieces = { e8: 'black-king', a8: 'black-rook', h8: 'black-rook', e1: 'white-king' };
  const whiteKing = (position: ChessPosition, castleDirection: CastlingRights) =>
    toSquares(getCastlingMoves({ position, castleDirection, figure: 'white-king', ...at('e1') }));

  it('allows castling on both sides when the path is clear', () => {
    expect(whiteKing(boardWith(whiteHome), 'both')).toEqual(['c1', 'g1']);
  });

  it('allows black to castle on its own back rank', () => {
    const position = boardWith(blackHome);
    expect(toSquares(getCastlingMoves({ position, castleDirection: 'both', figure: 'black-king', ...at('e8') }))).toEqual(['c8', 'g8']);
  });

  it('respects the remaining castling direction', () => {
    const position = boardWith(whiteHome);
    expect(whiteKing(position, 'left')).toEqual(['c1']);
    expect(whiteKing(position, 'right')).toEqual(['g1']);
    expect(whiteKing(position, 'none')).toEqual([]);
  });

  it('is not allowed when pieces stand between king and rook', () => {
    expect(whiteKing(boardWith({ ...whiteHome, b1: 'white-knight' }), 'both')).toEqual(['g1']);
    expect(whiteKing(boardWith({ ...whiteHome, f1: 'white-bishop' }), 'both')).toEqual(['c1']);
  });

  it('is not allowed when the rook is missing', () => {
    // Castling rights are not revoked when a rook is captured, so this check is the only guard.
    const withoutKingsideRook: Pieces = { e1: 'white-king', a1: 'white-rook', e8: 'black-king' };
    const withoutQueensideRook: Pieces = { e1: 'white-king', h1: 'white-rook', e8: 'black-king' };
    const blackWithoutQueensideRook: Pieces = { e8: 'black-king', h8: 'black-rook', e1: 'white-king' };

    expect(whiteKing(boardWith(withoutKingsideRook), 'both')).toEqual(['c1']);
    expect(whiteKing(boardWith(withoutQueensideRook), 'both')).toEqual(['g1']);
    expect(toSquares(getCastlingMoves({ position: boardWith(blackWithoutQueensideRook), castleDirection: 'both', figure: 'black-king', ...at('e8') }))).toEqual(['g8']);
  });

  it('is not allowed while the king is in check', () => {
    expect(whiteKing(boardWith({ ...whiteHome, e5: 'black-rook' }), 'both')).toEqual([]);
  });

  it('is not allowed through or into an attacked square', () => {
    expect(whiteKing(boardWith({ ...whiteHome, f5: 'black-rook' }), 'both')).toEqual(['c1']);
    expect(whiteKing(boardWith({ ...whiteHome, g5: 'black-rook' }), 'both')).toEqual(['c1']);
    expect(whiteKing(boardWith({ ...whiteHome, d5: 'black-rook' }), 'both')).toEqual(['g1']);
    expect(whiteKing(boardWith({ ...whiteHome, c5: 'black-rook' }), 'both')).toEqual(['g1']);
  });

  it('allows queenside castling when only b1 is attacked', () => {
    expect(whiteKing(boardWith({ ...whiteHome, b5: 'black-rook' }), 'both')).toEqual(['c1', 'g1']);
  });

  it('requires the king to stand on its starting square', () => {
    const offFile = boardWith({ d1: 'white-king', a1: 'white-rook', h1: 'white-rook', e8: 'black-king' });
    const offRank = boardWith({ e4: 'white-king', a1: 'white-rook', h1: 'white-rook', e8: 'black-king' });

    expect(getCastlingMoves({ position: offFile, castleDirection: 'both', figure: 'white-king', ...at('d1') })).toEqual([]);
    expect(getCastlingMoves({ position: offRank, castleDirection: 'both', figure: 'white-king', ...at('e4') })).toEqual([]);
  });
});

describe('keepCastlingRights', () => {
  const homeRank = (colour: PlayerColor, rank: number): Pieces => ({ [`e${rank}`]: `${colour}-king`, [`a${rank}`]: `${colour}-rook`, [`h${rank}`]: `${colour}-rook` });

  it('keeps both sides while the king and both rooks stand on their starting squares', () => {
    expect(keepCastlingRights('both', createPosition(), 'white')).toBe('both');
    expect(keepCastlingRights('both', createPosition(), 'black')).toBe('both');
  });

  it('loses both sides once the king has left its square', () => {
    const position = boardWith({ e2: 'white-king', a1: 'white-rook', h1: 'white-rook', e8: 'black-king' });
    expect(keepCastlingRights('both', position, 'white')).toBe('none');
  });

  it('loses the side whose rook has left its corner', () => {
    expect(keepCastlingRights('both', boardWith({ ...homeRank('white', 1), a1: '', a2: 'white-rook' }), 'white')).toBe('right');
    expect(keepCastlingRights('both', boardWith({ ...homeRank('white', 1), h1: '', h3: 'white-rook' }), 'white')).toBe('left');
    expect(keepCastlingRights('both', boardWith({ ...homeRank('black', 8), h8: '', g8: 'black-rook' }), 'black')).toBe('left');
    expect(keepCastlingRights('both', boardWith({ ...homeRank('black', 8), a8: '', d8: 'black-rook' }), 'black')).toBe('right');
  });

  it('loses the side whose rook was captured on its corner', () => {
    expect(keepCastlingRights('both', boardWith({ ...homeRank('white', 1), h1: 'black-bishop' }), 'white')).toBe('left');
    expect(keepCastlingRights('both', boardWith({ ...homeRank('black', 8), a8: 'white-queen' }), 'black')).toBe('right');
  });

  it('never gives back a side that was already lost, even with a rook back in the corner', () => {
    const home = boardWith(homeRank('white', 1));
    expect(keepCastlingRights('left', home, 'white')).toBe('left');
    expect(keepCastlingRights('right', home, 'white')).toBe('right');
    expect(keepCastlingRights('none', home, 'white')).toBe('none');
  });
});
