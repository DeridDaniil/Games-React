import { useReducer } from 'react';
import { Undo2 } from 'lucide-react';
import Board from './ui/Board/Board';
import Figures from './ui/Figures/Figures';
import ChessContext from './model/Context';
import Popup from './ui/Popup/Popup';
import { ChessReducer } from './model/Reducer';
import { DEFAULT_TIME_CONTROL_MS, initChessGame } from './model/constant';
import { takeBack } from './model/actions/move';
import { setupNewGame } from './model/actions/game';
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
const SURRENDER_MESSAGE = 'This will end the current game and start a new one from the initial position.';

function Chess() {
  const [chessState, dispatch] = useReducer(ChessReducer, initChessGame);
  const chessProviderState = { chessState, dispatch };

  const board = (
    <>
      <Board />
      <Figures />
      <Popup>
        <PromotionBox />
        <GameEnds />
      </Popup>
    </>
  );

  // A chess surrender just starts a new game; no result is recorded (current behaviour).
  const actions = (
    <>
      <GameAction icon={<Undo2 />} onClick={() => dispatch(takeBack())}>Take Back</GameAction>
      <SurrenderControl message={SURRENDER_MESSAGE} onConfirm={() => dispatch(setupNewGame())} />
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
