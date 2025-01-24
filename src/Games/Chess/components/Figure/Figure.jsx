import arbiter from '../../arbiter/arbiter';
import { generateCandidateMoves } from '../../reducer/actions/move';
import { useChessContext } from '../../reducer/Context';
import './Figure.scss';

function Figure({ axisY, axisX, figure }) {

  const { chessState, dispatch } = useChessContext();
  const { turn, position } = chessState;
  const currentPosition = position[position.length - 1];
  const prevPosition = position[position.length - 2];

  const onDragStart = e => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${figure}, ${axisY}, ${axisX}`);
    setTimeout(() => {
      e.target.style.display = 'none';
    }, 0);
    if (turn === figure.slice(0, 5)) {
      const candidateMoves = arbiter.getValidMoves({ position: currentPosition, prevPosition, figure, axisY, axisX });
      dispatch(generateCandidateMoves({ candidateMoves }));
    }
  }

  const onDragEnd = e => e.target.style.display = 'block';

  return (
    <div
      className={`figure ${figure} p-${axisY}${axisX}`}
      draggable={true}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    />
  )
}

export default Figure;