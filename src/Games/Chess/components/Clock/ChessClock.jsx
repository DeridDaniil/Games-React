import { useEffect } from 'react';
import { useChessContext } from '../../reducer/Context';
import { Status } from '../../data/types';
import { DEFAULT_TIME_CONTROL_MS } from '../../data/constant';
import { tickClock } from '../../reducer/actions/game';
import './ChessClock.scss';

const formatTime = (ms) => {
  if (!Number.isFinite(ms)) {
    return formatTime(DEFAULT_TIME_CONTROL_MS);
  }

  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return { minutes: String(minutes).padStart(2, '0'), seconds: seconds.toString().padStart(2, '0') };
};

const getTimePercent = (ms) => {
  if (!Number.isFinite(ms)) return 100;
  return Math.max(0, Math.min(100, (ms / DEFAULT_TIME_CONTROL_MS) * 100));
};

const PlayerTimer = ({ color, timeMs, isActive }) => {
  const isLow = Number.isFinite(timeMs) && timeMs <= 30 * 1000;
  const isCritical = Number.isFinite(timeMs) && timeMs <= 10 * 1000;
  const { minutes, seconds } = formatTime(timeMs);
  const percent = getTimePercent(timeMs);

  const label = color === 'white' ? 'White' : 'Black';

  const classNames = [
    'timer-card',
    `timer-card--${color}`,
    isActive ? 'timer-card--active' : '',
    isLow ? 'timer-card--low' : '',
    isCritical ? 'timer-card--critical' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames}>
      <div className="timer-card__header">
        <span className="timer-card__label">{label}</span>
        {isActive && <span className="timer-card__live-dot" />}
      </div>

      <div className="timer-card__display">
        <span className="timer-card__digit">{minutes}</span>
        <span className="timer-card__separator">:</span>
        <span className="timer-card__digit">{seconds}</span>
      </div>

      <div className="timer-card__bar-track">
        <div
          className="timer-card__bar-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

const ChessClock = () => {
  const { chessState, dispatch } = useChessContext();
  const { whiteTime, blackTime, turn, status, clockStarted } = chessState;

  const hasValidTimes =
    Number.isFinite(whiteTime) &&
    Number.isFinite(blackTime);

  const isRunning =
    hasValidTimes &&
    clockStarted &&
    (status === Status.ongoing || status === Status.promoting) &&
    whiteTime > 0 &&
    blackTime > 0;

  useEffect(() => {
    if (!isRunning) return;

    const intervalId = setInterval(() => {
      dispatch(tickClock());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [dispatch, isRunning, turn]);

  return (
    <div className="chess-clock">
      <PlayerTimer
        color="white"
        timeMs={whiteTime}
        isActive={turn === 'white' && isRunning}
      />
      <div className="chess-clock__vs">VS</div>
      <PlayerTimer
        color="black"
        timeMs={blackTime}
        isActive={turn === 'black' && isRunning}
      />
    </div>
  );
};

export default ChessClock;
