import { useEffect, useRef } from 'react';
import { useChessContext } from '../../../model/Context';
import { Status } from '../../../model/types';
import type { ChessStatus } from '../../../model/types';
import { markResultRecorded, setupNewGame } from '../../../model/actions/game';
import { useProfile } from '../../../../../profile/model/ProfileContext';
import Button from '../../../../../../shared/ui/Button/Button';
import './GameEnds.scss';

const GameEnds = () => {
  const { chessState: { status, resultRecorded }, dispatch } = useChessContext();
  const { recordResult } = useProfile();
  const recordedRef = useRef<ChessStatus | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const isGameOver = status !== Status.ongoing && status !== Status.promoting;
  const lowerStatus = isGameOver ? status.toLowerCase() : '';
  const isWin = lowerStatus.includes('wins');
  const isWhiteWin = isGameOver && status.startsWith('White');

  // One result per game: the ref covers StrictMode's repeated effect, `resultRecorded` in the game
  // state covers a game that Take Back resumed after it had ended (this overlay unmounts meanwhile).
  useEffect(() => {
    if (!isGameOver || resultRecorded || recordedRef.current === status) return;
    recordedRef.current = status;

    if (!isWin) {
      recordResult('chess', 'draws');
    } else if (isWhiteWin) {
      recordResult('chess', 'wins');
    } else {
      recordResult('chess', 'losses');
    }
    dispatch(markResultRecorded());
  }, [isGameOver, status, isWin, isWhiteWin, resultRecorded, recordResult, dispatch]);

  // When the game ends, focus moves to New Game (its only button), unless an open dialog holds it.
  useEffect(() => {
    if (!isGameOver || document.activeElement?.closest('[role="dialog"]')) return;
    panelRef.current?.querySelector('button')?.focus();
  }, [isGameOver]);

  if (!isGameOver) return null;

  const newGame = () => {
    recordedRef.current = null;
    dispatch(setupNewGame());
  }

  return (
    <div className="game_ends">
      <div ref={panelRef} className="game_ends--inner">
        {isWin ? (
          <div className={`wins ${isWhiteWin ? 'White' : 'Black'}`}></div>
        ) : (
          <div className="draws"></div>
        )}
        <div className="game_ends--text" role="alert">
          <h2>{isWin ? status : 'Draw'}</h2>
          <p>{!isWin && status}</p>
        </div>
        <Button variant="primary" onClick={newGame}>New Game</Button>
      </div>
    </div>
  )
}

export default GameEnds;
