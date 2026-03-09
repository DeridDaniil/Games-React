import { useTicTacToeSettings } from '../context/TicTacToeSettingsContext';
import './TicTacToeSettings.scss';

function TicTacToeSettings() {
  const { settings, updateSettings } = useTicTacToeSettings();

  return (
    <div className="ttt-settings">
      <div className="ttt-settings__section">
        <label className="ttt-settings__label">Game Mode</label>
        <div className="ttt-settings__btn-group">
          <button
            className={`ttt-settings__btn ${settings.mode === 'friend' ? 'active' : ''}`}
            onClick={() => updateSettings({ mode: 'friend' })}
          >
            vs Friend
          </button>
          <button
            className={`ttt-settings__btn ${settings.mode === 'computer' ? 'active' : ''}`}
            onClick={() => updateSettings({ mode: 'computer' })}
          >
            vs Computer
          </button>
        </div>
      </div>

      {settings.mode === 'computer' && (
        <div className="ttt-settings__section">
          <label className="ttt-settings__label">Difficulty</label>
          <div className="ttt-settings__btn-group">
            <button
              className={`ttt-settings__btn ${settings.difficulty === 'easy' ? 'active' : ''}`}
              onClick={() => updateSettings({ difficulty: 'easy' })}
            >
              Easy
            </button>
            <button
              className={`ttt-settings__btn ${settings.difficulty === 'medium' ? 'active' : ''}`}
              onClick={() => updateSettings({ difficulty: 'medium' })}
            >
              Medium
            </button>
            <button
              className={`ttt-settings__btn ${settings.difficulty === 'unbeatable' ? 'active' : ''}`}
              onClick={() => updateSettings({ difficulty: 'unbeatable' })}
            >
              Unbeatable
            </button>
          </div>
        </div>
      )}

      <div className="ttt-settings__section">
        <label className="ttt-settings__label">Board Size</label>
        <div className="ttt-settings__btn-group">
          {[3, 5, 7].map(size => (
            <button
              key={size}
              className={`ttt-settings__btn ${settings.boardSize === size ? 'active' : ''}`}
              onClick={() => updateSettings({ boardSize: size })}
            >
              {size}x{size}
            </button>
          ))}
        </div>
      </div>

      <div className="ttt-settings__section">
        <label className="ttt-settings__label">Your Side</label>
        <div className="ttt-settings__btn-group">
          <button
            className={`ttt-settings__btn ${settings.playerSide === 'X' ? 'active' : ''}`}
            onClick={() => updateSettings({ playerSide: 'X' })}
          >
            X (first)
          </button>
          <button
            className={`ttt-settings__btn ${settings.playerSide === 'O' ? 'active' : ''}`}
            onClick={() => updateSettings({ playerSide: 'O' })}
          >
            O (second)
          </button>
        </div>
      </div>

      <p className="ttt-settings__hint">Changes apply on next game restart.</p>
    </div>
  );
}

export default TicTacToeSettings;
