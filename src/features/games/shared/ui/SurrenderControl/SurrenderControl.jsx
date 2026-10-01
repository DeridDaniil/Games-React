import { useState } from 'react';
import PropTypes from 'prop-types';
import GameAction from '../GameAction/GameAction';
import SurrenderDialog from './SurrenderDialog';

// Surrender tile and its confirmation dialog. What surrendering does is up to the game,
// which only hears about a confirmed surrender through onConfirm.
const SurrenderControl = ({ message, onConfirm }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const confirmSurrender = () => {
    onConfirm();
    setIsDialogOpen(false);
  };

  return (
    <>
      <GameAction variant="danger" onClick={() => setIsDialogOpen(true)}>Surrender</GameAction>
      {isDialogOpen && (
        <SurrenderDialog
          message={message}
          onCancel={() => setIsDialogOpen(false)}
          onConfirm={confirmSurrender}
        />
      )}
    </>
  );
};

SurrenderControl.propTypes = {
  message: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired
};

export default SurrenderControl;
