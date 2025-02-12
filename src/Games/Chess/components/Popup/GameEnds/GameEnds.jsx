import { useChessContext } from '../../../reducer/Context';
import { Status } from '../../../data/types';
import { setupNewGame } from '../../../reducer/actions/game';
import './GameEnds.scss';

const GameEnds = ({ onClosePopup }) => {
  const { chessState: { status }, dispatch } = useChessContext();
  if (status === Status.ongoing || status === Status.promoting) return null;

  const iswin = status.slice(6) === 'wins';
  const newGame = () => {
    dispatch(setupNewGame());
  }

  return (
    <div className="game_ends">
      <div className="game_ends--inner">
        <h1>{iswin ? status : 'Draw'}</h1>
        <p>{!iswin && status}</p>
        <div className={status}></div>
        <button onClick={newGame}>New Game</button>
      </div>
    </div>
  )
}

export default GameEnds;