import PropTypes from 'prop-types';
import Button from '../../../../../shared/ui/Button/Button';

// An action under the move history (Take Back, Surrender): a quiet secondary button, or a danger
// one for actions that end the game.
const GameAction = ({ variant = 'default', icon = null, onClick, children }) => (
  <Button
    variant={variant === 'danger' ? 'danger' : 'secondary'}
    icon={icon}
    className="game-action"
    onClick={onClick}
  >
    {children}
  </Button>
);

GameAction.propTypes = {
  variant: PropTypes.oneOf(['default', 'danger']),
  icon: PropTypes.node,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired
};

export default GameAction;
