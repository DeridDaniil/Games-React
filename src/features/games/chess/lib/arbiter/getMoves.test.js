import { describe, expect, it } from 'vitest';
import {
  getBishopMoves,
  getCastlingMoves,
  getFigures,
  getKingMoves,
  getKingPosition,
  getKnightMoves,
  getPawnCaptures,
  getPawnMoves,
  getQueenMoves,
  getRookMoves,
  keepCastlingRights
} from './getMoves';
import { createPosition } from '../helper';
import { at, boardWith, sq, toSquares } from '../../../shared/test/boardTestUtils';

describe('getPawnMoves', () => {
  it('moves a white pawn one or two squares forward from its starting rank', () => {
    const position = boardWith({ e2: 'white-pawn' });
    expect(toSquares(getPawnMoves({ position, figure: 'white-pawn', ...at('e2') }))).toEqual(['e3', 'e4']);
  });

  it('moves a black pawn one or two squares down the board from its starting rank', () => {
    const position = boardWith({ d7: 'black-pawn' });
    expect(toSquares(getPawnMoves({ position, figure: 'black-pawn', ...at('d7') }))).toEqual(['d5', 'd6']);
  });

  it('allows only a single step once the pawn has left its starting rank', () => {
    const position = boardWith({ e3: 'white-pawn', d6: 'black-pawn' });
    expect(toSquares(getPawnMoves({ position, figure: 'white-pawn', ...at('e3') }))).toEqual(['e4']);
    expect(toSquares(getPawnMoves({ position, figure: 'black-pawn', ...at('d6') }))).toEqual(['d5']);
  });

  it('cannot move forward onto an occupied square', () => {
    const position = boardWith({ e4: 'white-pawn', e5: 'black-pawn' });
    expect(getPawnMoves({ position, figure: 'white-pawn', ...at('e4') })).toEqual([]);
    expect(getPawnMoves({ position, figure: 'black-pawn', ...at('e5') })).toEqual([]);
  });

  it('cannot double-step onto an occupied square', () => {
    const position = boardWith({ e2: 'white-pawn', e4: 'black-knight' });
    expect(toSquares(getPawnMoves({ position, figure: 'white-pawn', ...at('e2') }))).toEqual(['e3']);
  });

  it('cannot double-step through a piece standing directly in front of it', () => {
    const blockedByEnemy = boardWith({ e2: 'white-pawn', e3: 'black-knight' });
    const blockedByOwn = boardWith({ d7: 'black-pawn', d6: 'black-bishop' });

    expect(getPawnMoves({ position: blockedByEnemy, figure: 'white-pawn', ...at('e2') })).toEqual([]);
    expect(getPawnMoves({ position: blockedByOwn, figure: 'black-pawn', ...at('d7') })).toEqual([]);
  });

  it('never generates moves for diagonal squares (captures are handled separately)', () => {
    const position = boardWith({ e4: 'white-pawn', d5: 'black-pawn', f5: 'black-pawn' });
    expect(toSquares(getPawnMoves({ position, figure: 'white-pawn', ...at('e4') }))).toEqual(['e5']);
  });

  it('gives a pawn on the seventh rank a single step to the last rank only', () => {
    const position = boardWith({ a7: 'white-pawn', h2: 'black-pawn' });
    expect(toSquares(getPawnMoves({ position, figure: 'white-pawn', ...at('a7') }))).toEqual(['a8']);
    expect(toSquares(getPawnMoves({ position, figure: 'black-pawn', ...at('h2') }))).toEqual(['h1']);
  });
});

describe('getPawnCaptures', () => {
  it('captures enemy pieces diagonally forward', () => {
    const position = boardWith({ e4: 'white-pawn', d5: 'black-knight', f5: 'black-rook' });
    expect(toSquares(getPawnCaptures({ position, figure: 'white-pawn', ...at('e4') }))).toEqual(['d5', 'f5']);
  });

  it('captures in the opposite direction for black', () => {
    const position = boardWith({ d5: 'black-pawn', e4: 'white-pawn', c4: 'white-queen' });
    expect(toSquares(getPawnCaptures({ position, figure: 'black-pawn', ...at('d5') }))).toEqual(['c4', 'e4']);
  });

  it('does not capture own pieces, empty squares or pieces behind', () => {
    const position = boardWith({ e4: 'white-pawn', d5: 'white-knight', d3: 'black-pawn', f3: 'black-pawn' });
    expect(getPawnCaptures({ position, figure: 'white-pawn', ...at('e4') })).toEqual([]);
  });

  it('does not wrap around the board edge', () => {
    const position = boardWith({ a4: 'white-pawn', b5: 'black-pawn', h5: 'black-pawn' });
    expect(toSquares(getPawnCaptures({ position, figure: 'white-pawn', ...at('a4') }))).toEqual(['b5']);
  });

  describe('en passant', () => {
    const prevPosition = boardWith({ e5: 'white-pawn', d7: 'black-pawn' });
    const position = boardWith({ e5: 'white-pawn', d5: 'black-pawn' });

    it('captures a pawn that has just made a double step next to it', () => {
      expect(toSquares(getPawnCaptures({ position, prevPosition, figure: 'white-pawn', ...at('e5') }))).toEqual(['d6']);
    });

    it('works for black against a white double step', () => {
      const prev = boardWith({ d4: 'black-pawn', e2: 'white-pawn' });
      const current = boardWith({ d4: 'black-pawn', e4: 'white-pawn' });
      expect(toSquares(getPawnCaptures({ position: current, prevPosition: prev, figure: 'black-pawn', ...at('d4') }))).toEqual(['e3']);
    });

    it('is not available without the previous position', () => {
      expect(getPawnCaptures({ position, figure: 'white-pawn', ...at('e5') })).toEqual([]);
    });

    it('is not available after a single step', () => {
      const prev = boardWith({ e5: 'white-pawn', d6: 'black-pawn' });
      expect(getPawnCaptures({ position, prevPosition: prev, figure: 'white-pawn', ...at('e5') })).toEqual([]);
    });

    it('is only available from the fifth rank (white) / fourth rank (black)', () => {
      const prev = boardWith({ e4: 'white-pawn', d6: 'black-pawn' });
      const current = boardWith({ e4: 'white-pawn', d4: 'black-pawn' });
      expect(getPawnCaptures({ position: current, prevPosition: prev, figure: 'white-pawn', ...at('e4') })).toEqual([]);
    });
  });
});

describe('getKnightMoves', () => {
  it('jumps to all eight L-shaped squares from the centre', () => {
    const position = boardWith({ d4: 'white-knight' });
    expect(toSquares(getKnightMoves({ position, figure: 'white-knight', ...at('d4') })))
      .toEqual(['b3', 'b5', 'c2', 'c6', 'e2', 'e6', 'f3', 'f5']);
  });

  it('stays on the board from a corner', () => {
    const position = boardWith({ a1: 'white-knight' });
    expect(toSquares(getKnightMoves({ position, figure: 'white-knight', ...at('a1') }))).toEqual(['b3', 'c2']);
  });

  it('can capture enemy pieces but not land on own pieces', () => {
    const position = boardWith({ a1: 'white-knight', b3: 'black-pawn', c2: 'white-pawn' });
    expect(toSquares(getKnightMoves({ position, figure: 'white-knight', ...at('a1') }))).toEqual(['b3']);
  });

  it('jumps over surrounding pieces in the initial position', () => {
    const position = createPosition();
    expect(toSquares(getKnightMoves({ position, figure: 'white-knight', ...at('b1') }))).toEqual(['a3', 'c3']);
    expect(toSquares(getKnightMoves({ position, figure: 'black-knight', ...at('g8') }))).toEqual(['f6', 'h6']);
  });
});

describe('getBishopMoves', () => {
  it('slides along all four diagonals on an empty board', () => {
    const position = boardWith({ d4: 'white-bishop' });
    expect(toSquares(getBishopMoves({ position, figure: 'white-bishop', ...at('d4') }))).toEqual([
      'a1', 'a7', 'b2', 'b6', 'c3', 'c5', 'e3', 'e5', 'f2', 'f6', 'g1', 'g7', 'h8'
    ]);
  });

  it('stops before an own piece and on an enemy piece', () => {
    const position = boardWith({ d4: 'white-bishop', f6: 'white-pawn', b2: 'black-pawn' });
    const moves = toSquares(getBishopMoves({ position, figure: 'white-bishop', ...at('d4') }));

    expect(moves).toContain('e5');
    expect(moves).not.toContain('f6');
    expect(moves).not.toContain('g7');
    expect(moves).toContain('b2');
    expect(moves).not.toContain('a1');
  });
});

describe('getRookMoves', () => {
  it('slides along ranks and files on an empty board', () => {
    const position = boardWith({ d4: 'black-rook' });
    expect(toSquares(getRookMoves({ position, figure: 'black-rook', ...at('d4') }))).toEqual([
      'a4', 'b4', 'c4', 'd1', 'd2', 'd3', 'd5', 'd6', 'd7', 'd8', 'e4', 'f4', 'g4', 'h4'
    ]);
  });

  it('stops before an own piece and on an enemy piece', () => {
    const position = boardWith({ a1: 'white-rook', a4: 'black-pawn', d1: 'white-king' });
    expect(toSquares(getRookMoves({ position, figure: 'white-rook', ...at('a1') }))).toEqual(['a2', 'a3', 'a4', 'b1', 'c1']);
  });
});

describe('getQueenMoves', () => {
  it('combines rook and bishop movement', () => {
    const position = boardWith({ d4: 'white-queen' });
    const queen = toSquares(getQueenMoves({ position, figure: 'white-queen', ...at('d4') }));
    const rookAndBishop = toSquares([
      ...getRookMoves({ position, figure: 'white-queen', ...at('d4') }),
      ...getBishopMoves({ position, figure: 'white-queen', ...at('d4') })
    ]);

    expect(queen).toHaveLength(27);
    expect(queen).toEqual(rookAndBishop);
  });

  it('is blocked by pieces like the rook and bishop', () => {
    const position = boardWith({ d1: 'white-queen', d2: 'white-pawn', c2: 'white-pawn', e2: 'black-pawn', c1: 'white-bishop' });
    expect(toSquares(getQueenMoves({ position, figure: 'white-queen', ...at('d1') }))).toEqual(['e1', 'e2', 'f1', 'g1', 'h1']);
  });
});

describe('getKingMoves', () => {
  it('steps one square in every direction', () => {
    const position = boardWith({ e4: 'white-king' });
    expect(toSquares(getKingMoves({ position, figure: 'white-king', ...at('e4') })))
      .toEqual(['d3', 'd4', 'd5', 'e3', 'e5', 'f3', 'f4', 'f5']);
  });

  it('stays on the board and avoids own pieces', () => {
    const position = boardWith({ a1: 'white-king', a2: 'white-pawn', b2: 'black-pawn' });
    expect(toSquares(getKingMoves({ position, figure: 'white-king', ...at('a1') }))).toEqual(['b1', 'b2']);
  });
});

describe('linear pieces in the initial position', () => {
  it('have no moves because they cannot pass through their own pieces', () => {
    const position = createPosition();
    expect(getRookMoves({ position, figure: 'white-rook', ...at('a1') })).toEqual([]);
    expect(getBishopMoves({ position, figure: 'white-bishop', ...at('c1') })).toEqual([]);
    expect(getQueenMoves({ position, figure: 'white-queen', ...at('d1') })).toEqual([]);
    expect(getRookMoves({ position, figure: 'black-rook', ...at('h8') })).toEqual([]);
  });
});

describe('getCastlingMoves', () => {
  const whiteHome = { e1: 'white-king', a1: 'white-rook', h1: 'white-rook', e8: 'black-king' };
  const blackHome = { e8: 'black-king', a8: 'black-rook', h8: 'black-rook', e1: 'white-king' };
  const whiteKing = (position, castleDirection) =>
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
    const withoutKingsideRook = { e1: 'white-king', a1: 'white-rook', e8: 'black-king' };
    const withoutQueensideRook = { e1: 'white-king', h1: 'white-rook', e8: 'black-king' };
    const blackWithoutQueensideRook = { e8: 'black-king', h8: 'black-rook', e1: 'white-king' };

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
  const homeRank = (colour, rank) => ({ [`e${rank}`]: `${colour}-king`, [`a${rank}`]: `${colour}-rook`, [`h${rank}`]: `${colour}-rook` });

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

describe('getKingPosition / getFigures', () => {
  it('finds each king in the initial position', () => {
    const position = createPosition();
    expect(getKingPosition(position, 'white')).toEqual(sq('e1'));
    expect(getKingPosition(position, 'black')).toEqual(sq('e8'));
  });

  it('lists all figures of one colour with their coordinates', () => {
    const position = boardWith({ e1: 'white-king', d4: 'white-knight', e8: 'black-king' });
    expect(getFigures(position, 'white')).toEqual([
      { figure: 'white-king', axisY: 0, axisX: 4 },
      { figure: 'white-knight', axisY: 3, axisX: 3 }
    ]);
    expect(getFigures(createPosition(), 'black')).toHaveLength(16);
  });
});
