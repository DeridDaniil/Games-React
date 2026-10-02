import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { RotateCcw } from 'lucide-react';
import { useProfile } from '../../profile/model/ProfileContext';
import { useTicTacToeSettings } from './model/TicTacToeSettingsContext';
import { getAIMove, checkWinner } from './lib/tictactoeAI';
import TicTacToeInfo from './ui/Info/TicTacToeInfo';
import TicTacToeSettings from './ui/Settings/TicTacToeSettings';
import GameHeader from '../shared/ui/GameHeader/GameHeader';
import Button from '../../../shared/ui/Button/Button';
import './TicTacToe.scss';

const DIFFICULTY_LABELS = { easy: 'Easy', medium: 'Medium', unbeatable: 'Unbeatable' };
const AI_DELAY_MS = 400;
const ARROW_STEPS = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };

const emptyBoard = (size) => Array(size * size).fill(' ');
const placeMark = (cells, index, mark) => cells.map((cell, i) => (i === index ? mark : cell));

// One game on the given settings. Restart starts a new game in place; new settings remount the
// component (see TicTacToe), so a game never mixes up a board with the size of another.
function TicTacToeGame({ settings }) {
  const { mode, difficulty, boardSize, playerSide } = settings;
  const [game, setGame] = useState(() => ({ id: 0, cells: emptyBoard(boardSize) }));
  const [activeCell, setActiveCell] = useState(0);
  const { recordResult } = useProfile();
  const recordedGameRef = useRef(null);
  const cellRefs = useRef([]);

  const { id: gameId, cells } = game;
  // X always moves first, so the number of marks on the board says whose turn it is.
  const marksPlaced = cells.filter(cell => cell !== ' ').length;
  const currentMark = marksPlaced % 2 === 0 ? 'X' : 'O';
  const winner = checkWinner(cells, boardSize);
  const isDraw = !winner && marksPlaced === cells.length;
  const isGameEnd = Boolean(winner) || isDraw;

  // In vs computer mode the human plays the chosen side and the computer the other one.
  const humanMark = playerSide;
  const aiMark = playerSide === 'X' ? 'O' : 'X';
  const isAITurn = mode === 'computer' && currentMark === aiMark && !isGameEnd;

  // Each finished game is recorded once; friend mode keeps the stats from X's side (current behaviour).
  useEffect(() => {
    if (!isGameEnd || recordedGameRef.current === gameId) return;
    recordedGameRef.current = gameId;

    if (isDraw) {
      recordResult('tictactoe', 'draws');
    } else if (mode === 'computer') {
      recordResult('tictactoe', winner === humanMark ? 'wins' : 'losses');
    } else {
      recordResult('tictactoe', winner === 'X' ? 'wins' : 'losses');
    }
  }, [isGameEnd, isDraw, winner, gameId, mode, humanMark, recordResult]);

  // The computer answers after a short pause. A move, a restart or leaving the page cancels the
  // pending answer, and a new one is scheduled only while it is still the computer's turn.
  useEffect(() => {
    if (!isAITurn) return undefined;

    const timer = setTimeout(() => {
      const move = getAIMove(cells, boardSize, difficulty, aiMark, humanMark);
      if (move === null) return;
      setGame(prev => (prev.id === gameId ? { ...prev, cells: placeMark(prev.cells, move, aiMark) } : prev));
    }, AI_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isAITurn, gameId, cells, boardSize, difficulty, aiMark, humanMark]);

  const restartGame = () => {
    setGame(prev => ({ id: prev.id + 1, cells: emptyBoard(boardSize) }));
  };

  const playCell = (index) => {
    if (isGameEnd || isAITurn || cells[index] !== ' ') return;
    setGame(prev => ({ ...prev, cells: placeMark(prev.cells, index, currentMark) }));
  };

  // Roving focus: only one cell is a Tab stop, the arrow keys move between cells (not past the edges).
  const moveFocus = (event, index) => {
    const step = ARROW_STEPS[event.key];
    if (!step || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();

    const row = Math.floor(index / boardSize) + step[0];
    const column = (index % boardSize) + step[1];
    if (row < 0 || row >= boardSize || column < 0 || column >= boardSize) return;

    const next = row * boardSize + column;
    setActiveCell(next);
    cellRefs.current[next]?.focus();
  };

  const tabStop = activeCell < cells.length ? activeCell : 0;

  let statusText;
  if (isGameEnd) {
    statusText = 'Game Over';
  } else if (isAITurn) {
    statusText = 'Computer is thinking...';
  } else if (mode === 'computer') {
    statusText = `Your Move — ${humanMark}`;
  } else {
    statusText = `Player's Move — ${currentMark}`;
  }

  const result = winner ? `Winner — ${winner}` : 'Draw';

  // Cells that cannot take a mark right now stay focusable but are announced as unavailable;
  // playCell ignores them anyway.
  const isLocked = isGameEnd || isAITurn;
  const cellLabel = (index, mark) =>
    `Row ${Math.floor(index / boardSize) + 1} column ${(index % boardSize) + 1}, ${mark || 'empty'}`;

  return (
    <div className="tictactoe__play" style={{ '--ttt-size': boardSize }}>
      <h2 className="tictactoe__status" aria-live="polite">{statusText}</h2>
      <div className="tictactoe__board" role="group" aria-label="Board">
        {cells.map((value, i) => {
          const mark = value === ' ' ? '' : value;
          return (
            <button
              key={i}
              ref={(node) => { cellRefs.current[i] = node; }}
              type="button"
              className={mark ? `cell cell--${mark.toLowerCase()}` : 'cell'}
              tabIndex={i === tabStop ? 0 : -1}
              aria-label={cellLabel(i, mark)}
              aria-disabled={mark || isLocked ? 'true' : undefined}
              onClick={() => playCell(i)}
              onFocus={() => setActiveCell(i)}
              onKeyDown={(event) => moveFocus(event, i)}
            >
              {mark}
            </button>
          );
        })}
      </div>
      <div className="tictactoe__footer">
        {/* Always mounted, so screen readers announce the result when it appears. */}
        <p className="tictactoe__result" role="status">
          {isGameEnd && <span className="tictactoe__result-text">{result}</span>}
        </p>
        <Button className="tictactoe__restart" icon={<RotateCcw />} onClick={restartGame}>Restart</Button>
      </div>
    </div>
  );
}

TicTacToeGame.propTypes = {
  settings: PropTypes.shape({
    mode: PropTypes.oneOf(['friend', 'computer']).isRequired,
    difficulty: PropTypes.oneOf(['easy', 'medium', 'unbeatable']).isRequired,
    boardSize: PropTypes.oneOf([3, 5, 7]).isRequired,
    playerSide: PropTypes.oneOf(['X', 'O']).isRequired
  }).isRequired
};

function TicTacToe() {
  const { settings, settingsVersion } = useTicTacToeSettings();
  const { mode, difficulty, boardSize } = settings;

  const context = mode === 'computer'
    ? `vs Computer · ${DIFFICULTY_LABELS[difficulty]} · ${boardSize}×${boardSize}`
    : `vs Friend · ${boardSize}×${boardSize}`;

  return (
    <div className="tictactoe">
      <GameHeader
        title="Tic Tac Toe"
        context={context}
        info={<TicTacToeInfo />}
        settings={<TicTacToeSettings />}
      />
      <TicTacToeGame key={settingsVersion} settings={settings} />
    </div>
  );
}

export default TicTacToe;
