import { useState } from 'react';
import { useChessContext } from '../../../reducer/Context';
import { setupNewGame } from '../../../reducer/actions/game';
import Resign from './Resign';
import ResignModal from '../../Popup/ResignModal/ResignModal';

const ResignControl = () => {
  const [isResignModalOpen, setIsResignModalOpen] = useState(false);
  const { dispatch } = useChessContext();

  const openResignModal = () => {
    setIsResignModalOpen(true);
  };

  const closeResignModal = () => {
    setIsResignModalOpen(false);
  };

  const confirmResign = () => {
    dispatch(setupNewGame());
    setIsResignModalOpen(false);
  };

  return (
    <>
      <Resign onClick={openResignModal} />
      {isResignModalOpen && (
        <ResignModal onCancel={closeResignModal} onConfirm={confirmResign} />
      )}
    </>
  );
};

export default ResignControl;

