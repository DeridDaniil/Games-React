import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HardDrive, LogOut, Pencil } from 'lucide-react';
import { useProfile } from '../../model/ProfileContext';
import { countOf, summarizeAll } from '../../lib/stats';
import Button from '../../../../shared/ui/Button/Button';
import ProfileEditForm from '../ProfileEditForm/ProfileEditForm';
import GameStats from '../GameStats/GameStats';
import type { ProfileChanges } from '../../model/types';
import './ProfilePage.scss';

const OVERVIEW: readonly { key: keyof ReturnType<typeof summarizeAll>; label: string }[] = [
  { key: 'played', label: 'Games' },
  { key: 'wins', label: 'Wins' },
  { key: 'losses', label: 'Losses' },
  { key: 'draws', label: 'Draws' },
];

// The signed-in player's page: who they are, how their games went, and the account itself.
function ProfilePage() {
  const { profile, updateProfile, resetStats, logout } = useProfile();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const editButtonId = useId();
  const wasEditingRef = useRef(false);

  // Leaving edit mode puts focus back on the button that opened it.
  useEffect(() => {
    if (wasEditingRef.current && !isEditing) document.getElementById(editButtonId)?.focus();
    wasEditingRef.current = isEditing;
  }, [isEditing, editButtonId]);

  if (!profile) return null;

  const totals = summarizeAll(profile.stats);

  const handleSave = (changes: ProfileChanges) => {
    updateProfile(changes);
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/profile/create', { replace: true });
  };

  return (
    <div className="profile-page">
      {isEditing ? (
        <ProfileEditForm profile={profile} onSave={handleSave} onCancel={() => setIsEditing(false)} />
      ) : (
        <header className="profile-identity">
          <img className="profile-identity__avatar" src={profile.avatar} alt="" width="80" height="80" />
          <div className="profile-identity__text">
            <h1 className="profile-identity__name">{profile.name}</h1>
            <p className="profile-identity__meta">
              <span>@{profile.login}</span>
              <span className="profile-identity__dot" aria-hidden="true">·</span>
              <span>{`${countOf(totals.played, 'game')} played`}</span>
            </p>
          </div>
          <Button
            id={editButtonId}
            className="profile-identity__edit"
            icon={<Pencil />}
            onClick={() => setIsEditing(true)}
          >
            Edit profile
          </Button>
        </header>
      )}

      <section className="profile-section" aria-labelledby="profile-overview-title">
        <h2 id="profile-overview-title" className="profile-section__title">Overview</h2>
        <dl className="profile-overview">
          {OVERVIEW.map(({ key, label }) => (
            <div key={key} className="profile-overview__item">
              <dt className="profile-overview__label">{label}</dt>
              <dd className="profile-overview__value">{totals[key]}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="profile-section" aria-labelledby="profile-games-title">
        <h2 id="profile-games-title" className="profile-section__title">Games</h2>
        <p className="profile-section__hint">
          Against the computer the result is yours. When two people share the screen, it counts for White
          in Chess and Checkers and for X in Tic Tac Toe.
        </p>
        <GameStats stats={profile.stats} onReset={resetStats} />
      </section>

      <section className="profile-section" aria-labelledby="profile-account-title">
        <h2 id="profile-account-title" className="profile-section__title">Account</h2>
        <div className="profile-account">
          <p className="profile-account__note">
            <HardDrive aria-hidden="true" />
            <span>
              Profiles and statistics are stored on this device. Logging out keeps them here, so you can sign
              in again later.
            </span>
          </p>
          <Button variant="danger" icon={<LogOut />} onClick={handleLogout}>Log out</Button>
        </div>
      </section>
    </div>
  );
}

export default ProfilePage;
