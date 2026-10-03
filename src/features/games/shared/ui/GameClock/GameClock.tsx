import { useEffect, useRef } from 'react';
import type { PlayerColor } from '../../model/types';
import './GameClock.scss';

const TICK_MS = 1000;
const LOW_TIME_MS = 30 * 1000;
const CRITICAL_TIME_MS = 10 * 1000;

const hasTimeLeft = (ms: number) => Number.isFinite(ms) && ms > 0;

// An invalid time is shown as the initial time control instead of "NaN:NaN".
const formatTime = (ms: number, initialTimeMs: number) => {
  const shownMs = Number.isFinite(ms) ? ms : initialTimeMs;
  const totalSeconds = Math.max(0, Math.floor(shownMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return { minutes: String(minutes).padStart(2, '0'), seconds: String(seconds).padStart(2, '0') };
};

const getTimePercent = (ms: number, initialTimeMs: number) => {
  if (!Number.isFinite(ms)) return 100;
  return Math.max(0, Math.min(100, (ms / initialTimeMs) * 100));
};

interface PlayerTimerProps {
  color: PlayerColor;
  timeMs: number;
  isActive: boolean;
  initialTimeMs: number;
}

const PlayerTimer = ({ color, timeMs, isActive, initialTimeMs }: PlayerTimerProps) => {
  const isLow = Number.isFinite(timeMs) && timeMs <= LOW_TIME_MS;
  const isCritical = Number.isFinite(timeMs) && timeMs <= CRITICAL_TIME_MS;
  const { minutes, seconds } = formatTime(timeMs, initialTimeMs);
  const percent = getTimePercent(timeMs, initialTimeMs);

  const label = color === 'white' ? 'White' : 'Black';

  const classNames = [
    'game-timer',
    `game-timer--${color}`,
    isActive ? 'game-timer--active' : '',
    isLow ? 'game-timer--low' : '',
    isCritical ? 'game-timer--critical' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames}>
      <span className="game-timer__label">
        {label}
        {isActive && <span className="visually-hidden">, to move</span>}
      </span>
      <span className="game-timer__time">{minutes}:{seconds}</span>
      <span className="game-timer__bar-track" aria-hidden="true">
        <span className="game-timer__bar-fill" style={{ width: `${percent}%` }} />
      </span>
    </div>
  );
};

interface GameClockProps {
  whiteTime: number;
  blackTime: number;
  turn: PlayerColor;
  isRunning: boolean;
  onTick: () => void;
  initialTimeMs: number;
}

// Two-player countdown shared by the board games. The game decides when its clock runs
// (isRunning); the clock also stops by itself once either time is used up or invalid.
const GameClock = ({ whiteTime, blackTime, turn, isRunning, onTick, initialTimeMs }: GameClockProps) => {
  const isTicking = isRunning && hasTimeLeft(whiteTime) && hasTimeLeft(blackTime);
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  // `turn` restarts the interval, so the first tick after a move comes a full second later.
  useEffect(() => {
    if (!isTicking) return;

    const intervalId = setInterval(() => onTickRef.current(), TICK_MS);
    return () => clearInterval(intervalId);
  }, [isTicking, turn]);

  return (
    <div className="game-clock" role="group" aria-label="Clock">
      <PlayerTimer
        color="white"
        timeMs={whiteTime}
        isActive={turn === 'white' && isTicking}
        initialTimeMs={initialTimeMs}
      />
      <PlayerTimer
        color="black"
        timeMs={blackTime}
        isActive={turn === 'black' && isTicking}
        initialTimeMs={initialTimeMs}
      />
    </div>
  );
};

export default GameClock;
