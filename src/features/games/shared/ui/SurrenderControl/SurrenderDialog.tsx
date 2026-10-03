import { useEffect, useId, useState } from 'react';
import type { CSSProperties } from 'react';
import Modal from '../../../../../shared/ui/Modal/Modal';
import Button from '../../../../../shared/ui/Button/Button';
import './SurrenderDialog.scss';

export const SURRENDER_DELAY_MS = 2000;

// The unlock delay handed to the stylesheet as a custom property.
type PromptStyle = CSSProperties & { '--surrender-delay': string };
const promptStyle: PromptStyle = { '--surrender-delay': `${SURRENDER_DELAY_MS}ms` };

interface SurrenderPromptProps {
  messageId: string;
  message: string;
  isClosing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

// Message and buttons of the confirmation. It is mounted afresh for every opening, so Confirm
// always unlocks after the full delay; both buttons go inert as soon as the dialog starts closing.
const SurrenderPrompt = ({ messageId, message, isClosing, onCancel, onConfirm }: SurrenderPromptProps) => {
  const [canConfirm, setCanConfirm] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCanConfirm(true), SURRENDER_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="surrender-dialog" style={promptStyle}>
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

interface SurrenderDialogProps {
  isOpen: boolean;
  session: number;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}

// The confirmation in the shared dialog shell, described by its message so the consequence is
// announced with the title; `session` changes with every opening.
const SurrenderDialog = ({ isOpen, session, message, onCancel, onConfirm }: SurrenderDialogProps) => {
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

export default SurrenderDialog;
