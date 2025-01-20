import { useState } from 'react';
import Checker from '../Checker/Checker';
import './CheckerFigures.scss';
import { createPosition } from '../checkersHelper';

function CheckerFigures() {
  const [position, setPosition] = useState(createPosition);

  return (
    <div className="checker-figures">
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