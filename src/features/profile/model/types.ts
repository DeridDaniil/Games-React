// The local profile model: who is signed in on this device and the results of their games.

export type GameId = 'tictactoe' | 'chess' | 'checkers';

// How a finished game counts for the profile (the keys of its per-game record).
export type ResultType = 'wins' | 'losses' | 'draws';

// The results recorded for one game.
export type GameStats = Record<ResultType, number>;

// The results of every game.
export type Statistics = Record<GameId, GameStats>;

// The profile the app works with. It never holds the password or anything derived from it.
export interface Profile {
  login: string;
  name: string;
  avatar: string;
  stats: Statistics;
  createdAt: string;
}

// What a profile keeps instead of its password: a PBKDF2-SHA-256 hash with a random salt (both
// base64), so the password itself is never stored. `version` names the format for later changes.
export interface PasswordCredential {
  version: 1;
  algorithm: 'PBKDF2-SHA-256';
  salt: string;
  iterations: number;
  hash: string;
}

// One profile as it is kept in localStorage (the users map holds one per login).
export interface StoredUser extends Profile {
  credential: PasswordCredential;
}

// What the profile page lets the player change.
export type ProfileChanges = Partial<Pick<Profile, 'name' | 'avatar'>>;

// Registering or signing in either signs a profile in or explains why not.
export type AuthResult =
  | { profile: Profile; error?: undefined }
  | { error: string; profile?: undefined };

// Whether a change was stored; when the browser refuses (storage full or unavailable) nothing is
// changed and `error` says so in the player's words.
export type SaveResult = { ok: true } | { ok: false; error: string };
