import { useState, useEffect, useRef, useCallback } from 'react';
import { useProfile } from '../../profile/ProfileContext';
import { useTicTacToeSettings } from './context/TicTacToeSettingsContext';
import { getAIMove, checkWinner } from './engine/tictactoeAI';
import './TicTacToe.scss';

function TicTacToe() {
  const { settings, settingsVersion } = useTicTacToeSettings();
  const { mode, difficulty, boardSize, playerSide } = settings;
  const totalCells = boardSize * boardSize;

  const [cells, setCells] = useState(() => Array(totalCells).fill(' '));
  const [step, setStep] = useState(0);
  const [isgameEnd, setIsGameEnd] = useState(false);
  const [gameEnd, setGameEnd] = useState('');
  const [aiThinking, setAiThinking] = useState(false);

  const { recordResult } = useProfile();
  const recordedRef = useRef(false);
  const aiTimeoutRef = useRef(null);
  const aiPendingRef = useRef(false);

  // Which mark moves on which step
  // X always goes first (step 0, 2, 4...), O goes second (step 1, 3, 5...)
  const currentMark = step % 2 === 0 ? 'X' : 'O';

  // In vs computer mode: determine AI mark and human mark
  const humanMark = playerSide;
  const aiMark = playerSide === 'X' ? 'O' : 'X';

  // Is it AI's turn?
  const isAITurn = mode === 'computer' && currentMark === aiMark && !isgameEnd;

  // Restart game (also triggered on settings change)
  const restartGame = useCallback(() => {
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    setCells(Array(boardSize * boardSize).fill(' '));
    setStep(0);
    setIsGameEnd(false);
    setGameEnd('');
    setAiThinking(false);
    recordedRef.current = false;
  }, [boardSize]);

  // Reset when settings change
  useEffect(() => {
    restartGame();
  }, [settingsVersion, restartGame]);

  // Check game end
  useEffect(() => {
    const winner = checkWinner(cells, boardSize);
    if (winner) {
      setIsGameEnd(true);
      setGameEnd(`Winner — ${winner}`);
      if (!recordedRef.current) {
        recordedRef.current = true;
        if (mode === 'computer') {
          recordResult('tictactoe', winner === humanMark ? 'wins' : 'losses');
        } else {
          recordResult('tictactoe', winner === 'X' ? 'wins' : 'losses');
        }
      }
      return;
    }
    if (!cells.includes(' ')) {
      setIsGameEnd(true);
      setGameEnd('Draw');
      if (!recordedRef.current) {
        recordedRef.current = true;
        recordResult('tictactoe', 'draws');
      }
    }
  }, [cells]);

  // AI move — use ref guard to survive StrictMode double-invoke
  useEffect(() => {
    if (!isAITurn || aiPendingRef.current) return;

    aiPendingRef.current = true;
    setAiThinking(true);

    aiTimeoutRef.current = setTimeout(() => {
      aiPendingRef.current = false;
      setCells(prev => {
        const move = getAIMove(prev, boardSize, difficulty, aiMark, humanMark);
        if (move === null) return prev;
        const next = [...prev];
        next[move] = aiMark;
        return next;
      });
      setStep(s => s + 1);
      setAiThinking(false);
    }, 400);

    return () => {
      clearTimeout(aiTimeoutRef.current);
      if (aiPendingRef.current) {
        aiPendingRef.current = false;
        setAiThinking(false);
      }
    };
  }, [isAITurn, boardSize, difficulty, aiMark, humanMark]);

  const getStep = (cellIndex) => {
    if (isgameEnd) return;
    if (aiThinking) return;
    if (isAITurn) return;
    if (cells[cellIndex] !== ' ') return;

    const newCells = [...cells];
    newCells[cellIndex] = currentMark;
    setStep(step + 1);
    setCells(newCells);
  };

  // Status text
  let statusText;
  if (isgameEnd) {
    statusText = 'Game Over';
  } else if (aiThinking) {
    statusText = 'Computer is thinking...';
  } else if (mode === 'computer') {
    statusText = `Your Move — ${humanMark}`;
  } else {
    statusText = `Player's Move — ${currentMark}`;
  }

  // Determine which cells get border classes for grid lines
  const getCellBorderClass = (index) => {
    const row = Math.floor(index / boardSize);
    const col = index % boardSize;
    const classes = [];
    if (col > 0 && col < boardSize - 1) classes.push('border-lr');
    if (row > 0 && row < boardSize - 1) classes.push('border-tb');
    return classes.join(' ');
  };

  return (
    <div className="tictactoe">
      <h1>Tic Tac Toe</h1>
      <div className="container">
        <h2>{statusText}</h2>
        <div
          className="cells"
          style={{ gridTemplateColumns: `repeat(${boardSize}, min-content)` }}
        >
          {cells.map((value, i) => (
            <div
              key={i}
              className={`cell ${getCellBorderClass(i)} ${boardSize === 5 ? 'cell--md' : ''} ${boardSize === 7 ? 'cell--sm' : ''}`}
              onClick={() => getStep(i)}
            >
              {value === ' ' ? '' : value}
            </div>
          ))}
          {isgameEnd && (
            <div className="gameEnd">{gameEnd}</div>
          )}
        </div>
        <button onClick={restartGame}>
          <span>Restart</span>
        </button>
      </div>
    </div>
  );
}

export default TicTacToe;
