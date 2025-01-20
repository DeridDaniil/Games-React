import { useRef, useState } from 'react';
import Figure from '../Figure/Figure';
import './Figures.scss';
import { createPosition } from '../chessHelper';

function Figures() {
  const [position, setPosition] = useState(createPosition());
  const figuresRef = useRef(null);

  const onDrop = e => {
    const { width, left, top } = figuresRef.current.getBoundingClientRect();
    const size = width / 8;
    const y = Math.floor((e.clientY - left) / size);
    const x = Math.floor((e.clientX - top) / size);
    console.log(y, x);
    const [figure, axisY, axisX] = e.dataTransfer.getData('text').split(',');
    console.log(figure, axisY, axisX);
  };

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