import { useEffect, useState, useCallback } from 'react';
import './SurrenderModal.scss';

const SURRENDER_DELAY_MS = 2000;
const CLOSE_ANIMATION_MS = 250;

const SurrenderModal = ({ onCancel, onConfirm }) => {
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
    <div className={`surrender-modal ${isClosing ? 'surrender-modal--closing' : ''}`}>
      <div className="surrender-modal__backdrop" onClick={handleCancel} />
      <div className="surrender-modal__content">
        <h2 className="surrender-modal__title">Confirm Surrender</h2>
        <p className="surrender-modal__message">
          Are you sure you want to surrender? This will end the current game and start a new one
          from the initial position.
        </p>
        <div className="surrender-modal__actions">
          <button
            type="button"
            className="surrender-modal__button surrender-modal__button--cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={
              'surrender-modal__button surrender-modal__button--confirm ' +
              (canConfirm ? 'surrender-modal__button--active' : 'surrender-modal__button--waiting')
            }
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            <span className="surrender-modal__button-label">Surrender</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurrenderModal;
