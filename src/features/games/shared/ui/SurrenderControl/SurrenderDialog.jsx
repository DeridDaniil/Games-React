import { useEffect, useId, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../../../../shared/ui/Modal/Modal';
import Button from '../../../../../shared/ui/Button/Button';
import './SurrenderDialog.scss';

export const SURRENDER_DELAY_MS = 2000;

// Message and buttons of the confirmation. It is mounted afresh for every opening, so Confirm
// always unlocks after the full delay; both buttons go inert as soon as the dialog starts closing.
const SurrenderPrompt = ({ messageId, message, isClosing, onCancel, onConfirm }) => {
  const [canConfirm, setCanConfirm] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCanConfirm(true), SURRENDER_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="surrender-dialog" style={{ '--surrender-delay': `${SURRENDER_DELAY_MS}ms` }}>
      <p id={messageId} className="surrender-dialog__message">{`Are you sure you want to surrender? ${message}`}</p>
      <div className="surrender-dialog__actions">
        <Button variant="ghost" disabled={isClosing} onClick={onCancel}>Cancel</Button>
        <Button
          variant="danger"
          className={canConfirm ? 'surrender-dialog__confirm' : 'surrender-dialog__confirm surrender-dialog__confirm--waiting'}
          disabled={!canConfirm || isClosing}
          onClick={onConfirm}
        >
          Surrender
        </Button>
      </div>
    </div>
  );
};

SurrenderPrompt.propTypes = {
  messageId: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  isClosing: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired
};

// The confirmation in the shared dialog shell, described by its message so the consequence is
// announced with the title; `session` changes with every opening.
const SurrenderDialog = ({ isOpen, session, message, onCancel, onConfirm }) => {
  const messageId = useId();

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Confirm Surrender" describedBy={messageId}>
      <SurrenderPrompt
        key={session}
        messageId={messageId}
        message={message}
        isClosing={!isOpen}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    </Modal>
  );
};

SurrenderDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  session: PropTypes.number.isRequired,
  message: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired
};

export default SurrenderDialog;
