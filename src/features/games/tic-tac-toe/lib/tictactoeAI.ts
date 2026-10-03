/**
 * TicTacToe AI module
 * Supports 3x3 (win=3), 5x5 (win=4), 7x7 (win=4)
 */
import type { BoardSize, Cell, Difficulty, Mark } from '../model/types';

const WIN_LENGTH: Partial<Record<number, number>> = { 3: 3, 5: 4, 7: 4 };

// The line length that wins on a board of this size; a size without a rule of its own needs a full row.
export function getWinLength(size: number): number {
  return WIN_LENGTH[size] ?? size;
}

type Line = readonly number[];

// What the computer needs to know about a board size, worked out once per size: the winning lines,
// the lines through each cell, each cell's neighbours, and the cells from the centre outwards.
interface BoardGeometry {
  lines: readonly Line[];
  linesThrough: readonly (readonly Line[])[];
  neighbours: readonly (readonly number[])[];
  centreFirst: readonly number[];
}

const geometries = new Map<number, BoardGeometry>();

function geometryOf(size: number): BoardGeometry {
  const known = geometries.get(size);
  if (known) return known;

  const lines = buildLines(size);
  const cellCount = size * size;
  const linesThrough: Line[][] = Array.from({ length: cellCount }, () => []);
  lines.forEach(line => line.forEach(cell => linesThrough[cell].push(line)));

  const rowOf = (cell: number) => Math.floor(cell / size);
  const colOf = (cell: number) => cell % size;
  const neighbours = Array.from({ length: cellCount }, (_, cell) => {
    const around: number[] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = rowOf(cell) + dr;
        const c = colOf(cell) + dc;
        if ((dr !== 0 || dc !== 0) && r >= 0 && r < size && c >= 0 && c < size) around.push(r * size + c);
      }
    }
    return around;
  });

  const centre = (size - 1) / 2;
  const ring = (cell: number) => Math.max(Math.abs(rowOf(cell) - centre), Math.abs(colOf(cell) - centre));
  const centreFirst = Array.from({ length: cellCount }, (_, cell) => cell).sort((a, b) => ring(a) - ring(b) || a - b);

  const geometry = { lines, linesThrough, neighbours, centreFirst };
  geometries.set(size, geometry);
  return geometry;
}

/**
 * All winning combinations for a board of given size, built once per size.
 * A combination is an array of `winLen` cell indices forming a line.
 */
function getWinCombinations(size: number): readonly Line[] {
  return geometryOf(size).lines;
}

function buildLines(size: number): number[][] {
  const winLen = getWinLength(size);
  const combos: number[][] = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Horizontal →
      if (c + winLen <= size) {
        const combo = [];
        for (let k = 0; k < winLen; k++) combo.push(r * size + (c + k));
        combos.push(combo);
      }
      // Vertical ↓
      if (r + winLen <= size) {
        const combo = [];
        for (let k = 0; k < winLen; k++) combo.push((r + k) * size + c);
        combos.push(combo);
      }
      // Diagonal ↘
      if (r + winLen <= size && c + winLen <= size) {
        const combo = [];
        for (let k = 0; k < winLen; k++) combo.push((r + k) * size + (c + k));
        combos.push(combo);
      }
      // Diagonal ↙
      if (r + winLen <= size && c - winLen + 1 >= 0) {
        const combo = [];
        for (let k = 0; k < winLen; k++) combo.push((r + k) * size + (c - k));
        combos.push(combo);
      }
    }
  }
  return combos;
}

function checkWinner(cells: readonly Cell[], size: number): Mark | null {
  const combos = getWinCombinations(size);
  for (const combo of combos) {
    const first = cells[combo[0]];
    if (first === ' ') continue;
    if (combo.every(idx => cells[idx] === first)) return first;
  }
  return null;
}

// Whether the mark just played on `cell` completes a line; only the lines through that cell can.
function completesLine(cells: readonly Cell[], geometry: BoardGeometry, cell: number): boolean {
  const mark = cells[cell];
  return geometry.linesThrough[cell].some(line => line.every(idx => cells[idx] === mark));
}

function getEmptyCells(cells: readonly Cell[]): number[] {
  const empty = [];
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] === ' ') empty.push(i);
  }
  return empty;
}

// ========== EASY: random move ==========
function easyMove(cells: readonly Cell[]): number | null {
  const empty = getEmptyCells(cells);
  if (empty.length === 0) return null;
  return empty[Math.floor(Math.random() * empty.length)];
}

// ========== MEDIUM: check win/block, else random ==========
function mediumMove(cells: readonly Cell[], size: BoardSize, aiMark: Mark, humanMark: Mark): number | null {
  const combos = getWinCombinations(size);
  const winLen = getWinLength(size);

  // 1. Can AI win?
  for (const combo of combos) {
    const marks = combo.map(i => cells[i]);
    const aiCount = marks.filter(m => m === aiMark).length;
    const emptyCount = marks.filter(m => m === ' ').length;
    if (aiCount === winLen - 1 && emptyCount === 1) {
      // The one empty cell of the line.
      return combo.find(i => cells[i] === ' ') ?? null;
    }
  }

  // 2. Must block human?
  for (const combo of combos) {
    const marks = combo.map(i => cells[i]);
    const humanCount = marks.filter(m => m === humanMark).length;
    const emptyCount = marks.filter(m => m === ' ').length;
    if (humanCount === winLen - 1 && emptyCount === 1) {
      return combo.find(i => cells[i] === ' ') ?? null;
    }
  }

  // 3. Random
  return easyMove(cells);
}

// ========== UNBEATABLE: minimax with alpha-beta ==========
// 3x3 is searched to the end (exact play). Larger boards are searched four plies deep, so there the
// computer plays the strongest move it can see, not a proven one.
const MAX_DEPTH: Partial<Record<number, number>> = { 3: Infinity, 5: 4, 7: 4 };

interface Search {
  cells: Cell[];
  geometry: BoardGeometry;
  aiMark: Mark;
  humanMark: Mark;
  maxDepth: number;
  // The moves tried in a position (see unbeatableMove).
  moves: (cells: readonly Cell[]) => readonly number[];
}

// The score of the position `depth` plies after the computer's move, with the computer to play when
// `isMaximizing`. A win is worth more the sooner it comes, a loss costs less the later it comes; at
// the depth limit a position counts as even.
function minimax(search: Search, depth: number, isMaximizing: boolean, alpha: number, beta: number): number {
  const { cells, geometry, aiMark, humanMark, maxDepth } = search;
  const moves = search.moves(cells);
  if (moves.length === 0 || depth >= maxDepth) return 0;

  const mark = isMaximizing ? aiMark : humanMark;
  let best = isMaximizing ? -Infinity : Infinity;
  for (const idx of moves) {
    cells[idx] = mark;
    let score: number;
    if (completesLine(cells, geometry, idx)) score = isMaximizing ? 10 - (depth + 1) : (depth + 1) - 10;
    else score = minimax(search, depth + 1, !isMaximizing, alpha, beta);
    cells[idx] = ' ';

    if (isMaximizing) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, score);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, score);
    }
    if (beta <= alpha) break;
  }
  return best;
}

// The empty cells next to a mark, centre first: on 5x5 and 7x7 a move far from every mark cannot
// win, block or build anything within the search depth, so it is not tried.
const movesNearMarks = (geometry: BoardGeometry) => (cells: readonly Cell[]): number[] =>
  geometry.centreFirst.filter(cell => cells[cell] === ' ' && geometry.neighbours[cell].some(next => cells[next] !== ' '));

function unbeatableMove(cells: Cell[], size: BoardSize, aiMark: Mark, humanMark: Mark): number | null {
  const empty = getEmptyCells(cells);
  if (empty.length === 0) return null;
  const geometry = geometryOf(size);
  const isLargeBoard = size > 3;

  if (isLargeBoard) {
    // The opening move goes to the centre.
    if (empty.length >= size * size - 1) {
      const center = Math.floor(size * size / 2);
      if (cells[center] === ' ') return center;
    }

    // A win in one move is taken; failing that, the opponent's win in one move is blocked.
    const winningCell = (mark: Mark) => empty.find(idx => {
      cells[idx] = mark;
      const wins = completesLine(cells, geometry, idx);
      cells[idx] = ' ';
      return wins;
    });
    const urgent = winningCell(aiMark) ?? winningCell(humanMark);
    if (urgent !== undefined) return urgent;
  }

  // 3x3 tries every empty cell in order, as exact minimax; larger boards only the cells near a mark.
  const search: Search = {
    cells,
    geometry,
    aiMark,
    humanMark,
    maxDepth: MAX_DEPTH[size] ?? 4,
    moves: isLargeBoard ? movesNearMarks(geometry) : getEmptyCells
  };

  const rootMoves = search.moves(cells);
  let bestScore = -Infinity;
  let bestMove = rootMoves[0];
  for (const idx of rootMoves) {
    cells[idx] = aiMark;
    // On larger boards the best score so far bounds the search of the next moves (it cannot change
    // which move is chosen, only skip work); 3x3 searches every move in full.
    const score = completesLine(cells, geometry, idx)
      ? 10
      : minimax(search, 0, false, isLargeBoard ? bestScore : -Infinity, Infinity);
    cells[idx] = ' ';
    if (score > bestScore) {
      bestScore = score;
      bestMove = idx;
    }
  }
  return bestMove;
}

// ========== Main export ==========
// The cell the computer plays (an index into `cells`), or null when the board is full.
export function getAIMove(
  cells: readonly Cell[],
  size: BoardSize,
  difficulty: Difficulty,
  aiMark: Mark,
  humanMark: Mark
): number | null {
  const cellsCopy = [...cells];

  switch (difficulty) {
    case 'easy':
      return easyMove(cellsCopy);
    case 'medium':
      return mediumMove(cellsCopy, size, aiMark, humanMark);
    case 'unbeatable':
      return unbeatableMove(cellsCopy, size, aiMark, humanMark);
    default:
      return easyMove(cellsCopy);
  }
}

export { getWinCombinations, checkWinner };
