// Types shared by the two board games (Chess and Checkers) and their common UI.

// A side of the board. White moves first in both games.
export type PlayerColor = 'white' | 'black';

// A square of the 8×8 board as [y, x]: y = rank - 1 (0 is White's back rank), x = file (0 is a).
export type Square = readonly [y: number, x: number];

// Both players' clock times in milliseconds.
export interface ClockTimes {
  whiteTime: number;
  blackTime: number;
}
