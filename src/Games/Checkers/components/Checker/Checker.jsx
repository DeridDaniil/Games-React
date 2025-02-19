import arbiter from '../../arbiter/arbiter';
import { generateCandidateAttack, generateCandidateMoves } from '../../reducer/actions/move';
import { useCheckersContext } from '../../reducer/Context';
import './Checker.scss';

function Checker({ axisY, axisX, checker }) {
  const { checkersState, dispatch } = useCheckersContext();
  const { turn, position } = checkersState;
  const currentPosition = position[position.length - 1];

  const onDragStart = e => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${axisY}, ${axisX}, ${checker}`);
    setTimeout(() => {
      e.target.style.display = 'none';
    }, 0);
    if (turn === checker.slice(0, 5)) {
      const candidateMoves = arbiter.getRegularMoves({ position: currentPosition, checker, axisY, axisX });
      const candidateAttack = arbiter.getAttackingMoves({ position: currentPosition, checker, axisY, axisX });
      dispatch(generateCandidateAttack({ candidateAttack }));
      dispatch(generateCandidateMoves({ candidateMoves }));
    }
  }

  const onDragEnd = e => e.target.style.display = 'block';

  return (
    <div
      className={`checker ${checker} p-${axisY}${axisX}`}
      draggable={true}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    />
  )
}

export default Checker;