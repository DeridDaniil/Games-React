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
  newPosition[axisY][axisX] = '';
  newPosition[y][x] = figure;
  return newPosition;
};