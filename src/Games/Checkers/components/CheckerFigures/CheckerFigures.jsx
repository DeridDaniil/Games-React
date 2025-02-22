import { useRef } from 'react';
import Checker from '../Checker/Checker';
import { useCheckersContext } from '../../reducer/Context';
import { clearCandidates, makeNewMove } from '../../reducer/actions/move';
import './CheckerFigures.scss';

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
      if ((player === 'white' && y === 7) || (player === 'black' && y === 0)) {
        newPosition[y][x] = player + '-queen';
      } else {
        newPosition[y][x] = checker;
      }

      if (checkersState.candidateAttack) {
        const direction = [[1, -1], [1, 1], [-1, 1], [-1, -1]];
        checkersState.candidateAttack.forEach(candidate => {
          direction.forEach(dir => {
            if (y + dir[0] === candidate[0] && x + dir[1] === candidate[1]) {
              newPosition[candidate[0]][candidate[1]] = '';
            }
          })
        });
      }
      dispatch(makeNewMove({ newPosition }));
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