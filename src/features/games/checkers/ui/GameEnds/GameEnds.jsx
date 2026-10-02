import { useEffect, useRef } from 'react';
import { useCheckersContext } from '../../model/Context';
import { Status } from '../../model/types';
import { markResultRecorded, setupNewGame } from '../../model/actions/move';
import { initCheckersGame } from '../../model/constant';
import { useProfile } from '../../../../profile/model/ProfileContext';
import Button from '../../../../../shared/ui/Button/Button';
import './GameEnds.scss';

const GameEnds = () => {
  const { checkersState: { status, resultRecorded }, dispatch } = useCheckersContext();
  const { recordResult } = useProfile();
  const recordedRef = useRef(null);
  const panelRef = useRef(null);

  const isGameOver = status !== Status.ongoing;
  const isDraw = status === Status.draw;
  const isWhiteWin = status === Status.whiteWins || status === Status.whiteOnTime || status === Status.blackSurrender;

  // One result per game: the ref covers StrictMode's repeated effect, `resultRecorded` in the game
  // state covers a game that Take Back resumed after it had ended (this overlay unmounts meanwhile).
  useEffect(() => {
    if (!isGameOver || resultRecorded || recordedRef.current === status) return;
    recordedRef.current = status;

    if (isDraw) {
      recordResult('checkers', 'draws');
    } else if (isWhiteWin) {
      recordResult('checkers', 'wins');
    } else {
      recordResult('checkers', 'losses');
    }
    dispatch(markResultRecorded());
  }, [isGameOver, status, isDraw, isWhiteWin, resultRecorded, recordResult, dispatch]);

  // When the game ends, focus moves to New Game (its only button), unless an open dialog holds it.
  useEffect(() => {
    if (!isGameOver || document.activeElement?.closest('[role="dialog"]')) return;
    panelRef.current?.querySelector('button')?.focus();
  }, [isGameOver]);

  if (!isGameOver) return null;

  const newGame = () => {
    recordedRef.current = null;
    dispatch(setupNewGame(initCheckersGame));
  }

  return (
    <div className="checkers-game-ends">
      <div ref={panelRef} className="checkers-game-ends--inner">
        {!isDraw ? (
          <div className={`wins ${isWhiteWin ? 'white' : 'black'}`}></div>
        ) : (
          <div className="draws"></div>
        )}
        {/* The result is announced as an alert when the panel appears. */}
        <div role="alert">
          <h2>{isDraw ? 'Draw' : status}</h2>
        </div>
        <Button variant="primary" onClick={newGame}>New Game</Button>
      </div>
    </div>
  )
}

export default GameEnds;
