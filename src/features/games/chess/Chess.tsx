import { useReducer } from 'react';
import { Undo2 } from 'lucide-react';
import Board from './ui/Board/Board';
import Figures from './ui/Figures/Figures';
import ChessContext from './model/Context';
import Popup from './ui/Popup/Popup';
import { ChessReducer } from './model/Reducer';
import { DEFAULT_TIME_CONTROL_MS, initChessGame } from './model/constant';
import { takeBack } from './model/actions/move';
import { surrender } from './model/actions/game';
import { closePopup } from './model/actions/popup';
import PromotionBox from './ui/Popup/PromotionBox/PromotionBox';
import GameEnds from './ui/Popup/GameEnds/GameEnds';
import ChessClock from './ui/Clock/ChessClock';
import ChessInfo from './ui/Info/ChessInfo';
import GameLayout from '../shared/ui/GameLayout/GameLayout';
import GameHeader from '../shared/ui/GameHeader/GameHeader';
import GameControlPanel from '../shared/ui/GameControlPanel/GameControlPanel';
import MoveHistory from '../shared/ui/MoveHistory/MoveHistory';
import GameAction from '../shared/ui/GameAction/GameAction';
import SurrenderControl from '../shared/ui/SurrenderControl/SurrenderControl';

const CONTEXT = `Two players · ${DEFAULT_TIME_CONTROL_MS / 60000} min each`;
const SURRENDER_MESSAGE = 'This will end the current game.';

function Chess() {
  const [chessState, dispatch] = useReducer(ChessReducer, initChessGame);
  const chessProviderState = { chessState, dispatch };

  const board = (
    <>
      <Board />
      <Figures />
      <Popup>
        <PromotionBox onClosePopup={() => dispatch(closePopup())} />
        <GameEnds />
      </Popup>
    </>
  );

  // A surrender ends the game against the side to move; GameEnds then shows and records the result.
  const actions = (
    <>
      <GameAction icon={<Undo2 />} onClick={() => dispatch(takeBack())}>Take Back</GameAction>
      <SurrenderControl message={SURRENDER_MESSAGE} onConfirm={() => dispatch(surrender())} />
    </>
  );

  return (
    <ChessContext.Provider value={chessProviderState}>
      <GameLayout
        header={<GameHeader title="Chess" context={CONTEXT} info={<ChessInfo />} />}
        board={board}
        controls={
          <GameControlPanel actions={actions}>
            <ChessClock />
            <MoveHistory moves={chessState.movesList} />
          </GameControlPanel>
        }
      />
    </ChessContext.Provider>
  );
}

export default Chess;
