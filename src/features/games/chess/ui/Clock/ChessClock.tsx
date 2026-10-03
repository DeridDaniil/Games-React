import { useChessContext } from '../../model/Context';
import { Status } from '../../model/types';
import { DEFAULT_TIME_CONTROL_MS } from '../../model/constant';
import { tickClock } from '../../model/actions/game';
import GameClock from '../../../shared/ui/GameClock/GameClock';

// Chess rules for the shared clock: once started it also keeps running while a promotion
// piece is being chosen.
const ChessClock = () => {
  const { chessState, dispatch } = useChessContext();
  const { whiteTime, blackTime, turn, status, clockStarted } = chessState;
  const isRunning = clockStarted && (status === Status.ongoing || status === Status.promoting);

  return (
    <GameClock
      whiteTime={whiteTime}
      blackTime={blackTime}
      turn={turn}
      isRunning={isRunning}
      onTick={() => dispatch(tickClock())}
      initialTimeMs={DEFAULT_TIME_CONTROL_MS}
    />
  );
};

export default ChessClock;
