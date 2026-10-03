import { useReducer, useEffect } from 'react';
import { Undo2 } from 'lucide-react';
import Board from './ui/Board/Board';
import CheckerFigures from './ui/CheckerFigures/CheckerFigures';
import CheckersContext from './model/Context';
import { CheckersReducer } from './model/Reducer';
import { DEFAULT_TIME_CONTROL_MS, initCheckersGame } from './model/constant';
import arbiter from './lib/arbiter/arbiter';
import { setForcedCaptures, gameOver, takeBack, surrender } from './model/actions/move';
import { Status } from './model/types';
import GameEnds from './ui/GameEnds/GameEnds';
import CheckersClock from './ui/Clock/CheckersClock';
import CheckersInfo from './ui/Info/CheckersInfo';
import GameLayout from '../shared/ui/GameLayout/GameLayout';
import GameHeader from '../shared/ui/GameHeader/GameHeader';
import GameControlPanel from '../shared/ui/GameControlPanel/GameControlPanel';
import MoveHistory from '../shared/ui/MoveHistory/MoveHistory';
import GameAction from '../shared/ui/GameAction/GameAction';
import SurrenderControl from '../shared/ui/SurrenderControl/SurrenderControl';

const CONTEXT = `Two players · ${DEFAULT_TIME_CONTROL_MS / 60000} min each`;
const SURRENDER_MESSAGE = 'This will end the current game.';

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

  const board = (
    <>
      <Board />
      <CheckerFigures />
      {checkersState.status !== Status.ongoing && <GameEnds />}
    </>
  );

  // A checkers surrender ends the game against the side to move; GameEnds then records the result.
  const actions = (
    <>
      <GameAction icon={<Undo2 />} onClick={() => dispatch(takeBack())}>Take Back</GameAction>
      <SurrenderControl message={SURRENDER_MESSAGE} onConfirm={() => dispatch(surrender())} />
    </>
  );

  return (
    <CheckersContext.Provider value={checkersProviderState}>
      <GameLayout
        header={<GameHeader title="Checkers" context={CONTEXT} info={<CheckersInfo />} />}
        board={board}
        controls={
          <GameControlPanel actions={actions}>
            <CheckersClock />
            <MoveHistory moves={checkersState.movesList} />
          </GameControlPanel>
        }
      />
    </CheckersContext.Provider>
  );
}

export default Checkers;
