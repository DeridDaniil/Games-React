import type { ReactNode } from 'react';
import Button from '../../../../../shared/ui/Button/Button';

interface GameActionProps {
  variant?: 'default' | 'danger';
  icon?: ReactNode;
  onClick: () => void;
  children: ReactNode;
}

// An action under the move history (Take Back, Surrender): a quiet secondary button, or a danger
// one for actions that end the game.
const GameAction = ({ variant = 'default', icon = null, onClick, children }: GameActionProps) => (
  <Button
    variant={variant === 'danger' ? 'danger' : 'secondary'}
    icon={icon}
    className="game-action"
    onClick={onClick}
  >
    {children}
  </Button>
);

export default GameAction;
