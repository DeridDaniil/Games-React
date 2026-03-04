import { useChessContext } from '../../../reducer/Context';
import { Status } from '../../../data/types';
import { setupNewGame } from '../../../reducer/actions/game';
import './GameEnds.scss';

const GameEnds = ({ onClosePopup }) => {
  const { chessState: { status }, dispatch } = useChessContext();
  if (status === Status.ongoing || status === Status.promoting) return null;

  const lowerStatus = status.toLowerCase();
  const isWin = lowerStatus.includes('wins');
  const isWhiteWin = status.startsWith('White');

  const newGame = () => {
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