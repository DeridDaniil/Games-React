import { describe, expect, it } from 'vitest';
import arbiter from './arbiter';
import { createPosition } from '../helper';
import { Status } from '../../model/types';
import { at, boardWith, sq, toSquares } from '../../../shared/test/boardTestUtils';

describe('arbiter.getRegularMoves / getAttackingMoves', () => {
  it('uses checker rules for checkers', () => {
    const position = boardWith({ c3: 'white-checker', d4: 'black-checker' });

    expect(toSquares(arbiter.getRegularMoves({ position, checker: 'white-checker', ...at('c3') }))).toEqual(['e5']);
    expect(toSquares(arbiter.getAttackingMoves({ position, checker: 'white-checker', ...at('c3') }))).toEqual(['d4']);
  });

  it('uses flying-king rules for queens', () => {
    const position = boardWith({ a1: 'white-queen', d4: 'black-checker' });

    expect(toSquares(arbiter.getRegularMoves({ position, checker: 'white-queen', ...at('a1') }))).toEqual(['e5']);
    expect(toSquares(arbiter.getAttackingMoves({ position, checker: 'white-queen', ...at('a1') }))).toEqual(['d4']);
  });

  it('lets a freshly promoted queen keep capturing in the same turn', () => {
    // CheckerFigures promotes on landing, then asks for further attacks of the landed piece.
    const position = boardWith({ e8: 'white-queen', c6: 'black-checker' });
    expect(toSquares(arbiter.getAttackingMoves({ position, checker: 'white-queen', ...at('e8') }))).toEqual(['c6']);
  });
});

describe('arbiter.playerHasPieces', () => {
  it('detects whether a player still has pieces on the board', () => {
    const onlyWhite = boardWith({ c3: 'white-checker', h8: 'white-queen' });

    expect(arbiter.playerHasPieces({ position: createPosition(), player: 'white' })).toBe(true);
    expect(arbiter.playerHasPieces({ position: onlyWhite, player: 'white' })).toBe(true);
    expect(arbiter.playerHasPieces({ position: onlyWhite, player: 'black' })).toBe(false);
  });
});

describe('arbiter.playerHasMoves', () => {
  it('is true for both players in the initial position', () => {
    expect(arbiter.playerHasMoves({ position: createPosition(), player: 'white' })).toBe(true);
    expect(arbiter.playerHasMoves({ position: createPosition(), player: 'black' })).toBe(true);
  });

  it('is false when every piece is blocked', () => {
    const blocked = boardWith({ a1: 'white-checker', b2: 'black-checker', c3: 'black-checker' });

    expect(arbiter.playerHasMoves({ position: blocked, player: 'white' })).toBe(false);
    expect(arbiter.playerHasMoves({ position: blocked, player: 'black' })).toBe(true);
  });

  it('counts captures as available moves', () => {
    const position = boardWith({ a1: 'white-checker', b2: 'black-checker' });
    expect(arbiter.playerHasMoves({ position, player: 'white' })).toBe(true);
  });
});

describe('arbiter.getGameResult', () => {
  it('returns null while both players can still play', () => {
    expect(arbiter.getGameResult({ position: createPosition(), currentTurn: 'white' })).toBeNull();
  });

  it('declares the player with pieces left the winner', () => {
    const onlyWhite = boardWith({ c3: 'white-checker' });

    expect(arbiter.getGameResult({ position: onlyWhite, currentTurn: 'black' })).toBe(Status.whiteWins);
    expect(arbiter.getGameResult({ position: onlyWhite, currentTurn: 'white' })).toBe(Status.whiteWins);
  });

  it('declares a loss for the player to move when they have no legal moves', () => {
    const blocked = boardWith({ a1: 'white-checker', b2: 'black-checker', c3: 'black-checker' });

    expect(arbiter.getGameResult({ position: blocked, currentTurn: 'white' })).toBe(Status.blackWins);
    expect(arbiter.getGameResult({ position: blocked, currentTurn: 'black' })).toBeNull();
  });

  it('declares Black the winner when only black pieces are left', () => {
    const onlyBlack = boardWith({ f6: 'black-checker' });

    expect(arbiter.getGameResult({ position: onlyBlack, currentTurn: 'white' })).toBe(Status.blackWins);
    expect(arbiter.getGameResult({ position: onlyBlack, currentTurn: 'black' })).toBe(Status.blackWins);
  });

  it('declares a loss for Black when Black is to move without legal moves', () => {
    const blackBlocked = boardWith({ h8: 'black-checker', g7: 'white-checker', f6: 'white-checker' });

    expect(arbiter.getGameResult({ position: blackBlocked, currentTurn: 'black' })).toBe(Status.whiteWins);
    expect(arbiter.getGameResult({ position: blackBlocked, currentTurn: 'white' })).toBeNull();
  });

  it('never reports a draw (draws are not implemented)', () => {
    const lonelyQueens = boardWith({ a1: 'white-queen', h8: 'black-queen' });
    expect(arbiter.getGameResult({ position: lonelyQueens, currentTurn: 'white' })).toBeNull();
  });
});

describe('arbiter.getPiecesWithCaptures', () => {
  it('is empty when no capture is available', () => {
    expect(arbiter.getPiecesWithCaptures({ position: createPosition(), player: 'white' })).toEqual([]);
  });

  it('lists every piece of the player that is forced to capture', () => {
    const position = boardWith({
      c3: 'white-checker',
      d4: 'black-checker',
      g3: 'white-checker',
      a1: 'white-queen',
      c5: 'black-checker'
    });

    expect(toSquares(arbiter.getPiecesWithCaptures({ position, player: 'white' }))).toEqual(['c3']);
    expect(toSquares(arbiter.getPiecesWithCaptures({ position, player: 'black' }))).toEqual(['d4']);
  });

  it('includes queens that can capture', () => {
    const position = boardWith({ a1: 'white-queen', d4: 'black-checker' });
    expect(arbiter.getPiecesWithCaptures({ position, player: 'white' })).toEqual([sq('a1')]);
  });

  it('does not throw for queens facing an enemy on the edge row', () => {
    const position = boardWith({ c5: 'white-queen', f8: 'black-checker' });
    expect(arbiter.getPiecesWithCaptures({ position, player: 'white' })).toEqual([]);
  });
});
