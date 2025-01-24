import { useRef } from 'react';
import { useChessContext } from '../../reducer/Context';
import { clearCandidates, makeNewMove } from '../../reducer/actions/move';
import Figure from '../Figure/Figure';
import './Figures.scss';

function Figures() {
  const { chessState, dispatch } = useChessContext();
  const position = chessState.position[chessState.position.length - 1];
  const figuresRef = useRef(null);

  const calculateCoord = e => {
    const { width, left, top } = figuresRef.current.getBoundingClientRect();
    const size = width / 8;
    const y = 7 - Math.floor((e.clientY - top) / size);
    const x = Math.floor((e.clientX - left) / size);
    return { y, x };
  }

  const onDrop = e => {
    const newPosition = position.map(axisY => axisY.map(axisX => axisX));
    const { y, x } = calculateCoord(e);
    const [figure, axisY, axisX] = e.dataTransfer.getData('text').split(', ');

    if (chessState.candidateMoves?.find(m => m[0] === y && m[1] === x)) {
      newPosition[axisY][axisX] = '';
      newPosition[y][x] = figure;
      dispatch(makeNewMove({ newPosition }));
    }

    dispatch(clearCandidates());
  }

  const onDragOver = e => e.preventDefault();

  return (
    <div className="figures" onDrop={onDrop} onDragOver={onDragOver} ref={figuresRef}>
      {position.map((axixY, y) =>
        axixY.map((_axisX, x) =>
          position[y][x] ?
            <Figure
              key={y + '-' + x}
              axisY={y}
              axisX={x}
              figure={position[y][x]}
            />
            : null
        )
      )}
    </div>
  )
}

export default Figures;