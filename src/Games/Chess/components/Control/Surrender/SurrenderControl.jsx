import { useState } from 'react';
import { useChessContext } from '../../../reducer/Context';
import { setupNewGame } from '../../../reducer/actions/game';
import Surrender from './Surrender';
import SurrenderModal from '../../Popup/SurrenderModal/SurrenderModal';

const SurrenderControl = () => {
  const [isSurrenderModalOpen, setIsSurrenderModalOpen] = useState(false);
  const { dispatch } = useChessContext();

  const openSurrenderModal = () => {
    setIsSurrenderModalOpen(true);
  };

  const closeSurrenderModal = () => {
    setIsSurrenderModalOpen(false);
  };

  const confirmSurrender = () => {
    dispatch(setupNewGame());
    setIsSurrenderModalOpen(false);
  };

  return (
    <>
      <Surrender onClick={openSurrenderModal} />
      {isSurrenderModalOpen && (
        <SurrenderModal onCancel={closeSurrenderModal} onConfirm={confirmSurrender} />
      )}
    </>
  );
};

export default SurrenderControl;

