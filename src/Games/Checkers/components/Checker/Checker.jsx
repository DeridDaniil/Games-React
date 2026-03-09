import arbiter from '../../arbiter/arbiter';
import { generateCandidateAttack, generateCandidateMoves } from '../../reducer/actions/move';
import { useCheckersContext } from '../../reducer/Context';
import { Status } from '../../data/types';
import './Checker.scss';

function Checker({ axisY, axisX, checker }) {
  const { checkersState, dispatch } = useCheckersContext();
  const { turn, position, forcedCapturePieces, status } = checkersState;
  const currentPosition = position[position.length - 1];

  const gameOver = status !== Status.ongoing;
  const isOurTurn = turn === checker.slice(0, 5);
  const hasForcedCaptures = forcedCapturePieces && forcedCapturePieces.length > 0;
  const isForcedPiece = hasForcedCaptures && forcedCapturePieces.some(p => p[0] === axisY && p[1] === axisX);
  const canDrag = !gameOver && isOurTurn && (!hasForcedCaptures || isForcedPiece);

  const onDragStart = e => {
    if (!canDrag) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${axisY}, ${axisX}, ${checker}`);
    setTimeout(() => {
      e.target.style.display = 'none';
    }, 0);
    const candidateMoves = arbiter.getRegularMoves({ position: currentPosition, checker, axisY, axisX });
    const candidateAttack = arbiter.getAttackingMoves({ position: currentPosition, checker, axisY, axisX });
    dispatch(generateCandidateAttack({ candidateAttack }));
    dispatch(generateCandidateMoves({ candidateMoves }));
  }

  const onDragEnd = e => e.target.style.display = 'block';

  const classNames = [`checker`, checker, `p-${axisY}${axisX}`];
  if (isOurTurn && isForcedPiece) classNames.push('forced-capture');
  if (isOurTurn && hasForcedCaptures && !isForcedPiece) classNames.push('capture-blocked');

  return (
    <div
      className={classNames.join(' ')}
      draggable={canDrag}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    />
  )
}

export default Checker;