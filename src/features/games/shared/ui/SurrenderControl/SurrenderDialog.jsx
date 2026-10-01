import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './SurrenderDialog.scss';

const SURRENDER_DELAY_MS = 2000;
const CLOSE_ANIMATION_MS = 250;

// Confirm unlocks only after a short delay; both answers play the close animation first.
const SurrenderDialog = ({ message, onCancel, onConfirm }) => {
  const [canConfirm, setCanConfirm] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCanConfirm(true), SURRENDER_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const animateClose = useCallback((callback) => {
    setIsClosing(true);
    setTimeout(callback, CLOSE_ANIMATION_MS);
  }, []);

  const handleCancel = () => {
    animateClose(onCancel);
  };

  const handleConfirm = () => {
    if (!canConfirm) return;
    animateClose(onConfirm);
  };

  return (
    <div className={isClosing ? 'game-surrender-dialog game-surrender-dialog--closing' : 'game-surrender-dialog'}>
      <div className="game-surrender-dialog__backdrop" onClick={handleCancel} />
      <div className="game-surrender-dialog__content">
        <h2 className="game-surrender-dialog__title">Confirm Surrender</h2>
        <p className="game-surrender-dialog__message">
          {`Are you sure you want to surrender? ${message}`}
        </p>
        <div className="game-surrender-dialog__actions">
          <button
            type="button"
            className="game-surrender-dialog__button game-surrender-dialog__button--cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={
              'game-surrender-dialog__button game-surrender-dialog__button--confirm ' +
              (canConfirm ? 'game-surrender-dialog__button--active' : 'game-surrender-dialog__button--waiting')
            }
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            <span className="game-surrender-dialog__button-label">Surrender</span>
          </button>
        </div>
      </div>
    </div>
  );
};

SurrenderDialog.propTypes = {
  message: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired
};

export default SurrenderDialog;
