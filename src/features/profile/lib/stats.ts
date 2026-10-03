// Read-only summaries of the results a profile records for each game.
import type { GameId, GameStats, Statistics } from '../model/types';

export const GAMES: readonly { key: GameId; label: string }[] = [
  { key: 'tictactoe', label: 'Tic Tac Toe' },
  { key: 'chess', label: 'Chess' },
  { key: 'checkers', label: 'Checkers' },
];

export interface GameSummary extends GameStats {
  played: number;
  winRate: number | null;
}

// Wins, losses and draws of one game, how many games that makes and the rounded win rate in percent
// (null until a game has been played).
export function summarizeGame(record: Partial<GameStats> | undefined): GameSummary {
  const { wins = 0, losses = 0, draws = 0 } = record ?? {};
  const played = wins + losses + draws;
  const winRate = played > 0 ? Math.round((wins / played) * 100) : null;
  return { wins, losses, draws, played, winRate };
}

// The same counts added up over the three games.
export function summarizeAll(stats: Partial<Statistics> | undefined): Omit<GameSummary, 'winRate'> {
  return GAMES.reduce(
    (total, { key }) => {
      const game = summarizeGame(stats?.[key]);
      return {
        wins: total.wins + game.wins,
        losses: total.losses + game.losses,
        draws: total.draws + game.draws,
        played: total.played + game.played,
      };
    },
    { wins: 0, losses: 0, draws: 0, played: 0 }
  );
}

// "1 game", "3 games", "1 loss", "2 losses".
export const countOf = (count: number, singular: string, plural = `${singular}s`): string =>
  `${count} ${count === 1 ? singular : plural}`;
