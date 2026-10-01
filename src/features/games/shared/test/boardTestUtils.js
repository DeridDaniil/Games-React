// Test-only helpers for building 8×8 board positions in algebraic notation (Chess and Checkers).
// Layout matches both engines: position[y][x], where y = rank - 1 and x = file index (a = 0).

const FILES = 'abcdefgh';

export const sq = (square) => {
  const y = Number(square[1]) - 1;
  const x = FILES.indexOf(square[0]);
  if (square.length !== 2 || x < 0 || !(y >= 0 && y <= 7)) throw new Error(`Invalid square: "${square}"`);
  return [y, x];
};

export const at = (square) => {
  const [axisY, axisX] = sq(square);
  return { axisY, axisX };
};

export const toSquare = ([y, x]) => `${FILES[x]}${y + 1}`;

export const toSquares = (moves) => moves.map(toSquare).sort();

export const emptyBoard = () => Array.from({ length: 8 }, () => Array(8).fill(''));

export const boardWith = (pieces) => {
  const position = emptyBoard();
  Object.entries(pieces).forEach(([square, piece]) => {
    const [y, x] = sq(square);
    position[y][x] = piece;
  });
  return position;
};

export const pieceAt = (position, square) => {
  const [y, x] = sq(square);
  return position[y][x];
};
