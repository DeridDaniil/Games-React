import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Flag } from 'lucide-react';
import { MODAL_EXIT_MS } from '../../../../../shared/ui/Modal/Modal';
import GameAction from '../GameAction/GameAction';
import SurrenderDialog from './SurrenderDialog';

// Surrender action and its confirmation. What surrendering means is up to the game, which hears
// about it through onConfirm once the dialog has closed. Each answer counts once: another Cancel,
// Confirm or Escape while the dialog closes is ignored, and nothing fires after unmounting.
const SurrenderControl = ({ message, onConfirm }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState(0);
  const isClosingRef = useRef(false);
  const closeTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  const open = () => {
    if (isClosingRef.current) return;
    setSession(current => current + 1);
    setIsOpen(true);
  };

  const close = (afterClose) => {
    if (!isOpen || isClosingRef.current) return;
    isClosingRef.current = true;
    setIsOpen(false);
    closeTimerRef.current = setTimeout(() => {
      isClosingRef.current = false;
      afterClose?.();
    }, MODAL_EXIT_MS);
  };

  return (
    <>
      <GameAction variant="danger" icon={<Flag />} onClick={open}>Surrender</GameAction>
      <SurrenderDialog
        isOpen={isOpen}
        session={session}
        message={message}
        onCancel={() => close()}
        onConfirm={() => close(onConfirm)}
      />
    </>
  );
};

SurrenderControl.propTypes = {
  message: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired
};

export default SurrenderControl;
