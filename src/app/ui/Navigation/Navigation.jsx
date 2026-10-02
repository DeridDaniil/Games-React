import { NavLink } from 'react-router-dom';
import { CircleDot, Crown, Grid3x3 } from 'lucide-react';
import { useProfile } from '../../../features/profile/model/ProfileContext';
import './Navigation.scss';

const GAMES = [
  { path: '/tictactoe', label: 'Tic Tac Toe', Icon: Grid3x3 },
  { path: '/chess', label: 'Chess', Icon: Crown },
  { path: '/checkers', label: 'Checkers', Icon: CircleDot }
];

// The app's only navigation: a rail on the left, a bar at the bottom on small screens.
// Game info and settings live in each game's header, not here.
function Navigation() {
  const { profile } = useProfile();

  return (
    <nav className="app-nav" aria-label="Main">
      <span className="app-nav__mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="24" height="24" focusable="false">
          <rect x="3" y="3" width="8" height="8" rx="1.5" fill="currentColor" />
          <rect x="13.75" y="3.75" width="6.5" height="6.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect x="3.75" y="13.75" width="6.5" height="6.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect className="app-nav__mark-warm" x="13" y="13" width="8" height="8" rx="1.5" />
        </svg>
      </span>

      <ul className="app-nav__list">
        {GAMES.map(({ path, label, Icon }) => (
          <li key={path} className="app-nav__item">
            <NavLink to={path} className="app-nav__link">
              <Icon className="app-nav__icon" strokeWidth={1.75} aria-hidden="true" />
              <span className="app-nav__label">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <NavLink to="/profile" className="app-nav__link app-nav__link--profile" title={profile?.name}>
        <img className="app-nav__avatar" src={profile?.avatar} alt="" />
        <span className="app-nav__label">Profile</span>
      </NavLink>
    </nav>
  );
}

export default Navigation;
