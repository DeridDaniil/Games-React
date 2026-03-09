import Board from './components/Board/Board';
import CheckerFigures from './components/CheckerFigures/CheckerFigures';
import CheckersContext from './reducer/Context';
import { CheckersReducer } from './reducer/Reducer';
import { useReducer, useEffect } from 'react';
import './Checkers.scss';
import { initCheckersGame } from './data/constant';
import arbiter from './arbiter/arbiter';
import { setForcedCaptures, gameOver } from './reducer/actions/move';
import { Status } from './data/types';
import GameEnds from './components/GameEnds/GameEnds';
import Control from './components/Control/Control';
import CheckersClock from './components/Clock/CheckersClock';
import MovesList from './components/Control/MovesList/MovesList';
import TakeBack from './components/Control/TakeBack/TakeBack';
import SurrenderControl from './components/Control/Surrender/SurrenderControl';

function Checkers() {
  const [checkersState, dispatch] = useReducer(CheckersReducer, initCheckersGame);
  const checkersProviderState = { checkersState, dispatch };

  useEffect(() => {
    if (checkersState.status !== Status.ongoing) return;

    const currentPosition = checkersState.position[checkersState.position.length - 1];

    if (checkersState.chainCapturePiece) {
      dispatch(setForcedCaptures({ forcedCapturePieces: [checkersState.chainCapturePiece] }));
      return;
    }

    const result = arbiter.getGameResult({ position: currentPosition, currentTurn: checkersState.turn });
    if (result) {
      dispatch(gameOver({ status: result }));
      return;
    }

    const forced = arbiter.getPiecesWithCaptures({ position: currentPosition, player: checkersState.turn });
    dispatch(setForcedCaptures({ forcedCapturePieces: forced }));
  }, [checkersState.turn, checkersState.position, checkersState.status, checkersState.chainCapturePiece]);

  return (
    <CheckersContext.Provider value={checkersProviderState}>
      <div className="checkers">
        <h1>Checkers</h1>
        <div className="checkers-box">
          <div className="checkers-container">
            <Board />
            <CheckerFigures />
            {checkersState.status !== Status.ongoing && <GameEnds />}
          </div>
          <Control>
            <CheckersClock />
            <MovesList />
            <div className="checkers-control-actions">
              <TakeBack />
              <SurrenderControl />
            </div>
          </Control>
        </div>
      </div>
    </CheckersContext.Provider>
  )
};

export default Checkers;