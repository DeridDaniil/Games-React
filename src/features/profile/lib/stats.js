// Read-only summaries of the results a profile records for each game.

export const GAMES = [
  { key: 'tictactoe', label: 'Tic Tac Toe' },
  { key: 'chess', label: 'Chess' },
  { key: 'checkers', label: 'Checkers' },
];

// Wins, losses and draws of one game, how many games that makes and the rounded win rate in percent
// (null until a game has been played).
export function summarizeGame(record) {
  const { wins = 0, losses = 0, draws = 0 } = record ?? {};
  const played = wins + losses + draws;
  const winRate = played > 0 ? Math.round((wins / played) * 100) : null;
  return { wins, losses, draws, played, winRate };
}

// The same counts added up over the three games.
export function summarizeAll(stats) {
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
export const countOf = (count, singular, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;
