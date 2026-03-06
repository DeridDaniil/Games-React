import Board from './components/Board/Board';
import Figures from './components/Figures/Figures';
import ChessContext from './reducer/Context';
import Popup from './components/Popup/Popup';
import { useReducer } from 'react';
import { ChessReducer } from './reducer/Reducer';
import { initChessGame } from './data/constant';
import PromotionBox from './components/Popup/PromotionBox/PromotionBox';
import GameEnds from './components/Popup/GameEnds/GameEnds';
import Control from './components/Control/Control';
import MovesList from './components/Control/MovesList/MovesList';
import TakeBack from './components/Control/TakeBack/TakeBack';
import SurrenderControl from './components/Control/Surrender/SurrenderControl';
import ChessClock from './components/Clock/ChessClock';
import './Chess.scss';

function Chess() {
  const [chessState, dispatch] = useReducer(ChessReducer, initChessGame);
  const chessProviderState = { chessState, dispatch };

  return (
    <ChessContext.Provider value={chessProviderState}>
      <div className="chess">
        <h1 className='chess-title'>Chess</h1>
        <div className="chess-box">
          <div className="chess-container">
          <Board />
          <Figures />
          <Popup>
            <PromotionBox />
            <GameEnds />
          </Popup>
        </div>
        <Control>
          <ChessClock />
          <MovesList />
          <div className="control-actions">
            <TakeBack />
            <SurrenderControl />
          </div>
        </Control>
        </div>
      </div>
    </ChessContext.Provider>
  )
};

export default Chess;