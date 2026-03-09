import { useCheckersContext } from '../../reducer/Context';
import { Status } from '../../data/types';
import { setupNewGame } from '../../reducer/actions/move';
import { initCheckersGame } from '../../data/constant';
import './GameEnds.scss';

const GameEnds = () => {
  const { checkersState: { status }, dispatch } = useCheckersContext();
  if (status === Status.ongoing) return null;

  const isDraw = status === Status.draw;
  const isWhiteWin = status === Status.whiteWins || status === Status.blackOnTime || status === Status.blackSurrender;

  const newGame = () => {
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
