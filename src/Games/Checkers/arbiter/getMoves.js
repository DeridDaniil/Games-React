export const getCheckerMoves = ({ position, checker, axisY, axisX }) => {
  const moves = [];
  const isWhite = checker.slice(0, 5) === 'white';
  const moveX = [1, -1];
  const y = isWhite ? 1 : - 1;
  const enemy = isWhite ? 'black' : 'white';

  moveX.forEach(x => {
    if (position[axisY + y][axisX + x] !== undefined && position[axisY + y][axisX + x].slice(0, 5) === enemy) {
      if (position[axisY + y + y][axisX + x + x] !== undefined && !position[axisY + y + y][axisX + x + x]) {
        moves.push([axisY + y + y, axisX + x + x]);
      }
    }
  });

  if (moves.length > 0) return moves;

  moveX.forEach(x => {
    if (position[axisY + y][axisX + x] !== undefined && !position[axisY + y][axisX + x]) {
      moves.push([axisY + y, axisX + x]);
    }
  });

  return moves;
}

export const getCheckerAttack = ({ position, checker, axisY, axisX }) => {
  let moves = [];
  const isWhite = checker.slice(0, 5) === 'white';
  const y = isWhite ? 1 : -1;
  const moveX = [1, -1];
  const enemy = isWhite ? 'black' : 'white';

  moveX.forEach(x => {
    if (position[axisY + y][axisX + x] !== undefined && position[axisY + y][axisX + x].slice(0, 5) === enemy) {
      moves.push([axisY + y, axisX + x])
    }
  })

  return moves;
}