export const getCheckerMoves = ({ position, checker, axisY, axisX }) => {
  const moves = [];
  const isWhite = checker.slice(0, 5) === 'white';
  const attackY = [1, -1];
  const moveX = [1, -1];
  const moveY = isWhite ? 1 : - 1;
  const enemy = isWhite ? 'black' : 'white';

  attackY.forEach(y => {
    moveX.forEach(x => {
      if (axisY === 0 || axisY === 1 || axisY === 6 || axisY === 7) {
        if (position[axisY + moveY][axisX + x] !== undefined && position[axisY + moveY][axisX + x].slice(0, 5) === enemy) {
          if (position[axisY + moveY + moveY][axisX + x + x] !== undefined && !position[axisY + moveY + moveY][axisX + x + x]) {
            moves.push([axisY + moveY + moveY, axisX + x + x]);
          }
        }
      } else {
        if (position[axisY + y][axisX + x] !== undefined && position[axisY + y][axisX + x].slice(0, 5) === enemy) {
          if (position[axisY + y + y][axisX + x + x] !== undefined && !position[axisY + y + y][axisX + x + x]) {
            moves.push([axisY + y + y, axisX + x + x]);
          }
        }
      }
    })
  })

  if (moves.length !== 0) return moves;

  moveX.forEach(x => {
    if (position[axisY + moveY][axisX + x] !== undefined && !position[axisY + moveY][axisX + x]) {
      moves.push([axisY + moveY, axisX + x]);
    }
  });

  return moves;
}

export const getCheckerAttack = ({ position, checker, axisY, axisX }) => {
  const moves = [];
  const isWhite = checker.slice(0, 5) === 'white';
  const attackY = [1, -1];
  const moveX = [1, -1];
  const moveY = isWhite ? 1 : - 1;
  const enemy = isWhite ? 'black' : 'white';

  attackY.forEach(y => {
    moveX.forEach(x => {
      if (axisY === 0 || axisY === 1 || axisY === 6 || axisY === 7) {
        if (position[axisY + moveY][axisX + x] !== undefined && position[axisY + moveY][axisX + x].slice(0, 5) === enemy) {
          if (position[axisY + moveY + moveY][axisX + x + x] !== undefined && !position[axisY + moveY + moveY][axisX + x + x]) {
            moves.push([axisY + moveY, axisX + x]);
          }
        }
      } else {
        if (position[axisY + y][axisX + x] !== undefined && position[axisY + y][axisX + x].slice(0, 5) === enemy) {
          if (position[axisY + y + y][axisX + x + x] !== undefined && !position[axisY + y + y][axisX + x + x]) {
            moves.push([axisY + y, axisX + x]);
          }
        }
      }
    })
  })

  return moves;
}