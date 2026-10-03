import { Fragment, useId, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import Button from '../../../../shared/ui/Button/Button';
import Modal from '../../../../shared/ui/Modal/Modal';
import { GAMES, countOf, summarizeGame } from '../../lib/stats';
import type { GameSummary } from '../../lib/stats';
import type { GameId, Statistics } from '../../model/types';
import './GameStats.scss';

const COUNTS: readonly { key: Exclude<keyof GameSummary, 'winRate'>; singular: string; plural?: string }[] = [
  { key: 'played', singular: 'game' },
  { key: 'wins', singular: 'win' },
  { key: 'losses', singular: 'loss', plural: 'losses' },
  { key: 'draws', singular: 'draw' },
];

// "20 games · 12 wins · 5 losses · 3 draws"; a line only breaks between two counts, never inside one.
const renderCounts = (summary: GameSummary) =>
  COUNTS.map(({ key, singular, plural }, index) => (
    <Fragment key={key}>
      {index > 0 && ' · '}
      <span className="game-stats__count">{countOf(summary[key], singular, plural)}</span>
    </Fragment>
  ));

interface GameStatsProps {
  stats: Statistics;
  onReset: (game: GameId) => void;
}

// One row per game: the results in words, the win rate with a thin bar for it, and a reset that asks first.
function GameStats({ stats, onReset }: GameStatsProps) {
  // The game being reset stays named while the dialog fades out after it was answered.
  const [resetKey, setResetKey] = useState<GameId | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const messageId = useId();
  const resetGame = GAMES.find(({ key }) => key === resetKey);

  const askReset = (key: GameId) => {
    setResetKey(key);
    setIsConfirmOpen(true);
  };

  const closeConfirm = () => setIsConfirmOpen(false);

  const confirmReset = () => {
    if (resetKey) onReset(resetKey);
    setIsConfirmOpen(false);
  };

  return (
    <>
      <ul className="game-stats">
        {GAMES.map(({ key, label }) => {
          const summary = summarizeGame(stats[key]);
          return (
            <li key={key} className="game-stats__row">
              <h3 className="game-stats__name">{label}</h3>
              <p className="game-stats__counts">{summary.played > 0 ? renderCounts(summary) : 'No games yet'}</p>
              <p className="game-stats__rate">
                {summary.winRate === null ? (
                  <>
                    <span className="game-stats__rate-value" aria-hidden="true">—</span>
                    <span className="visually-hidden">No win rate yet</span>
                  </>
                ) : (
                  <>
                    <span className="game-stats__rate-value">{summary.winRate}%</span>
                    <span className="game-stats__rate-label">win rate</span>
                  </>
                )}
              </p>
              <span className="game-stats__bar" aria-hidden="true">
                <span className="game-stats__fill" style={{ width: `${summary.winRate ?? 0}%` }} />
              </span>
              <Button
                variant="ghost"
                className="game-stats__reset"
                icon={<RotateCcw />}
                aria-label={`Reset ${label} statistics`}
                onClick={() => askReset(key)}
              >
                Reset
              </Button>
            </li>
          );
        })}
      </ul>

      {resetGame && (
        <Modal
          isOpen={isConfirmOpen}
          onClose={closeConfirm}
          title={`Reset ${resetGame.label} statistics?`}
          describedBy={messageId}
        >
          <p id={messageId}>
            {`This will permanently clear the recorded ${resetGame.label} results for this local profile.`}
          </p>
          <div className="game-stats__dialog-actions">
            <Button variant="ghost" disabled={!isConfirmOpen} onClick={closeConfirm}>Cancel</Button>
            <Button variant="danger" disabled={!isConfirmOpen} onClick={confirmReset}>Reset</Button>
          </div>
        </Modal>
      )}
    </>
  );
}

export default GameStats;
