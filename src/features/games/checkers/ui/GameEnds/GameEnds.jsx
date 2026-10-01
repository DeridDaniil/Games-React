import { useEffect, useRef } from 'react';
import { useCheckersContext } from '../../model/Context';
import { Status } from '../../model/types';
import { setupNewGame } from '../../model/actions/move';
import { initCheckersGame } from '../../model/constant';
import { useProfile } from '../../../../profile/model/ProfileContext';
import './GameEnds.scss';

const GameEnds = () => {
  const { checkersState: { status }, dispatch } = useCheckersContext();
  const { recordResult } = useProfile();
  const recordedRef = useRef(null);

  const isGameOver = status !== Status.ongoing;
  const isDraw = status === Status.draw;
  const isWhiteWin = status === Status.whiteWins || status === Status.whiteOnTime || status === Status.blackSurrender;

  useEffect(() => {
    if (!isGameOver || recordedRef.current === status) return;
    recordedRef.current = status;

    if (isDraw) {
      recordResult('checkers', 'draws');
    } else if (isWhiteWin) {
      recordResult('checkers', 'wins');
    } else {
      recordResult('checkers', 'losses');
    }
  }, [isGameOver, status, isDraw, isWhiteWin, recordResult]);

  if (!isGameOver) return null;

  const newGame = () => {
    recordedRef.current = null;
    dispatch(setupNewGame(initCheckersGame));
  }

  return (
    <div className="checkers-game-ends">
      <div className="checkers-game-ends--inner">
        <h1>{isDraw ? 'Draw' : status}</h1>
        {!isDraw ? (
          <div className={`wins ${isWhiteWin ? 'white' : 'black'}`}></div>
        ) : (
          <div className="draws"></div>
        )}
        <button onClick={newGame}>New Game</button>
      </div>
    </div>
  )
}

export default GameEnds;
