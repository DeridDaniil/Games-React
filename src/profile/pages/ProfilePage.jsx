import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../ProfileContext';
import { defaultAvatar, resizeImage } from '../constants';
import './ProfilePage.scss';

const gameLabels = {
  tictactoe: 'Tic Tac Toe',
  chess: 'Chess',
  checkers: 'Checkers',
};

function ProfilePage() {
  const { profile, updateProfile, resetStats, logout } = useProfile();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [confirmReset, setConfirmReset] = useState(null);
  const fileInputRef = useRef(null);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    updateProfile({ name: trimmed, avatar });
    setEditing(false);
  };

  const handleCancel = () => {
    setName(profile.name);
    setAvatar(profile.avatar);
    setEditing(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    try {
      const resized = await resizeImage(file);
      setAvatar(resized);
    } catch {
      // ignore invalid images
    }
    e.target.value = '';
  };

  const handleRemoveAvatar = () => {
    setAvatar(defaultAvatar);
  };

  const handleResetStats = (game) => {
    resetStats(game);
    setConfirmReset(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/profile/create');
  };

  const hasCustomAvatar = avatar !== defaultAvatar;

  const totalStats = Object.values(profile.stats).reduce(
    (acc, s) => ({
      wins: acc.wins + s.wins,
      losses: acc.losses + s.losses,
      draws: acc.draws + s.draws,
    }),
    { wins: 0, losses: 0, draws: 0 }
  );
  totalStats.total = totalStats.wins + totalStats.losses + totalStats.draws;

  return (
    <div className="profile-page">
      <div className="profile-page__card">
        <div className="profile-page__header">
          <div className="profile-page__avatar-wrapper">
            <img src={editing ? avatar : profile.avatar} alt="avatar" className="profile-page__avatar" />
            {editing && (
              <button
                className="profile-page__avatar-edit"
                onClick={() => fileInputRef.current?.click()}
                title="Upload photo"
              >
                +
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </div>

          <div className="profile-page__info">
            {editing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="profile-page__name-input"
                maxLength={20}
                autoFocus
              />
            ) : (
              <h1 className="profile-page__name">{profile.name}</h1>
            )}
            <p className="profile-page__login">@{profile.login}</p>
            <p className="profile-page__total">
              {totalStats.total} games played
            </p>
          </div>

          <div className="profile-page__actions">
            {editing ? (
              <>
                <button className="profile-page__btn save" onClick={handleSave} disabled={!name.trim()}>Save</button>
                <button className="profile-page__btn cancel" onClick={handleCancel}>Cancel</button>
              </>
            ) : (
              <button className="profile-page__btn edit" onClick={() => setEditing(true)}>Edit</button>
            )}
          </div>
        </div>

        {editing && hasCustomAvatar && (
          <button className="profile-page__remove-avatar" onClick={handleRemoveAvatar}>
            Remove photo
          </button>
        )}

        <div className="profile-page__stats">
          <h2>Statistics</h2>
          <div className="profile-page__stats-grid">
            {Object.entries(gameLabels).map(([key, label]) => {
              const s = profile.stats[key];
              const total = s.wins + s.losses + s.draws;
              const winRate = total > 0 ? Math.round((s.wins / total) * 100) : 0;
              return (
                <div key={key} className="profile-page__stat-card">
                  <div className="profile-page__stat-header">
                    <h3>{label}</h3>
                    {confirmReset === key ? (
                      <div className="profile-page__confirm-reset">
                        <button onClick={() => handleResetStats(key)}>Yes</button>
                        <button onClick={() => setConfirmReset(null)}>No</button>
                      </div>
                    ) : (
                      <button
                        className="profile-page__reset-btn"
                        onClick={() => setConfirmReset(key)}
                        title="Reset stats"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="profile-page__stat-row">
                    <span className="win">W: {s.wins}</span>
                    <span className="loss">L: {s.losses}</span>
                    <span className="draw">D: {s.draws}</span>
                  </div>
                  <div className="profile-page__stat-bar">
                    <div className="profile-page__stat-fill" style={{ width: `${winRate}%` }}></div>
                  </div>
                  <p className="profile-page__stat-rate">
                    {total > 0 ? `${winRate}% win rate — ${total} games` : 'No games yet'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <button className="profile-page__logout" onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </div>
  );
}

export default ProfilePage;
