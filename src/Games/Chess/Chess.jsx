import Board from './components/Board/Board';
import Figures from './components/Figures/Figures';
import СhessContext from './reducer/Context';
import { useReducer } from 'react';
import { ChessReducer } from './reducer/Reducer';
import { initChessGame } from './data/constant';
import './Chess.scss';

function Chess() {
  const [chessState, dispatch] = useReducer(ChessReducer, initChessGame);
  const chessProviderState = {chessState, dispatch};

  return (
    <СhessContext.Provider value={chessProviderState}>
      <div id='chess' className="chess">
        <h1>Шахматы</h1>
        <div className="chess-container">
          <Board />
          <Figures />
        </div>
      </div>
    </СhessContext.Provider>
  )
};

export default Chess;