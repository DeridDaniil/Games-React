import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleDot, Crown, Grid3x3, HardDrive } from 'lucide-react';
import { useProfile } from '../../model/ProfileContext';
import BrandMark from '../../../../shared/ui/BrandMark/BrandMark';
import Button from '../../../../shared/ui/Button/Button';
import FormField from '../../../../shared/ui/FormField/FormField';
import './ProfileCreate.scss';

const MODES = [
  { key: 'login', tab: 'Sign in', submit: 'Sign in', submitting: 'Signing in…' },
  { key: 'register', tab: 'Register', submit: 'Create profile', submitting: 'Creating profile…' },
] as const;

type Mode = (typeof MODES)[number]['key'];
type Field = 'login' | 'name' | 'password';
type FormValues = Record<Field, string>;

const GAMES = [
  { name: 'Tic Tac Toe', note: '3×3 to 7×7, with a friend or the computer', Icon: Grid3x3 },
  { name: 'Chess', note: 'For two, with clocks and move history', Icon: Crown },
  { name: 'Checkers', note: 'For two, with compulsory captures', Icon: CircleDot },
];

const ERROR_ID = 'auth-error';

// The field each message of the profile storage is about.
const STORAGE_ERROR_FIELDS: Partial<Record<string, Field>> = {
  'User with this login already exists': 'login',
  'User not found': 'login',
  'Wrong password': 'password',
};

// The form's own checks, in their original order: the message and the fields it is about, or null.
function validate(isRegister: boolean, { login, name, password }: FormValues): { message: string; fields: Field[] } | null {
  const required: (Field | false)[] = [!login && 'login', isRegister && !name && 'name', !password && 'password'];
  const missing = required.filter(field => field !== false);
  if (missing.length > 0) return { message: 'Fill in all fields', fields: missing };
  if (isRegister && login.length < 3) return { message: 'Login must be at least 3 characters', fields: ['login'] };
  if (isRegister && password.length < 4) return { message: 'Password must be at least 4 characters', fields: ['password'] };
  return null;
}

// Sign-in and registration of the local profiles kept in this browser. Both end on Tic Tac Toe.
function ProfileCreate() {
  const { register, login } = useProfile();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState<FormValues>({ login: '', name: '', password: '' });
  const [error, setError] = useState<{ message: string; fields: Field[]; attempt: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Set at once (state would only change on the next render), so a second submit is ignored.
  const submittingRef = useRef(false);
  const attemptRef = useRef(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const isRegister = mode === 'register';
  // Every mode is listed in MODES, so the fallback is never used.
  const { submit, submitting } = MODES.find(({ key }) => key === mode) ?? MODES[0];

  const setField = (field: Field) => (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Every failed attempt mounts a fresh alert, so a repeated message is announced again.
  const fail = (message: string, fields: Field[]) => {
    attemptRef.current += 1;
    setError({ message, fields, attempt: attemptRef.current });
  };

  // Checking the password takes a moment (see credentials.ts): meanwhile the button says so and
  // further submits are ignored.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;
    const values = { login: form.login.trim(), name: form.name.trim(), password: form.password.trim() };

    const problem = validate(isRegister, values);
    if (problem) {
      fail(problem.message, problem.fields);
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    // However the check ends, the form is usable again afterwards.
    const result = await (isRegister
      ? register(values.login, values.name, values.password)
      : login(values.login, values.password)
    ).finally(() => {
      submittingRef.current = false;
      setIsSubmitting(false);
    });
    if (result.error) {
      fail(result.error, [STORAGE_ERROR_FIELDS[result.error]].filter(field => field !== undefined));
      return;
    }

    navigate('/tictactoe', { replace: true });
  };

  const switchMode = (nextMode: Mode) => {
    if (nextMode === mode || submittingRef.current) return;
    setMode(nextMode);
    setError(null);
  };

  // Arrow keys, Home and End move between the two tabs, as in any tab list. With a modifier they
  // keep their browser meaning (Alt+Left is Back).
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const index = MODES.findIndex(({ key }) => key === mode);
    const targets: Partial<Record<string, number>> = {
      ArrowRight: (index + 1) % MODES.length,
      ArrowLeft: (index - 1 + MODES.length) % MODES.length,
      Home: 0,
      End: MODES.length - 1,
    };
    const next = targets[event.key];
    if (next === undefined) return;
    event.preventDefault();
    switchMode(MODES[next].key);
    tabRefs.current[next]?.focus();
  };

  const errorProps = (field: Field) => {
    const invalid = Boolean(error?.fields.includes(field));
    return { invalid, describedBy: invalid ? ERROR_ID : undefined };
  };

  return (
    <main className="profile-create">
      <div className="profile-create__layout">
        <header className="profile-create__intro">
          <p className="profile-create__brand">
            <BrandMark className="profile-create__mark" />
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
            <form className="profile-create__form" onSubmit={(event) => { void handleSubmit(event); }}>
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

              <Button type="submit" variant="primary" className="profile-create__submit" disabled={isSubmitting}>
                {isSubmitting ? submitting : submit}
              </Button>
            </form>
          </div>

          <p className="profile-create__note">
            <HardDrive aria-hidden="true" />
            Profiles and statistics are stored on this device. This is a local profile, not an online account.
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
