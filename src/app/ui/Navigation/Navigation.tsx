import { NavLink } from 'react-router-dom';
import { CircleDot, Crown, Grid3x3 } from 'lucide-react';
import { useProfile } from '../../../features/profile/model/ProfileContext';
import BrandMark from '../../../shared/ui/BrandMark/BrandMark';
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
        <BrandMark />
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
