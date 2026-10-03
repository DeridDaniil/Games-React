import type { ReactNode } from 'react';
import './GameLayout.scss';

interface GameLayoutProps {
  header: ReactNode;
  board: ReactNode;
  controls: ReactNode;
  className?: string;
}

// Page of a board game: the header, then the board with the side panel next to it on wide screens
// and under it on narrow ones. The layout also sizes the board (--board-size, --cell-size).
// `className` lets a game hang its own overrides on the root element.
const GameLayout = ({ header, board, controls, className = '' }: GameLayoutProps) => (
  <div className={className ? `game-layout ${className}` : 'game-layout'}>
    {header}
    <div className="game-layout__body">
      <div className="game-layout__board">
        {board}
      </div>
      <div className="game-layout__side">
        {controls}
      </div>
    </div>
  </div>
);

export default GameLayout;
