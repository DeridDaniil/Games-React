import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import { RotateCcw } from 'lucide-react';
import { useProfile } from '../../profile/model/ProfileContext';
import { useTicTacToeSettings } from './model/TicTacToeSettingsContext';
import { getAIMove, checkWinner } from './lib/tictactoeAI';
import TicTacToeInfo from './ui/Info/TicTacToeInfo';
import TicTacToeSettings from './ui/Settings/TicTacToeSettings';
import GameHeader from '../shared/ui/GameHeader/GameHeader';
import Button from '../../../shared/ui/Button/Button';
import type { BoardSize, Cell, Difficulty, Mark, TicTacToeSettings as Settings } from './model/types';
import type { ResultType } from '../../profile/model/types';
import './TicTacToe.scss';

const DIFFICULTY_LABELS: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', unbeatable: 'Unbeatable' };
const AI_DELAY_MS = 400;
const ARROW_STEPS: Partial<Record<string, readonly [number, number]>> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1]
};

const emptyBoard = (size: BoardSize): Cell[] => Array<Cell>(size * size).fill(' ');
const placeMark = (cells: readonly Cell[], index: number, mark: Mark) => cells.map((cell, i) => (i === index ? mark : cell));

// The board size handed to the stylesheet as a custom property.
type BoardStyle = CSSProperties & { '--ttt-size': number };

// One game on the given settings. Restart starts a new game in place; new settings remount the
// component (see TicTacToe), so a game never mixes up a board with the size of another.
function TicTacToeGame({ settings }: { settings: Settings }) {
  const { mode, difficulty, boardSize, playerSide } = settings;
  const [game, setGame] = useState(() => ({ id: 0, cells: emptyBoard(boardSize) }));
  const [activeCell, setActiveCell] = useState(0);
  const { recordResult } = useProfile();
  const recordedGameRef = useRef<number | null>(null);
  const [saveError, setSaveError] = useState<{ gameId: number; message: string } | null>(null);
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const { id: gameId, cells } = game;
  // X always moves first, so the number of marks on the board says whose turn it is.
  const marksPlaced = cells.filter(cell => cell !== ' ').length;
  const currentMark: Mark = marksPlaced % 2 === 0 ? 'X' : 'O';
  const winner = checkWinner(cells, boardSize);
  const isDraw = !winner && marksPlaced === cells.length;
  const isGameEnd = Boolean(winner) || isDraw;

  // In vs computer mode the human plays the chosen side and the computer the other one.
  const humanMark = playerSide;
  const aiMark: Mark = playerSide === 'X' ? 'O' : 'X';
  const isAITurn = mode === 'computer' && currentMark === aiMark && !isGameEnd;

  // Each finished game is recorded once; friend mode keeps the stats from X's side (current behaviour).
  // A result the profile could not store is announced until the next game.
  useEffect(() => {
    if (!isGameEnd || recordedGameRef.current === gameId) return;
    recordedGameRef.current = gameId;

    let result: ResultType;
    if (isDraw) {
      result = 'draws';
    } else if (mode === 'computer') {
      result = winner === humanMark ? 'wins' : 'losses';
    } else {
      result = winner === 'X' ? 'wins' : 'losses';
    }
    const saved = recordResult('tictactoe', result);
    if (!saved.ok) setSaveError({ gameId, message: saved.error });
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

  const playCell = (index: number) => {
    if (isGameEnd || isAITurn || cells[index] !== ' ') return;
    setGame(prev => ({ ...prev, cells: placeMark(prev.cells, index, currentMark) }));
  };

  // Roving focus: only one cell is a Tab stop, the arrow keys move between cells (not past the edges).
  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
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
  const cellLabel = (index: number, mark: string) =>
    `Row ${Math.floor(index / boardSize) + 1} column ${(index % boardSize) + 1}, ${mark || 'empty'}`;

  const boardStyle: BoardStyle = { '--ttt-size': boardSize };

  return (
    <div className="tictactoe__play" style={boardStyle}>
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
      {saveError?.gameId === gameId && <p className="tictactoe__save-error" role="alert">{saveError.message}</p>}
    </div>
  );
}

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
