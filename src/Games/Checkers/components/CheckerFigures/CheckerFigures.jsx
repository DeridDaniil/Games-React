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

    if (checkersState.candidateMoves?.find(m => m[0] === y && m[1] === x)) {
      newPosition[axisY][axisX] = '';
      newPosition[y][x] = checker;

      if (checkersState.candidateAttack) {
        checkersState.candidateAttack.forEach(candidate => {
          if ((Number(axisY) + y) / 2 === candidate[0] &&
            (Number(axisX) + x) / 2 === candidate[1]) {
            newPosition[candidate[0]][candidate[1]] = '';
          }
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