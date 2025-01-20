import Board from '../../components/Board/Board';
import Figures from './components/Figures/Figures';
import './Chess.scss';

function Chess() {
  return (
    <div id='chess' className="chess">
      <h1>Шахматы</h1>
      <div className="chess-container">
        <Board />
        <Figures />
      </div>
    </div>
  )
};

export default Chess;