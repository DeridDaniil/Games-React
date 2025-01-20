import Board from '../../components/Board/Board';
import CheckerFigures from './components/CheckerFigures/CheckerFigures';
import './Checkers.scss';

function Checkers() {
  return (
    <div id='checkers' className="checkers">
      <h1>Шашки</h1>
      <div className="checkers-container">
        <Board />
        <CheckerFigures />
      </div>
    </div>
  )
};

export default Checkers;