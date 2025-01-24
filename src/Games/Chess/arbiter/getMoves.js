export const getRookMoves = ({ position, figure, axisY, axisX }) => {
  const moves = [];
  const us = figure.slice(0, 5);
  const enemy = us === 'white' ? 'black' : 'white';
  const directory = [
    [-1, 0],
    [1, 0],
    [0, 1],
    [0, -1]
  ];

  directory.forEach(dir => {
    for (let i = 1; i < 8; i++) {
      const y = axisY + (i * dir[0]);
      const x = axisX + (i * dir[1]);
      if (position?.[y]?.[x] === undefined) break;
      if (position[y][x].slice(0, 5) === us) break;
      if (position[y][x].slice(0, 5) === enemy) {
        moves.push([y, x]);
        break;
      };
      moves.push([y, x]);
    };
  });

  return moves;
}

export const getKnightMoves = ({ position, figure, axisY, axisX }) => {
  const moves = [];
  const us = figure.slice(0, 5);
  const directions = [
    [2, -1],
    [2, 1],
    [-2, -1],
    [-2, 1],
    [1, -2],
    [1, 2],
    [-1, -2],
    [-1, 2]
  ];

  directions.forEach(dir => {
    const cell = position?.[axisY + dir[0]]?.[axisX + dir[1]];
    if (cell !== undefined && cell.slice(0, 5) !== us) {
      moves.push([axisY + dir[0], axisX + dir[1]]);
      console.log(cell.slice(0, 5), us);
    }
  })

  return moves;
}