import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleDot, Crown, Grid3x3, HardDrive } from 'lucide-react';
import { useProfile } from '../../model/ProfileContext';
import Button from '../../../../shared/ui/Button/Button';
import FormField from '../../../../shared/ui/FormField/FormField';
import './ProfileCreate.scss';

const MODES = [
  { key: 'login', tab: 'Sign in', submit: 'Sign in' },
  { key: 'register', tab: 'Register', submit: 'Create profile' },
];

const GAMES = [
  { name: 'Tic Tac Toe', note: '3×3 to 7×7, with a friend or the computer', Icon: Grid3x3 },
  { name: 'Chess', note: 'For two, with clocks and move history', Icon: Crown },
  { name: 'Checkers', note: 'For two, with compulsory captures', Icon: CircleDot },
];

const ERROR_ID = 'auth-error';

// The field each message of the profile storage is about.
const STORAGE_ERROR_FIELDS = {
  'User with this login already exists': 'login',
  'User not found': 'login',
  'Wrong password': 'password',
};

// The form's own checks, in their original order: the message and the fields it is about, or null.
function validate(isRegister, { login, name, password }) {
  const missing = [!login && 'login', isRegister && !name && 'name', !password && 'password'].filter(Boolean);
  if (missing.length > 0) return { message: 'Fill in all fields', fields: missing };
  if (isRegister && login.length < 3) return { message: 'Login must be at least 3 characters', fields: ['login'] };
  if (isRegister && password.length < 4) return { message: 'Password must be at least 4 characters', fields: ['password'] };
  return null;
}

// The app's mark from the navigation rail, drawn larger.
const SignInMark = () => (
  <svg className="profile-create__mark" viewBox="0 0 24 24" width="32" height="32" focusable="false" aria-hidden="true">
    <rect x="3" y="3" width="8" height="8" rx="1.5" fill="currentColor" />
    <rect x="13.75" y="3.75" width="6.5" height="6.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <rect x="3.75" y="13.75" width="6.5" height="6.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <rect className="profile-create__mark-warm" x="13" y="13" width="8" height="8" rx="1.5" />
  </svg>
);

// Sign-in and registration of the local profiles kept in this browser. Both end on Tic Tac Toe.
function ProfileCreate() {
  const { register, login } = useProfile();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ login: '', name: '', password: '' });
  const [error, setError] = useState(null);
  const attemptRef = useRef(0);
  const tabRefs = useRef([]);

  const isRegister = mode === 'register';
  const { submit } = MODES.find(({ key }) => key === mode);

  const setField = (field) => (event) => {
    const { value } = event.target;
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Every failed attempt mounts a fresh alert, so a repeated message is announced again.
  const fail = (message, fields) => {
    attemptRef.current += 1;
    setError({ message, fields, attempt: attemptRef.current });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const values = { login: form.login.trim(), name: form.name.trim(), password: form.password.trim() };

    const problem = validate(isRegister, values);
    if (problem) {
      fail(problem.message, problem.fields);
      return;
    }

    const result = isRegister
      ? register(values.login, values.name, values.password)
      : login(values.login, values.password);
    if (result.error) {
      fail(result.error, [STORAGE_ERROR_FIELDS[result.error]].filter(Boolean));
      return;
    }

    navigate('/tictactoe', { replace: true });
  };

  const switchMode = (nextMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    setError(null);
  };

  // Arrow keys, Home and End move between the two tabs, as in any tab list. With a modifier they
  // keep their browser meaning (Alt+Left is Back).
  const handleTabKeyDown = (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const index = MODES.findIndex(({ key }) => key === mode);
    const next = {
      ArrowRight: (index + 1) % MODES.length,
      ArrowLeft: (index - 1 + MODES.length) % MODES.length,
      Home: 0,
      End: MODES.length - 1,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    switchMode(MODES[next].key);
    tabRefs.current[next]?.focus();
  };

  const errorProps = (field) => {
    const invalid = Boolean(error?.fields.includes(field));
    return { invalid, describedBy: invalid ? ERROR_ID : undefined };
  };

  return (
    <main className="profile-create">
      <div className="profile-create__layout">
        <header className="profile-create__intro">
          <p className="profile-create__brand">
            <SignInMark />
            Games-React
          </p>
          <h1 className="profile-create__title">Tic Tac Toe, Chess and Checkers</h1>
          <p className="profile-create__lead">
            Play a friend on one screen, or the computer at Tic Tac Toe. Your profile keeps count of
            the wins, losses and draws.
          </p>
        </header>

        <div className="profile-create__panel">
          <div className="profile-create__tabs" role="tablist" aria-label="Sign in or register">
            {MODES.map(({ key, tab }, index) => (
              <button
                key={key}
                ref={(node) => { tabRefs.current[index] = node; }}
                id={`auth-tab-${key}`}
                type="button"
                role="tab"
                className="profile-create__tab"
                aria-selected={mode === key}
                aria-controls="auth-panel"
                tabIndex={mode === key ? 0 : -1}
                onClick={() => switchMode(key)}
                onKeyDown={handleTabKeyDown}
              >
                {tab}
              </button>
            ))}
          </div>

          <div id="auth-panel" role="tabpanel" aria-labelledby={`auth-tab-${mode}`}>
            <form className="profile-create__form" onSubmit={handleSubmit}>
              <FormField
                id="auth-login"
                label="Login"
                hint={isRegister ? 'At least 3 characters' : ''}
                value={form.login}
                onChange={setField('login')}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={20}
                autoFocus
                {...errorProps('login')}
              />
              {isRegister && (
                <FormField
                  id="auth-name"
                  label="Display name"
                  hint="Shown on your profile"
                  value={form.name}
                  onChange={setField('name')}
                  autoComplete="nickname"
                  maxLength={20}
                  {...errorProps('name')}
                />
              )}
              <FormField
                id="auth-password"
                label="Password"
                type="password"
                hint={isRegister ? 'At least 4 characters' : ''}
                value={form.password}
                onChange={setField('password')}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                maxLength={32}
                {...errorProps('password')}
              />

              {error && (
                <p key={error.attempt} id={ERROR_ID} className="profile-create__error" role="alert">
                  {error.message}
                </p>
              )}

              <Button type="submit" variant="primary" className="profile-create__submit">{submit}</Button>
            </form>
          </div>

          <p className="profile-create__note">
            <HardDrive aria-hidden="true" />
            Profiles and statistics are stored on this device.
          </p>
        </div>

        <ul className="profile-create__games" aria-label="Games">
          {GAMES.map(({ name, note, Icon }) => (
            <li key={name} className="profile-create__game">
              <Icon className="profile-create__game-icon" strokeWidth={1.75} aria-hidden="true" />
              <span className="profile-create__game-name">{name}</span>
              <span className="profile-create__game-note">{note}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

export default ProfileCreate;
