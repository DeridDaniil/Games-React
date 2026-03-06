import Board from './components/Board/Board';
import CheckerFigures from './components/CheckerFigures/CheckerFigures';
import CheckersContext from './reducer/Context';
import { CheckersReducer } from './reducer/Reducer';
import { useReducer } from 'react';
import './Checkers.scss';
import { initCheckersGame } from './data/constant';

function Checkers() {
  const [checkersState, dispatch] = useReducer(CheckersReducer, initCheckersGame);
  const checkersProviderState = { checkersState, dispatch };

  return (
    <CheckersContext.Provider value={checkersProviderState}>
      <div className="checkers">
        <h1>Checkers</h1>
        <div className="checkers-container">
          <Board />
          <CheckerFigures />
        </div>
      </div>
    </CheckersContext.Provider>
  )
};

export default Checkers;