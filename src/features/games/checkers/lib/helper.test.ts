import { describe, expect, it } from 'vitest';
import { createPosition } from './helper';
import type { CheckerPiece, CheckersPosition } from '../model/types';

const squaresOf = (position: CheckersPosition, checker: CheckerPiece) => position.flatMap((row, y) =>
  row.flatMap((cell, x) => (cell === checker ? [[y, x]] : [])));

describe('createPosition', () => {
  it('places 12 checkers per side on the dark squares of their first three rows', () => {
    const position = createPosition();
    const white = squaresOf(position, 'white-checker');
    const black = squaresOf(position, 'black-checker');

    expect(white).toHaveLength(12);
    expect(black).toHaveLength(12);
    white.forEach(([y, x]) => {
      expect(y).toBeLessThanOrEqual(2);
      expect((y + x) % 2).toBe(0);
    });
    black.forEach(([y, x]) => {
      expect(y).toBeGreaterThanOrEqual(5);
      expect((y + x) % 2).toBe(0);
    });
  });

  it('leaves the two middle rows empty and starts without queens', () => {
    const position = createPosition();

    expect(position[3]).toEqual(Array(8).fill(''));
    expect(position[4]).toEqual(Array(8).fill(''));
    expect(position.flat().some(cell => cell.endsWith('queen'))).toBe(false);
  });

  it('returns an independent board on every call', () => {
    const first = createPosition();
    first[0][0] = '';

    expect(createPosition()[0][0]).toBe('white-checker');
    expect(first[3]).not.toBe(first[4]);
  });
});
