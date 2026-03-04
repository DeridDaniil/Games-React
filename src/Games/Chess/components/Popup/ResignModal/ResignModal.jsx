import { useEffect, useState, useCallback } from 'react';
import './ResignModal.scss';

const RESIGN_DELAY_MS = 2000;
const CLOSE_ANIMATION_MS = 250;

const ResignModal = ({ onCancel, onConfirm }) => {
  const [canConfirm, setCanConfirm] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCanConfirm(true), RESIGN_DELAY_MS);
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
    <div className={`resign-modal ${isClosing ? 'resign-modal--closing' : ''}`}>
      <div className="resign-modal__backdrop" onClick={handleCancel} />
      <div className="resign-modal__content">
        <h2 className="resign-modal__title">Confirm Resignation</h2>
        <p className="resign-modal__message">
          Are you sure you want to resign? This will end the current game and start a new one
          from the initial position.
        </p>
        <div className="resign-modal__actions">
          <button
            type="button"
            className="resign-modal__button resign-modal__button--cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={
              'resign-modal__button resign-modal__button--confirm ' +
              (canConfirm ? 'resign-modal__button--active' : 'resign-modal__button--waiting')
            }
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            <span className="resign-modal__button-label">Resign</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResignModal;
