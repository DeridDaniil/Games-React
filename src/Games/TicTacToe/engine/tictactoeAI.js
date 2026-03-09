/**
 * TicTacToe AI module
 * Supports 3x3 (win=3), 5x5 (win=3), 7x7 (win=4)
 */

const WIN_LENGTH = { 3: 3, 5: 4, 7: 4 };

export function getWinLength(size) {
  return WIN_LENGTH[size] ?? size;
}

/**
 * Generate all winning combinations for a board of given size.
 * A combination is an array of `winLen` cell indices forming a line.
 */
function getWinCombinations(size) {
  const winLen = getWinLength(size);
  const combos = [];

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

function checkWinner(cells, size) {
  const combos = getWinCombinations(size);
  for (const combo of combos) {
    const first = cells[combo[0]];
    if (first === ' ') continue;
    if (combo.every(idx => cells[idx] === first)) return first;
  }
  return null;
}

function getEmptyCells(cells) {
  const empty = [];
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] === ' ') empty.push(i);
  }
  return empty;
}

// ========== EASY: random move ==========
function easyMove(cells) {
  const empty = getEmptyCells(cells);
  if (empty.length === 0) return null;
  return empty[Math.floor(Math.random() * empty.length)];
}

// ========== MEDIUM: check win/block, else random ==========
function mediumMove(cells, size, aiMark, humanMark) {
  const combos = getWinCombinations(size);
  const winLen = getWinLength(size);

  // 1. Can AI win?
  for (const combo of combos) {
    const marks = combo.map(i => cells[i]);
    const aiCount = marks.filter(m => m === aiMark).length;
    const emptyCount = marks.filter(m => m === ' ').length;
    if (aiCount === winLen - 1 && emptyCount === 1) {
      return combo.find(i => cells[i] === ' ');
    }
  }

  // 2. Must block human?
  for (const combo of combos) {
    const marks = combo.map(i => cells[i]);
    const humanCount = marks.filter(m => m === humanMark).length;
    const emptyCount = marks.filter(m => m === ' ').length;
    if (humanCount === winLen - 1 && emptyCount === 1) {
      return combo.find(i => cells[i] === ' ');
    }
  }

  // 3. Random
  return easyMove(cells);
}

// ========== UNBEATABLE: minimax with alpha-beta ==========
const MAX_DEPTH = { 3: Infinity, 5: 4, 7: 4 };

function minimax(cells, size, depth, isMaximizing, aiMark, humanMark, alpha, beta, maxDepth) {
  const winner = checkWinner(cells, size);
  if (winner === aiMark) return 10 + depth;
  if (winner === humanMark) return -10 - depth;
  const empty = getEmptyCells(cells);
  if (empty.length === 0 || depth >= maxDepth) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (const idx of empty) {
      cells[idx] = aiMark;
      const score = minimax(cells, size, depth + 1, false, aiMark, humanMark, alpha, beta, maxDepth);
      cells[idx] = ' ';
      best = Math.max(best, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const idx of empty) {
      cells[idx] = humanMark;
      const score = minimax(cells, size, depth + 1, true, aiMark, humanMark, alpha, beta, maxDepth);
      cells[idx] = ' ';
      best = Math.min(best, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return best;
  }
}

function unbeatableMove(cells, size, aiMark, humanMark) {
  const empty = getEmptyCells(cells);
  if (empty.length === 0) return null;

  const maxDepth = MAX_DEPTH[size] ?? 4;
  let bestScore = -Infinity;
  let bestMove = empty[0];

  // For larger boards with many empty cells, start with center
  if (size > 3 && empty.length >= size * size - 1) {
    const center = Math.floor(size * size / 2);
    if (cells[center] === ' ') return center;
  }

  for (const idx of empty) {
    cells[idx] = aiMark;
    const score = minimax(cells, size, 0, false, aiMark, humanMark, -Infinity, Infinity, maxDepth);
    cells[idx] = ' ';
    if (score > bestScore) {
      bestScore = score;
      bestMove = idx;
    }
  }
  return bestMove;
}

// ========== Main export ==========
export function getAIMove(cells, size, difficulty, aiMark, humanMark) {
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
