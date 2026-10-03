import type { ReactNode } from 'react';
import './GameControlPanel.scss';

interface GameControlPanelProps {
  children: ReactNode;
  actions: ReactNode;
}

// Side column next to the board: the game's own widgets on top, the row of actions at the bottom.
const GameControlPanel = ({ children, actions }: GameControlPanelProps) => (
  <div className="game-control-panel">
    {children}
    <div className="game-control-panel__actions">
      {actions}
    </div>
  </div>
);

export default GameControlPanel;
