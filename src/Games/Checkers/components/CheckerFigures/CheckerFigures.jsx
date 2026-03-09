import { useRef } from 'react';
import Checker from '../Checker/Checker';
import { useCheckersContext } from '../../reducer/Context';
import { clearCandidates, makeNewMove, continueCapture, startClock } from '../../reducer/actions/move';
import arbiter from '../../arbiter/arbiter';
import './CheckerFigures.scss';

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

const getMoveNotation = (fromY, fromX, toY, toX, isCapture) => {
  const from = files[fromX] + (fromY + 1);
  const to = files[toX] + (toY + 1);
  return isCapture ? `${from}x${to}` : `${from}-${to}`;
};

function CheckerFigures() {
  const { checkersState, dispatch } = useCheckersContext();
  const position = checkersState.position[checkersState.position.length - 1];
  const figuresRef = useRef(null);

  const calculateCoords = e => {
    const { width, top, left } = figuresRef.current.getBoundingClientRect();
    const size = width / 8;
    const y = 7 - Math.floor((e.clientY - top) / size);
    const x = Math.floor((e.clientX - left) / size);
    return { y, x };
  }

  const onDrop = e => {
    const newPosition = position.map(axisY => axisY.map(axisX => axisX));
    const { y, x } = calculateCoords(e);
    const [axisY, axisX, checker] = e.dataTransfer.getData('text').split(', ');
    const player = checker.slice(0, 5)

    if (checkersState.candidateMoves?.find(m => m[0] === y && m[1] === x)) {
      newPosition[axisY][axisX] = '';
      let landedPiece = checker;
      if ((player === 'white' && y === 7) || (player === 'black' && y === 0)) {
        landedPiece = player + '-queen';
      }
      newPosition[y][x] = landedPiece;

      let wasCapture = false;
      if (checkersState.candidateAttack && checkersState.candidateAttack.length > 0) {
        const direction = [[1, -1], [1, 1], [-1, 1], [-1, -1]];
        checkersState.candidateAttack.forEach(candidate => {
          direction.forEach(dir => {
            if (y + dir[0] === candidate[0] && x + dir[1] === candidate[1]) {
              newPosition[candidate[0]][candidate[1]] = '';
              wasCapture = true;
            }
          })
        });
      }

      const newMove = getMoveNotation(Number(axisY), Number(axisX), y, x, wasCapture);

      if (!checkersState.clockStarted) {
        dispatch(startClock());
      }

      if (wasCapture) {
        const furtherAttacks = arbiter.getAttackingMoves({ position: newPosition, checker: landedPiece, axisY: y, axisX: x });
        if (furtherAttacks.length > 0) {
          dispatch(continueCapture({ newPosition, chainCapturePiece: [y, x], newMove }));
          dispatch(clearCandidates());
          return;
        }
      }

      dispatch(makeNewMove({ newPosition, newMove }));
    }
    dispatch(clearCandidates());
  }

  const onDragOver = e => e.preventDefault();

  return (
    <div className="checker-figures" onDrop={onDrop} onDragOver={onDragOver} ref={figuresRef}>
      {position.map((axisY, y) =>
        axisY.map((_axisX, x) =>
          position[y][x] ?
            <Checker
              key={y + '-' + x}
              axisY={y}
              axisX={x}
              checker={position[y][x]}
            /> : null
        )
      )}
    </div>
  )
}

export default CheckerFigures;