import PropTypes from 'prop-types';
import './GameAction.scss';

// Large action tile under the move history (Take Back, Surrender). Still a clickable <div>:
// switching to <button> belongs to the planned accessibility pass, not to this refactor.
const GameAction = ({ variant = 'default', onClick, children }) => (
  <div className={variant === 'default' ? 'game-action' : `game-action game-action--${variant}`} onClick={onClick}>
    <span>{children}</span>
  </div>
);

GameAction.propTypes = {
  variant: PropTypes.oneOf(['default', 'danger']),
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired
};

export default GameAction;
