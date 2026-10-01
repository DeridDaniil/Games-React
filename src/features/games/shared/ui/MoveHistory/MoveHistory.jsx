import PropTypes from 'prop-types';
import './MoveHistory.scss';

// Moves are numbered in pairs by position (1, 1, 2, 2, …) and the stylesheet colours them and shows
// the number on every odd entry, so the list assumes White and Black strictly alternate. A checkers
// chain capture breaks that assumption (known "moves numbering" bug, kept as is).
const MoveHistory = ({ moves }) => (
  <div className="game-move-history">
    {moves.map((move, i) => (
      <div key={i} data-number={Math.floor(i / 2) + 1}>{move}</div>
    ))}
  </div>
);

MoveHistory.propTypes = {
  moves: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default MoveHistory;
