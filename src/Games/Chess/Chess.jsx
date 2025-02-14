import Board from './components/Board/Board';
import Figures from './components/Figures/Figures';
import СhessContext from './reducer/Context';
import Popup from './components/Popup/Popup';
import { useReducer } from 'react';
import { ChessReducer } from './reducer/Reducer';
import { initChessGame } from './data/constant';
import PromotionBox from './components/Popup/PromotionBox/PromotionBox';
import GameEnds from './components/Popup/GameEnds/GameEnds';
import Control from './components/Control/Control';
import MovesList from './components/Control/MovesList/MovesList';
import TakeBack from './components/Control/TakeBack/TakeBack';
import './Chess.scss';

function Chess() {
  const [chessState, dispatch] = useReducer(ChessReducer, initChessGame);
  const chessProviderState = { chessState, dispatch };

  return (
    <СhessContext.Provider value={chessProviderState}>
      <div id='chess' className="chess">
        <h1 className='chess-title'>Шахматы</h1>
        <div className="chess-container">
          <Board />
          <Figures />
          <Popup>
            <PromotionBox />
            <GameEnds />
          </Popup>
        </div>
        <Control>
          <MovesList />
          <TakeBack />
        </Control>
      </div>
    </СhessContext.Provider>
  )
};

export default Chess;