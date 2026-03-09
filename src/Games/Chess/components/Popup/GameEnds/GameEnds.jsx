import { useEffect, useRef } from 'react';
import { useChessContext } from '../../../reducer/Context';
import { Status } from '../../../data/types';
import { setupNewGame } from '../../../reducer/actions/game';
import { useProfile } from '../../../../../profile/ProfileContext';
import './GameEnds.scss';

const GameEnds = ({ onClosePopup }) => {
  const { chessState: { status }, dispatch } = useChessContext();
  const { recordResult } = useProfile();
  const recordedRef = useRef(null);

  const isGameOver = status !== Status.ongoing && status !== Status.promoting;
  const lowerStatus = isGameOver ? status.toLowerCase() : '';
  const isWin = lowerStatus.includes('wins');
  const isWhiteWin = isGameOver && status.startsWith('White');

  useEffect(() => {
    if (!isGameOver || recordedRef.current === status) return;
    recordedRef.current = status;

    if (!isWin) {
      recordResult('chess', 'draws');
    } else if (isWhiteWin) {
      recordResult('chess', 'wins');
    } else {
      recordResult('chess', 'losses');
    }
  }, [isGameOver, status, isWin, isWhiteWin, recordResult]);

  if (!isGameOver) return null;

  const newGame = () => {
    recordedRef.current = null;
    dispatch(setupNewGame());
  }

  return (
    <div className="game_ends">
      <div className="game_ends--inner">
        <h1>{isWin ? status : 'Draw'}</h1>
        <p>{!isWin && status}</p>
        {isWin ? (
          <div className={`wins ${isWhiteWin ? 'White' : 'Black'}`}></div>
        ) : (
          <div className="draws"></div>
        )}
        <button onClick={newGame}>New Game</button>
      </div>
    </div>
  )
}

export default GameEnds;
