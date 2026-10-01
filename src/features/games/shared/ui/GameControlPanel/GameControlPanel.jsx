import PropTypes from 'prop-types';
import './GameControlPanel.scss';

// Side column next to the board: the game's own widgets on top, the row of actions at the bottom.
const GameControlPanel = ({ children, actions }) => (
  <div className="game-control-panel">
    {children}
    <div className="game-control-panel__actions">
      {actions}
    </div>
  </div>
);

GameControlPanel.propTypes = {
  children: PropTypes.node.isRequired,
  actions: PropTypes.node.isRequired
};

export default GameControlPanel;
