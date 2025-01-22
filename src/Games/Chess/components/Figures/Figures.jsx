import { useRef, useState } from 'react';
import Figure from '../Figure/Figure';
import './Figures.scss';
import { createPosition } from '../chessHelper';

function Figures() {
  const [position, setPosition] = useState(createPosition());
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

    newPosition[axisY][axisX] = '';
    newPosition[y][x] = figure;

    setPosition(newPosition);
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