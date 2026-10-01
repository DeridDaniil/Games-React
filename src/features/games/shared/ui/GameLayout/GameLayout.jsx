import PropTypes from 'prop-types';
import './GameLayout.scss';

// Full-height page for a board game: the title, then the board area next to the side controls.
// `className` lets a game hang its own small overrides on the root element.
const GameLayout = ({ title, board, controls, className }) => (
  <div className={className ? `game-layout ${className}` : 'game-layout'}>
    <h1>{title}</h1>
    <div className="game-layout__body">
      <div className="game-layout__board">
        {board}
      </div>
      {controls}
    </div>
  </div>
);

GameLayout.propTypes = {
  title: PropTypes.string.isRequired,
  board: PropTypes.node.isRequired,
  controls: PropTypes.node.isRequired,
  className: PropTypes.string
};

export default GameLayout;
