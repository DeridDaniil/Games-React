import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkWinner, getAIMove, getWinCombinations, getWinLength } from './tictactoeAI';
import type { Cell, Difficulty, Mark } from '../model/types';

// Builds a flat board from rows, e.g. board('XX.', '.O.', '...'); '.' is an empty cell.
const toCell = (char: string): Cell => (char === 'X' || char === 'O' ? char : ' ');
const board = (...rows: string[]) => rows.join('').split('').map(toCell);
const emptyBoard = (size: number) => Array<Cell>(size * size).fill(' ');

// The computer's move on a board that still has room for one.
const aiMove = (...args: Parameters<typeof getAIMove>) => {
  const move = getAIMove(...args);
  if (move === null) throw new Error('Expected the computer to find a move');
  return move;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getWinLength', () => {
  it('needs 3 in a row on 3x3 and 4 in a row on 5x5 and 7x7', () => {
    expect(getWinLength(3)).toBe(3);
    expect(getWinLength(5)).toBe(4);
    expect(getWinLength(7)).toBe(4);
  });

  it('falls back to the board size for unknown sizes', () => {
    expect(getWinLength(4)).toBe(4);
  });
});

describe('getWinCombinations', () => {
  it('lists the 8 lines of a 3x3 board', () => {
    const combos = getWinCombinations(3);

    expect(combos).toHaveLength(8);
    expect(combos).toContainEqual([0, 1, 2]);
    expect(combos).toContainEqual([0, 3, 6]);
    expect(combos).toContainEqual([0, 4, 8]);
    expect(combos).toContainEqual([2, 4, 6]);
  });

  it('lists every 4-cell line on 5x5 and 7x7 boards', () => {
    expect(getWinCombinations(5)).toHaveLength(28);
    expect(getWinCombinations(7)).toHaveLength(88);
  });

  it('only produces lines of the winning length inside the board', () => {
    [3, 5, 7].forEach(size => {
      getWinCombinations(size).forEach(combo => {
        expect(combo).toHaveLength(getWinLength(size));
        combo.forEach(index => expect(index).toBeGreaterThanOrEqual(0));
        combo.forEach(index => expect(index).toBeLessThan(size * size));
      });
    });
  });
});

describe('checkWinner', () => {
  it('returns null for an empty board', () => {
    expect(checkWinner(emptyBoard(3), 3)).toBeNull();
  });

  it('detects rows, columns and both diagonals', () => {
    expect(checkWinner(board('XXX', 'OO.', '...'), 3)).toBe('X');
    expect(checkWinner(board('XO.', 'XO.', '.O.'), 3)).toBe('O');
    expect(checkWinner(board('X.O', '.XO', '..X'), 3)).toBe('X');
    expect(checkWinner(board('X.O', 'XO.', 'O.X'), 3)).toBe('O');
  });

  it('returns null for an unfinished game without a line', () => {
    expect(checkWinner(board('XO.', '.X.', '..O'), 3)).toBeNull();
  });

  it('returns null for a full board without a line (draw)', () => {
    const draw = board('XOX', 'XOO', 'OXX');

    expect(checkWinner(draw, 3)).toBeNull();
    expect(draw).not.toContain(' ');
  });

  it('requires 4 in a row on a 5x5 board', () => {
    const three = emptyBoard(5).map((cell, i) => ([0, 1, 2].includes(i) ? 'X' : cell));
    const four = emptyBoard(5).map((cell, i) => ([1, 2, 3, 4].includes(i) ? 'X' : cell));

    expect(checkWinner(three, 5)).toBeNull();
    expect(checkWinner(four, 5)).toBe('X');
  });

  it('finds a 4-cell anti-diagonal in the middle of a 7x7 board', () => {
    const cells = emptyBoard(7).map((cell, i) => ([12, 18, 24, 30].includes(i) ? 'O' : cell));
    expect(checkWinner(cells, 7)).toBe('O');
  });
});

describe('getAIMove', () => {
  const halfFull = board('X.O', '.X.', 'O..');
  const difficulties: Difficulty[] = ['easy', 'medium', 'unbeatable'];

  it.each(difficulties)('%s never picks an occupied cell', (difficulty) => {
    for (let i = 0; i < 20; i++) {
      const move = aiMove(halfFull, 3, difficulty, 'O', 'X');
      expect(halfFull[move]).toBe(' ');
    }
  });

  it.each(difficulties)('%s does not mutate the board it is given', (difficulty) => {
    const cells = board('X..', '.O.', '..X');
    const snapshot = [...cells];

    getAIMove(cells, 3, difficulty, 'O', 'X');

    expect(cells).toEqual(snapshot);
  });

  it.each(difficulties)('%s returns null when the board is full', (difficulty) => {
    expect(getAIMove(board('XOX', 'XOO', 'OXX'), 3, difficulty, 'O', 'X')).toBeNull();
  });

  describe('easy', () => {
    it('picks a random empty cell', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      expect(getAIMove(halfFull, 3, 'easy', 'O', 'X')).toBe(1);

      vi.spyOn(Math, 'random').mockReturnValue(0.999);
      expect(getAIMove(halfFull, 3, 'easy', 'O', 'X')).toBe(8);
    });

    it('is also used for an unknown difficulty', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      // A value from outside the typed settings, to check the engine's own fallback.
      const unknownDifficulty: string = 'impossible';
      expect(getAIMove(halfFull, 3, unknownDifficulty as Difficulty, 'O', 'X')).toBe(1);
    });
  });

  describe('medium', () => {
    it('completes its own line when it can win', () => {
      expect(getAIMove(board('XX.', 'OO.', 'X..'), 3, 'medium', 'O', 'X')).toBe(5);
    });

    it('blocks the opponent from completing a line', () => {
      expect(getAIMove(board('XX.', '.O.', '...'), 3, 'medium', 'O', 'X')).toBe(2);
    });

    it('prefers winning over blocking', () => {
      expect(getAIMove(board('OO.', 'XX.', '..X'), 3, 'medium', 'O', 'X')).toBe(2);
    });

    it('plays a random empty cell when there is nothing to win or block', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      expect(getAIMove(board('X..', '...', '...'), 3, 'medium', 'O', 'X')).toBe(1);
    });

    it('wins and blocks with 4-in-a-row lines on 5x5', () => {
      const canWin = emptyBoard(5).map((cell, i) => ([0, 1, 2].includes(i) ? 'O' : [10, 11].includes(i) ? 'X' : cell));
      const mustBlock = emptyBoard(5).map((cell, i) => ([0, 5, 10].includes(i) ? 'X' : [12, 13].includes(i) ? 'O' : cell));

      expect(getAIMove(canWin, 5, 'medium', 'O', 'X')).toBe(3);
      expect(getAIMove(mustBlock, 5, 'medium', 'O', 'X')).toBe(15);
    });
  });

  describe('unbeatable', () => {
    it('takes the win when it is the only move that does not lose', () => {
      expect(getAIMove(board('XX.', 'OO.', 'X..'), 3, 'unbeatable', 'O', 'X')).toBe(5);
    });

    it('blocks an immediate threat', () => {
      expect(getAIMove(board('XX.', '.O.', '...'), 3, 'unbeatable', 'O', 'X')).toBe(2);
    });

    it('takes an immediate win over a forced later one', () => {
      // X wins at once on 8 (the diagonal); 3 would also win, but only two plies later.
      const cells = board('XOO', '.X.', '...');

      expect(checkWinner([...cells.slice(0, 8), 'X'], 3)).toBe('X');
      expect(getAIMove(cells, 3, 'unbeatable', 'X', 'O')).toBe(8);
    });

    it('takes an immediate win on a larger board too', () => {
      // O completes four in a row on the top row at once (index 3) instead of playing on.
      const cells = board('OOO..', 'XX...', 'XX...', '.....', '.....');

      expect(getAIMove(cells, 5, 'unbeatable', 'O', 'X')).toBe(3);
    });

    it('never loses a 3x3 game, moving first or second', () => {
      // Counts the games the human wins over every possible sequence of human moves.
      const humanWins = (cells: Cell[], aiMark: Mark, humanMark: Mark, toMove: Mark): number => {
        const winner = checkWinner(cells, 3);
        if (winner) return winner === humanMark ? 1 : 0;
        if (!cells.includes(' ')) return 0;

        if (toMove === aiMark) {
          const next = [...cells];
          next[aiMove(cells, 3, 'unbeatable', aiMark, humanMark)] = aiMark;
          return humanWins(next, aiMark, humanMark, humanMark);
        }

        return cells.reduce((total, cell, i) => {
          if (cell !== ' ') return total;
          const next = [...cells];
          next[i] = humanMark;
          return total + humanWins(next, aiMark, humanMark, aiMark);
        }, 0);
      };

      expect(humanWins(emptyBoard(3), 'O', 'X', 'X')).toBe(0);
      expect(humanWins(emptyBoard(3), 'X', 'O', 'X')).toBe(0);
    }, 30000);

    it('takes its own win in one move on 7x7 rather than blocking', () => {
      // X threatens 17 (third row); O can finish the sixth column at 19 or 47.
      const cells = board('.......', '.......', 'XXX....', '.....O.', '.....O.', '.....O.', '.......');

      expect(getAIMove(cells, 7, 'unbeatable', 'O', 'X')).toBe(19);
    });

    it('blocks a win in one move on 7x7', () => {
      const cells = board('.......', '.......', 'XXX....', '...O...', '..O....', '.......', '.......');

      expect(getAIMove(cells, 7, 'unbeatable', 'O', 'X')).toBe(17);
    });

    it('answers a quiet 7x7 middle game with an empty cell next to the marks', () => {
      const cells = board('.......', '.X..O..', '..O..O.', '....XO.', '.X.OOX.', '.X.X...', '.......');
      const move = aiMove(cells, 7, 'unbeatable', 'X', 'O');
      const [row, col] = [Math.floor(move / 7), move % 7];
      const nearby = [-1, 0, 1].flatMap(dr => [-1, 0, 1].map(dc => [row + dr, col + dc]))
        .filter(([r, c]) => r >= 0 && r < 7 && c >= 0 && c < 7 && (r !== row || c !== col))
        .map(([r, c]) => cells[r * 7 + c]);

      expect(cells[move]).toBe(' ');
      expect(nearby.some(cell => cell !== ' ')).toBe(true);
    });

    it('works out the winning lines of a board size only once', () => {
      expect(getWinCombinations(7)).toBe(getWinCombinations(7));
      expect(getWinCombinations(5)).toBe(getWinCombinations(5));
    });

    it('opens in the centre on larger boards', () => {
      expect(getAIMove(emptyBoard(5), 5, 'unbeatable', 'X', 'O')).toBe(12);
      expect(getAIMove(emptyBoard(7), 7, 'unbeatable', 'X', 'O')).toBe(24);

      const afterCornerReply = emptyBoard(5).map((cell, i) => (i === 0 ? 'X' : cell));
      expect(getAIMove(afterCornerReply, 5, 'unbeatable', 'O', 'X')).toBe(12);
    });
  });
});
