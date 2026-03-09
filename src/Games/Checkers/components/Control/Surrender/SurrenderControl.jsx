import { useState } from 'react';
import { useCheckersContext } from '../../../reducer/Context';
import { surrender } from '../../../reducer/actions/move';
import Surrender from './Surrender';
import SurrenderModal from '../../Popup/SurrenderModal/SurrenderModal';

const SurrenderControl = () => {
  const [isSurrenderModalOpen, setIsSurrenderModalOpen] = useState(false);
  const { dispatch } = useCheckersContext();

  const openSurrenderModal = () => {
    setIsSurrenderModalOpen(true);
  };

  const closeSurrenderModal = () => {
    setIsSurrenderModalOpen(false);
  };

  const confirmSurrender = () => {
    dispatch(surrender());
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
