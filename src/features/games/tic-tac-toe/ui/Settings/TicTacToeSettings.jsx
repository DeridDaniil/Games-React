import { useTicTacToeSettings } from '../../model/TicTacToeSettingsContext';
import './TicTacToeSettings.scss';

function TicTacToeSettings() {
  const { settings, updateSettings } = useTicTacToeSettings();

  return (
    <div className="ttt-settings">
      <fieldset className="ttt-settings__group">
        <legend className="ttt-settings__label">Game Mode</legend>
        <div className="ttt-settings__options">
          <button
            type="button"
            className="ttt-settings__option"
            aria-pressed={settings.mode === 'friend'}
            onClick={() => updateSettings({ mode: 'friend' })}
          >
            vs Friend
          </button>
          <button
            type="button"
            className="ttt-settings__option"
            aria-pressed={settings.mode === 'computer'}
            onClick={() => updateSettings({ mode: 'computer' })}
          >
            vs Computer
          </button>
        </div>
      </fieldset>

      {settings.mode === 'computer' && (
        <fieldset className="ttt-settings__group">
          <legend className="ttt-settings__label">Difficulty</legend>
          <div className="ttt-settings__options">
            <button
              type="button"
              className="ttt-settings__option"
              aria-pressed={settings.difficulty === 'easy'}
              onClick={() => updateSettings({ difficulty: 'easy' })}
            >
              Easy
            </button>
            <button
              type="button"
              className="ttt-settings__option"
              aria-pressed={settings.difficulty === 'medium'}
              onClick={() => updateSettings({ difficulty: 'medium' })}
            >
              Medium
            </button>
            <button
              type="button"
              className="ttt-settings__option"
              aria-pressed={settings.difficulty === 'unbeatable'}
              onClick={() => updateSettings({ difficulty: 'unbeatable' })}
            >
              Unbeatable
            </button>
          </div>
        </fieldset>
      )}

      <fieldset className="ttt-settings__group">
        <legend className="ttt-settings__label">Board Size</legend>
        <div className="ttt-settings__options">
          {[3, 5, 7].map(size => (
            <button
              key={size}
              type="button"
              className="ttt-settings__option"
              aria-pressed={settings.boardSize === size}
              onClick={() => updateSettings({ boardSize: size })}
            >
              {size}x{size}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="ttt-settings__group">
        <legend className="ttt-settings__label">Your Side</legend>
        <div className="ttt-settings__options">
          <button
            type="button"
            className="ttt-settings__option"
            aria-pressed={settings.playerSide === 'X'}
            onClick={() => updateSettings({ playerSide: 'X' })}
          >
            X (first)
          </button>
          <button
            type="button"
            className="ttt-settings__option"
            aria-pressed={settings.playerSide === 'O'}
            onClick={() => updateSettings({ playerSide: 'O' })}
          >
            O (second)
          </button>
        </div>
      </fieldset>

      <p className="ttt-settings__hint">Choosing a different option starts a new game.</p>
    </div>
  );
}

export default TicTacToeSettings;
