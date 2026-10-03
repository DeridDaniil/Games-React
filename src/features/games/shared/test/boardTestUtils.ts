// Test-only helpers for building 8×8 board positions in algebraic notation (Chess and Checkers).
// Layout matches both engines: position[y][x], where y = rank - 1 and x = file index (a = 0).
import type { Square } from '../model/types';

const FILES = 'abcdefgh';

export const sq = (square: string): Square => {
  const y = Number(square[1]) - 1;
  const x = FILES.indexOf(square[0]);
  if (square.length !== 2 || x < 0 || !(y >= 0 && y <= 7)) throw new Error(`Invalid square: "${square}"`);
  return [y, x];
};

export const at = (square: string) => {
  const [axisY, axisX] = sq(square);
  return { axisY, axisX };
};

export const toSquare = ([y, x]: Square) => `${FILES[x]}${y + 1}`;

export const toSquares = (moves: readonly Square[]) => moves.map(toSquare).sort();

// A board of the given game's cells (pieces or '' for an empty square).
export const emptyBoard = <Piece extends string = never>(): (Piece | '')[][] =>
  Array.from({ length: 8 }, () => Array<Piece | ''>(8).fill(''));

export const boardWith = <Piece extends string>(pieces: Readonly<Record<string, Piece>>) => {
  const position = emptyBoard<Piece>();
  Object.entries(pieces).forEach(([square, piece]) => {
    const [y, x] = sq(square);
    position[y][x] = piece;
  });
  return position;
};

export const pieceAt = <Cell extends string>(position: readonly (readonly Cell[])[], square: string): Cell => {
  const [y, x] = sq(square);
  return position[y][x];
};

// The box of a board `size` pixels wide at the top left corner, for stubbing getBoundingClientRect
// (jsdom does no layout).
export const boardRect = (size: number): DOMRect => ({
  x: 0,
  y: 0,
  width: size,
  height: size,
  top: 0,
  left: 0,
  right: size,
  bottom: size,
  toJSON: () => ({}),
});
