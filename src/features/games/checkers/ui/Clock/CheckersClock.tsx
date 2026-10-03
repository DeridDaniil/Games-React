import { useCheckersContext } from '../../model/Context';
import { Status } from '../../model/types';
import { DEFAULT_TIME_CONTROL_MS } from '../../model/constant';
import { tickClock } from '../../model/actions/move';
import GameClock from '../../../shared/ui/GameClock/GameClock';

// Checkers rules for the shared clock: once started it runs only while the game is ongoing.
const CheckersClock = () => {
  const { checkersState, dispatch } = useCheckersContext();
  const { whiteTime, blackTime, turn, status, clockStarted } = checkersState;
  const isRunning = clockStarted && status === Status.ongoing;

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

export default CheckersClock;
