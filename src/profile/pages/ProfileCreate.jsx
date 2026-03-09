import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../ProfileContext';
import './ProfileCreate.scss';

function ProfileCreate() {
  const { register, login } = useProfile();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [formLogin, setFormLogin] = useState('');
  const [formName, setFormName] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimmedLogin = formLogin.trim();
    const trimmedPassword = formPassword.trim();

    if (!trimmedLogin || !trimmedPassword) {
      setError('Fill in all fields');
      return;
    }

    if (mode === 'register') {
      const trimmedName = formName.trim();
      if (!trimmedName) {
        setError('Fill in all fields');
        return;
      }
      if (trimmedLogin.length < 3) {
        setError('Login must be at least 3 characters');
        return;
      }
      if (trimmedPassword.length < 4) {
        setError('Password must be at least 4 characters');
        return;
      }
      const result = register(trimmedLogin, trimmedName, trimmedPassword);
      if (result.error) {
        setError(result.error);
        return;
      }
    } else {
      const result = login(trimmedLogin, trimmedPassword);
      if (result.error) {
        setError(result.error);
        return;
      }
    }

    navigate('/tictactoe');
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  const isRegister = mode === 'register';

  return (
    <div className="profile-create">
      <div className="profile-create__card">
        <h1>{isRegister ? 'Register' : 'Login'}</h1>
        <p className="profile-create__subtitle">
          {isRegister ? 'Create an account to track your stats' : 'Sign in to your account'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="profile-create__field">
            <label htmlFor="auth-login">Login</label>
            <input
              id="auth-login"
              type="text"
              value={formLogin}
              onChange={(e) => setFormLogin(e.target.value)}
              placeholder="Enter login..."
              maxLength={20}
              autoFocus
            />
          </div>

          {isRegister && (
            <div className="profile-create__field">
              <label htmlFor="auth-name">Display Name</label>
              <input
                id="auth-name"
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={20}
              />
            </div>
          )}

          <div className="profile-create__field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder="Enter password..."
              maxLength={32}
            />
          </div>

          {error && <p className="profile-create__error">{error}</p>}

          <button type="submit" className="profile-create__submit">
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="profile-create__switch">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" onClick={switchMode}>
            {isRegister ? 'Sign In' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default ProfileCreate;
