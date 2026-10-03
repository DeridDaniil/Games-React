import { describe, expect, it } from 'vitest';
import { GAMES, countOf, summarizeAll, summarizeGame } from './stats';

describe('GAMES', () => {
  it('lists the three games under their stats keys, in navigation order', () => {
    expect(GAMES).toEqual([
      { key: 'tictactoe', label: 'Tic Tac Toe' },
      { key: 'chess', label: 'Chess' },
      { key: 'checkers', label: 'Checkers' },
    ]);
  });
});

describe('summarizeGame', () => {
  it('counts the games played and rounds the win rate to whole percent', () => {
    expect(summarizeGame({ wins: 2, losses: 1, draws: 0 })).toEqual({
      wins: 2,
      losses: 1,
      draws: 0,
      played: 3,
      winRate: 67,
    });
  });

  it('counts draws as played games that are not wins', () => {
    expect(summarizeGame({ wins: 1, losses: 0, draws: 3 }).winRate).toBe(25);
  });

  it('has no win rate before the first game', () => {
    expect(summarizeGame({ wins: 0, losses: 0, draws: 0 })).toEqual({
      wins: 0,
      losses: 0,
      draws: 0,
      played: 0,
      winRate: null,
    });
  });

  it('treats a missing record or missing counts as zero', () => {
    expect(summarizeGame(undefined).played).toBe(0);
    expect(summarizeGame({ wins: 4 })).toMatchObject({ losses: 0, draws: 0, played: 4, winRate: 100 });
  });
});

describe('summarizeAll', () => {
  it('adds up the three games', () => {
    const stats = {
      tictactoe: { wins: 12, losses: 5, draws: 3 },
      chess: { wins: 1, losses: 2, draws: 0 },
      checkers: { wins: 0, losses: 0, draws: 1 },
    };

    expect(summarizeAll(stats)).toEqual({ wins: 13, losses: 7, draws: 4, played: 24 });
  });

  it('is all zeros for a new profile', () => {
    expect(summarizeAll({})).toEqual({ wins: 0, losses: 0, draws: 0, played: 0 });
  });
});

describe('countOf', () => {
  it('uses the singular only for exactly one', () => {
    expect(countOf(1, 'game')).toBe('1 game');
    expect(countOf(0, 'game')).toBe('0 games');
    expect(countOf(3, 'win')).toBe('3 wins');
  });

  it('takes an irregular plural', () => {
    expect(countOf(1, 'loss', 'losses')).toBe('1 loss');
    expect(countOf(2, 'loss', 'losses')).toBe('2 losses');
  });
});
