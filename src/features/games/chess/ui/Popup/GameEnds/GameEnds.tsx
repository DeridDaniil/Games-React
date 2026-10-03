import { useEffect, useRef, useState } from 'react';
import { useChessContext } from '../../../model/Context';
import { Status } from '../../../model/types';
import type { ChessStatus } from '../../../model/types';
import { winnerOf } from '../../../model/outcome';
import { markResultRecorded, setupNewGame } from '../../../model/actions/game';
import { useProfile } from '../../../../../profile/model/ProfileContext';
import Button from '../../../../../../shared/ui/Button/Button';
import './GameEnds.scss';

const GameEnds = () => {
  const { chessState: { status, resultRecorded }, dispatch } = useChessContext();
  const { recordResult } = useProfile();
  const recordedRef = useRef<ChessStatus | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const winner = winnerOf(status);
  const isGameOver = winner !== undefined;
  const isSurrender = status === Status.whiteSurrender || status === Status.blackSurrender;

  // One result per game: the ref covers StrictMode's repeated effect, `resultRecorded` in the game
  // state covers a game that Take Back resumed after it had ended (this overlay unmounts meanwhile).
  // The profile counts the game from White's side: a White win is a win, a Black win a loss. A result
  // the profile could not store is announced, and the game stays unrecorded, so a game Take Back
  // resumes can store its result when it ends again.
  useEffect(() => {
    if (!isGameOver || resultRecorded || recordedRef.current === status) return;
    recordedRef.current = status;

    const saved = recordResult('chess', winner === null ? 'draws' : winner === 'white' ? 'wins' : 'losses');
    if (saved.ok) dispatch(markResultRecorded());
    else setSaveError(saved.error);
  }, [isGameOver, status, winner, resultRecorded, recordResult, dispatch]);

  // When the game ends, focus moves to New Game (its only button), unless an open dialog holds it.
  useEffect(() => {
    if (!isGameOver || document.activeElement?.closest('[role="dialog"]')) return;
    panelRef.current?.querySelector('button')?.focus();
  }, [isGameOver]);

  if (winner === undefined) return null;

  const newGame = () => {
    recordedRef.current = null;
    dispatch(setupNewGame());
  }

  // A win is titled by its status ("White wins on time"); a surrender names the winner and says who
  // gave up underneath; a draw says why under "Draw".
  const winnerName = winner === 'white' ? 'White' : 'Black';
  const title = winner === null ? 'Draw' : isSurrender ? `${winnerName} wins` : status;
  const detail = winner === null || isSurrender ? status : '';

  return (
    <div className="game_ends">
      <div ref={panelRef} className="game_ends--inner">
        {winner ? (
          <div className={`wins ${winnerName}`}></div>
        ) : (
          <div className="draws"></div>
        )}
        <div className="game_ends--text" role="alert">
          <h2>{title}</h2>
          <p>{detail}</p>
          {saveError && <p className="game_ends--error">{saveError}</p>}
        </div>
        <Button variant="primary" onClick={newGame}>New Game</Button>
      </div>
    </div>
  )
}

export default GameEnds;
