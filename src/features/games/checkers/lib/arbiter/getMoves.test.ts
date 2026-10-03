import { describe, expect, it } from 'vitest';
import { getCheckerAttack, getCheckerMoves, getQueenMAttack, getQueenMoves } from './getMoves';
import { createPosition } from '../helper';
import { at, boardWith, toSquares } from '../../../shared/test/boardTestUtils';
import type { CheckerPiece, CheckersPosition } from '../../model/types';

type MovesOf = (position: CheckersPosition, square: string, checker: CheckerPiece) => string[];

const checkerMoves: MovesOf = (position, square, checker) => toSquares(getCheckerMoves({ position, checker, ...at(square) }));
const checkerAttack: MovesOf = (position, square, checker) => toSquares(getCheckerAttack({ position, checker, ...at(square) }));
const queenMoves: MovesOf = (position, square, checker) => toSquares(getQueenMoves({ position, checker, ...at(square) }));
const queenAttack: MovesOf = (position, square, checker) => toSquares(getQueenMAttack({ position, checker, ...at(square) }));

describe('getCheckerMoves', () => {
  describe('simple moves', () => {
    it('moves a white checker diagonally forward', () => {
      expect(checkerMoves(boardWith({ c3: 'white-checker' }), 'c3', 'white-checker')).toEqual(['b4', 'd4']);
    });

    it('moves a black checker diagonally towards row 1', () => {
      expect(checkerMoves(boardWith({ f6: 'black-checker' }), 'f6', 'black-checker')).toEqual(['e5', 'g5']);
    });

    it('never moves backwards without a capture', () => {
      expect(checkerMoves(boardWith({ d4: 'white-checker' }), 'd4', 'white-checker')).toEqual(['c5', 'e5']);
      expect(checkerMoves(boardWith({ e5: 'black-checker' }), 'e5', 'black-checker')).toEqual(['d4', 'f4']);
    });

    it('stays on the board at the edge', () => {
      expect(checkerMoves(boardWith({ a3: 'white-checker' }), 'a3', 'white-checker')).toEqual(['b4']);
    });

    it('cannot move onto occupied squares', () => {
      const position = boardWith({ c3: 'white-checker', b4: 'white-checker', d4: 'black-checker', e5: 'black-checker' });
      expect(checkerMoves(position, 'c3', 'white-checker')).toEqual([]);
    });

    it('gives the front-row checkers their opening moves', () => {
      const position = createPosition();
      expect(checkerMoves(position, 'c3', 'white-checker')).toEqual(['b4', 'd4']);
      expect(checkerMoves(position, 'b6', 'black-checker')).toEqual(['a5', 'c5']);
      expect(checkerMoves(position, 'b2', 'white-checker')).toEqual([]);
    });
  });

  describe('captures', () => {
    it('jumps over an adjacent enemy onto the empty square behind it', () => {
      const position = boardWith({ c3: 'white-checker', d4: 'black-checker' });
      expect(checkerMoves(position, 'c3', 'white-checker')).toEqual(['e5']);
    });

    it('returns only captures when a capture is available (capture is mandatory)', () => {
      const position = boardWith({ c3: 'white-checker', d4: 'black-checker' });
      expect(checkerMoves(position, 'c3', 'white-checker')).not.toContain('b4');
    });

    it('lets checkers capture backwards', () => {
      expect(checkerMoves(boardWith({ e5: 'white-checker', d4: 'black-checker' }), 'e5', 'white-checker')).toEqual(['c3']);
      expect(checkerMoves(boardWith({ d4: 'black-checker', e5: 'white-checker' }), 'd4', 'black-checker')).toEqual(['f6']);
    });

    it('cannot capture when the landing square is occupied or off the board', () => {
      expect(checkerMoves(boardWith({ c3: 'white-checker', d4: 'black-checker', e5: 'white-checker' }), 'c3', 'white-checker')).toEqual(['b4']);
      expect(checkerMoves(boardWith({ g5: 'white-checker', h6: 'black-checker' }), 'g5', 'white-checker')).toEqual(['f6']);
    });

    it('cannot jump over its own pieces', () => {
      expect(checkerMoves(boardWith({ c3: 'white-checker', d4: 'white-checker' }), 'c3', 'white-checker')).toEqual(['b4']);
    });

    // KNOWN QUIRK (not fixed in this stage): from the two rows nearest to its own side
    // a checker reports every forward capture twice. The UI only checks membership.
    it('duplicates forward captures from the first two rows (current behaviour)', () => {
      const position = boardWith({ b2: 'white-checker', c3: 'black-checker' });
      expect(getCheckerMoves({ position, checker: 'white-checker', ...at('b2') })).toEqual([[3, 3], [3, 3]]);
      expect(getCheckerAttack({ position, checker: 'white-checker', ...at('b2') })).toEqual([[2, 2], [2, 2]]);
    });
  });
});

describe('getCheckerAttack', () => {
  it('returns the squares of the pieces that would be captured', () => {
    expect(checkerAttack(boardWith({ c3: 'white-checker', d4: 'black-checker' }), 'c3', 'white-checker')).toEqual(['d4']);
  });

  it('reports every capturable neighbour, forwards and backwards', () => {
    const position = boardWith({ e5: 'white-checker', d6: 'black-checker', f6: 'black-checker', d4: 'black-checker' });
    expect(checkerAttack(position, 'e5', 'white-checker')).toEqual(['d4', 'd6', 'f6']);
  });

  it('is empty when nothing can be captured', () => {
    expect(checkerAttack(createPosition(), 'c3', 'white-checker')).toEqual([]);
  });
});

describe('getQueenMoves', () => {
  it('slides any distance along the diagonals', () => {
    expect(queenMoves(boardWith({ d4: 'white-queen' }), 'd4', 'white-queen')).toEqual([
      'a1', 'a7', 'b2', 'b6', 'c3', 'c5', 'e3', 'e5', 'f2', 'f6', 'g1', 'g7', 'h8'
    ]);
  });

  it('stops before its own pieces', () => {
    const moves = queenMoves(boardWith({ d4: 'white-queen', f6: 'white-checker' }), 'd4', 'white-queen');
    expect(moves).toContain('e5');
    expect(moves).not.toContain('f6');
    expect(moves).not.toContain('h8');
  });

  it('stops before an enemy that cannot be captured', () => {
    const moves = queenMoves(boardWith({ d4: 'white-queen', f6: 'black-checker', g7: 'black-checker' }), 'd4', 'white-queen');
    expect(moves).toContain('e5');
    expect(moves).not.toContain('f6');
    expect(moves).not.toContain('g7');
  });

  it('captures an enemy from a distance and returns only capture landings', () => {
    expect(queenMoves(boardWith({ a1: 'white-queen', d4: 'black-checker' }), 'a1', 'white-queen')).toEqual(['e5']);
  });

  // ENGINE LIMITATION (not changed in this stage): a flying king may only land on the
  // square directly behind the captured piece, even when further squares are empty.
  it('lands only directly behind the captured piece (current behaviour)', () => {
    const position = boardWith({ a1: 'white-queen', c3: 'black-checker' });
    expect(queenMoves(position, 'a1', 'white-queen')).toEqual(['d4']);
  });

  it('cannot capture through its own piece', () => {
    const position = boardWith({ c3: 'white-queen', d4: 'white-checker', e5: 'black-checker' });
    expect(queenMoves(position, 'c3', 'white-queen')).toEqual(['a1', 'a5', 'b2', 'b4', 'd2', 'e1']);
  });

  it('does not throw when the first enemy on a diagonal stands on the last row', () => {
    const towardsRow8 = boardWith({ c5: 'white-queen', f8: 'black-checker' });
    const towardsRow1 = boardWith({ d4: 'black-queen', a1: 'white-checker' });

    expect(queenMoves(towardsRow8, 'c5', 'white-queen')).toEqual(['a3', 'a7', 'b4', 'b6', 'd4', 'd6', 'e3', 'e7', 'f2', 'g1']);
    expect(queenMoves(towardsRow1, 'd4', 'black-queen')).toEqual(['b2', 'c3', 'c5', 'b6', 'a7', 'e3', 'f2', 'g1', 'e5', 'f6', 'g7', 'h8'].sort());
  });
});

describe('getQueenMAttack', () => {
  it('returns the square of the piece a queen would capture', () => {
    expect(queenAttack(boardWith({ a1: 'white-queen', d4: 'black-checker' }), 'a1', 'white-queen')).toEqual(['d4']);
  });

  it('ignores enemies hidden behind its own piece', () => {
    expect(queenAttack(boardWith({ c3: 'white-queen', d4: 'white-checker', e5: 'black-checker' }), 'c3', 'white-queen')).toEqual([]);
  });

  it('does not throw for an enemy on the edge row', () => {
    expect(queenAttack(boardWith({ c5: 'white-queen', f8: 'black-checker' }), 'c5', 'white-queen')).toEqual([]);
  });
});
