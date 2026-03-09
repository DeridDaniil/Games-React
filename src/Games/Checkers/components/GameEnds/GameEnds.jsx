import { useEffect, useRef } from 'react';
import { useCheckersContext } from '../../reducer/Context';
import { Status } from '../../data/types';
import { setupNewGame } from '../../reducer/actions/move';
import { initCheckersGame } from '../../data/constant';
import { useProfile } from '../../../../profile/ProfileContext';
import './GameEnds.scss';

const GameEnds = () => {
  const { checkersState: { status }, dispatch } = useCheckersContext();
  const { recordResult } = useProfile();
  const recordedRef = useRef(null);

  const isGameOver = status !== Status.ongoing;
  const isDraw = status === Status.draw;
  const isWhiteWin = status === Status.whiteWins || status === Status.blackOnTime || status === Status.blackSurrender;

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
