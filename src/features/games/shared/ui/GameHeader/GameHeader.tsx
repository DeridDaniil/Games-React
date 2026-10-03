import { useState } from 'react';
import type { ReactNode } from 'react';
import { Info, SlidersHorizontal } from 'lucide-react';
import IconButton from '../../../../../shared/ui/IconButton/IconButton';
import Modal from '../../../../../shared/ui/Modal/Modal';
import './GameHeader.scss';

interface GameHeaderProps {
  title: string;
  context?: ReactNode;
  info?: ReactNode;
  settings?: ReactNode;
}

// Title row of a game page. Info and settings open in a dialog; each button only appears when
// the game passes that content in.
const GameHeader = ({ title, context = null, info = null, settings = null }: GameHeaderProps) => {
  const [openPanel, setOpenPanel] = useState<'info' | 'settings' | null>(null);
  const close = () => setOpenPanel(null);

  return (
    <header className="game-header">
      <div className="game-header__text">
        <h1 className="game-header__title">{title}</h1>
        {context && <p className="game-header__context">{context}</p>}
      </div>

      {(info || settings) && (
        <div className="game-header__actions">
          {info && (
            <IconButton label="Info" onClick={() => setOpenPanel('info')}>
              <Info aria-hidden="true" />
            </IconButton>
          )}
          {settings && (
            <IconButton label="Settings" onClick={() => setOpenPanel('settings')}>
              <SlidersHorizontal aria-hidden="true" />
            </IconButton>
          )}
        </div>
      )}

      {info && (
        <Modal isOpen={openPanel === 'info'} onClose={close} title={`${title} — Info`}>
          {info}
        </Modal>
      )}
      {settings && (
        <Modal isOpen={openPanel === 'settings'} onClose={close} title={`${title} — Settings`}>
          {settings}
        </Modal>
      )}
    </header>
  );
};

export default GameHeader;
