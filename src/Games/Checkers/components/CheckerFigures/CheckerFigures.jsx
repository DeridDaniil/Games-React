import { useState, useRef } from 'react';
import Checker from '../Checker/Checker';
import { createPosition } from '../checkersHelper';
import './CheckerFigures.scss';

function CheckerFigures() {
  const [position, setPosition] = useState(createPosition);
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

    newPosition[axisY][axisX] = '';
    newPosition[y][x] = checker;

    setPosition(newPosition);
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