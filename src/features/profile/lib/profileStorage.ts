import { defaultAvatar, normalizeAvatar } from './avatar';
import type { AuthResult, GameStats, Profile, Statistics } from '../model/types';

const USERS_KEY = 'games-react-users';
const SESSION_KEY = 'games-react-session';

const defaultStats: Statistics = {
  tictactoe: { wins: 0, losses: 0, draws: 0 },
  chess: { wins: 0, losses: 0, draws: 0 },
  checkers: { wins: 0, losses: 0, draws: 0 },
};

// The users map as read from storage: profile records keyed by login. Storage may hold anything,
// so a record is only trusted once toProfile has read it.
type StoredUsers = Record<string, unknown>;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// Anything that is not a map of records (missing, unreadable, or another kind of JSON) holds no users.
function loadUsers(): StoredUsers {
  try {
    const users: unknown = JSON.parse(localStorage.getItem(USERS_KEY) ?? 'null');
    return isObject(users) ? users : {};
  } catch {
    return {};
  }
}

function saveUsers(users: StoredUsers) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

const toCount = (value: unknown) =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0;

const toGameStats = (value: unknown): GameStats => {
  const record = isObject(value) ? value : {};
  return { wins: toCount(record.wins), losses: toCount(record.losses), draws: toCount(record.draws) };
};

// Results of games this version does not know are kept as they are.
const toStatistics = (value: unknown): Statistics => {
  const stats = isObject(value) ? value : {};
  return {
    ...stats,
    tictactoe: toGameStats(stats.tictactoe),
    chess: toGameStats(stats.chess),
    checkers: toGameStats(stats.checkers),
  };
};

// A stored record as a profile, or null when it cannot be one (not an object, or no password to sign
// in with). The other fields fall back to safe values, so profiles saved by older versions keep
// working: an old or missing avatar shows as the default one, and missing stats start at zero.
// Fields this version does not know are kept, so saving the profile again does not drop them.
function toProfile(record: unknown, login: string): Profile | null {
  if (!isObject(record) || typeof record.password !== 'string') return null;
  return {
    ...record,
    login,
    name: typeof record.name === 'string' ? record.name : login,
    password: record.password,
    avatar: normalizeAvatar(record.avatar),
    stats: toStatistics(record.stats),
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : '',
  };
}

export function register(login: string, name: string, password: string): AuthResult {
  const users = loadUsers();
  const key = login.toLowerCase();
  if (users[key]) return { error: 'User with this login already exists' };

  const profile: Profile = {
    login: key,
    name,
    password,
    avatar: defaultAvatar,
    stats: { ...defaultStats },
    createdAt: new Date().toISOString(),
  };
  users[key] = profile;
  saveUsers(users);
  localStorage.setItem(SESSION_KEY, key);
  return { profile };
}

export function login(login: string, password: string): AuthResult {
  const users = loadUsers();
  const key = login.toLowerCase();
  const user = users[key];
  if (!user) return { error: 'User not found' };
  const profile = toProfile(user, key);
  if (!profile || profile.password !== password) return { error: 'Wrong password' };
  localStorage.setItem(SESSION_KEY, key);
  return { profile };
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function loadSession(): Profile | null {
  try {
    const key = localStorage.getItem(SESSION_KEY);
    if (!key) return null;
    return toProfile(loadUsers()[key], key);
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile): void {
  const users = loadUsers();
  users[profile.login] = profile;
  saveUsers(users);
}
