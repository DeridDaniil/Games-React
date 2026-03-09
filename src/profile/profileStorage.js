import { defaultAvatar } from './constants';

const USERS_KEY = 'games-react-users';
const SESSION_KEY = 'games-react-session';

const defaultStats = {
  tictactoe: { wins: 0, losses: 0, draws: 0 },
  chess: { wins: 0, losses: 0, draws: 0 },
  checkers: { wins: 0, losses: 0, draws: 0 },
};

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function register(login, name, password) {
  const users = loadUsers();
  const key = login.toLowerCase();
  if (users[key]) return { error: 'User with this login already exists' };

  const profile = {
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

export function login(login, password) {
  const users = loadUsers();
  const key = login.toLowerCase();
  const user = users[key];
  if (!user) return { error: 'User not found' };
  if (user.password !== password) return { error: 'Wrong password' };
  localStorage.setItem(SESSION_KEY, key);
  return { profile: { ...user, stats: { ...defaultStats, ...user.stats } } };
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function loadSession() {
  try {
    const key = localStorage.getItem(SESSION_KEY);
    if (!key) return null;
    const users = loadUsers();
    const user = users[key];
    if (!user) return null;
    return { ...user, stats: { ...defaultStats, ...user.stats } };
  } catch {
    return null;
  }
}

export function saveProfile(profile) {
  const users = loadUsers();
  users[profile.login] = profile;
  saveUsers(users);
}
