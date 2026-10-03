// Timings of the Unbeatable computer on fixed, representative positions (run with `npm run bench`).
// The quiet positions have no win or threat in one move, so they measure the full search.
import { bench, describe } from 'vitest';
import { getAIMove } from './tictactoeAI';
import type { BoardSize, Cell, Mark } from '../model/types';

// '.' is an empty cell, e.g. board('X..', '.O.', '...').
const board = (...rows: string[]): Cell[] =>
  rows.join('').split('').map(char => (char === 'X' || char === 'O' ? char : ' '));

const OPTIONS = { iterations: 5, time: 0, warmupIterations: 1, warmupTime: 0 };

const positions: { name: string; size: BoardSize; cells: Cell[]; ai: Mark; human: Mark }[] = [
  { name: '3x3 empty board, computer opens', size: 3, cells: board('...', '...', '...'), ai: 'X', human: 'O' },
  { name: '3x3 after a corner opening', size: 3, cells: board('X..', '...', '...'), ai: 'O', human: 'X' },
  { name: '5x5 reply to a centre opening', size: 5, cells: board('.....', '.....', '..X..', '.....', '.....'), ai: 'O', human: 'X' },
  { name: '5x5 quiet middle game', size: 5, cells: board('.....', '.XO..', '..XO.', '.O...', '...X.'), ai: 'X', human: 'O' },
  { name: '5x5 single threat to block', size: 5, cells: board('.....', 'XXX..', '..O..', '...O.', '.....'), ai: 'O', human: 'X' },
  { name: '7x7 reply to a centre opening', size: 7, cells: board('.......', '.......', '.......', '...X...', '.......', '.......', '.......'), ai: 'O', human: 'X' },
  { name: '7x7 quiet middle game', size: 7, cells: board('.......', '.......', '..XO...', '...X...', '..O.O..', '...X...', '.......'), ai: 'O', human: 'X' },
  { name: '7x7 busy middle game', size: 7, cells: board('.......', '.X..O..', '..O..O.', '....XO.', '.X.OOX.', '.X.X...', '.......'), ai: 'X', human: 'O' },
  { name: '7x7 single threat to block', size: 7, cells: board('.......', '.......', 'XXX....', '...O...', '..O....', '.......', '.......'), ai: 'O', human: 'X' }
];

describe('Unbeatable computer move', () => {
  positions.forEach(({ name, size, cells, ai, human }) => {
    bench(name, () => {
      getAIMove(cells, size, 'unbeatable', ai, human);
    }, OPTIONS);
  });
});
