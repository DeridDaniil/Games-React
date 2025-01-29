export const movePawns = ({ position, figure, axisY, axisX, y, x }) => {
  const newPosition = position.map(axisY => axisY.map(axixX => axixX));

  if (!newPosition[y][x] && y !== axisY && x != axisX) {
    newPosition[axisY][x] = '';
  }

  newPosition[axisY][axisX] = '';
  newPosition[y][x] = figure;
  return newPosition;
};

export const moveFigures = ({ position, figure, axisY, axisX, y, x }) => {
  const newPosition = position.map(axisY => axisY.map(axixX => axixX));

  if (figure.slice(6) === 'king' && Math.abs(x - axisX) > 1) {
    if (x === 2) {
      newPosition[axisY][0] = '';
      newPosition[axisY][3] = `${figure.slice(0, 5)}-rook`;
    }
    if (x === 6) {
      newPosition[axisY][7] = '';
      newPosition[axisY][5] = `${figure.slice(0, 5)}-rook`;
    }
  }

  newPosition[axisY][axisX] = '';
  newPosition[y][x] = figure;
  return newPosition;
};