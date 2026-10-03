// The local profile model: who is signed in on this device and the results of their games.

export type GameId = 'tictactoe' | 'chess' | 'checkers';

// How a finished game counts for the profile (the keys of its per-game record).
export type ResultType = 'wins' | 'losses' | 'draws';

// The results recorded for one game.
export type GameStats = Record<ResultType, number>;

// The results of every game.
export type Statistics = Record<GameId, GameStats>;

// One profile as it is kept in localStorage: the users map holds a record per login. The password is
// stored as entered (plain text, until the product decides otherwise).
export interface UserRecord {
  login: string;
  name: string;
  password: string;
  avatar: string;
  stats: Statistics;
  createdAt: string;
}

// The signed-in profile is the stored record itself, so saving it writes the same shape back.
export type Profile = UserRecord;

// What the profile page lets the player change.
export type ProfileChanges = Partial<Pick<Profile, 'name' | 'avatar'>>;

// Registering or signing in either signs a profile in or explains why not.
export type AuthResult =
  | { profile: Profile; error?: undefined }
  | { error: string; profile?: undefined };
