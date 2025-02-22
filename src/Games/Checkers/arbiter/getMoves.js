export const getCheckerMoves = ({ position, checker, axisY, axisX }) => {
  const moves = [];
  const isWhite = checker.slice(0, 5) === 'white';
  const attackY = [1, -1];
  const moveX = [1, -1];
  const moveY = isWhite ? 1 : - 1;
  const enemy = isWhite ? 'black' : 'white';

  attackY.forEach(y => {
    moveX.forEach(x => {
      if ((isWhite && axisY <= 1) || (!isWhite && axisY >= 6)) {
        if (position[axisY + moveY][axisX + x] !== undefined && position[axisY + moveY][axisX + x].slice(0, 5) === enemy) {
          if (position?.[axisY + moveY + moveY]?.[axisX + x + x] !== undefined && !position[axisY + moveY + moveY][axisX + x + x]) {
            moves.push([axisY + moveY + moveY, axisX + x + x]);
          }
        }
      } else {
        if (position[axisY + y][axisX + x] !== undefined && position[axisY + y][axisX + x].slice(0, 5) === enemy) {
          if (position?.[axisY + y + y]?.[axisX + x + x] !== undefined && !position[axisY + y + y][axisX + x + x]) {
            moves.push([axisY + y + y, axisX + x + x]);
          }
        }
      }
    })
  })

  if (moves.length !== 0) return moves;

  moveX.forEach(x => {
    if ((isWhite && axisY !== 7) || (!isWhite && axisY !== 0)) {
      if (position[axisY + moveY][axisX + x] !== undefined && !position[axisY + moveY][axisX + x]) {
        moves.push([axisY + moveY, axisX + x]);
      }
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
      if ((isWhite && axisY <= 1) || (!isWhite && axisY >= 6)) {
        if (position[axisY + moveY][axisX + x] !== undefined && position[axisY + moveY][axisX + x].slice(0, 5) === enemy) {
          if (position?.[axisY + moveY + moveY]?.[axisX + x + x] !== undefined && !position[axisY + moveY + moveY][axisX + x + x]) {
            moves.push([axisY + moveY, axisX + x]);
          }
        }
      } else {
        if (position[axisY + y][axisX + x] !== undefined && position[axisY + y][axisX + x].slice(0, 5) === enemy) {
          if (position?.[axisY + y + y]?.[axisX + x + x] !== undefined && !position[axisY + y + y][axisX + x + x]) {
            moves.push([axisY + y, axisX + x]);
          }
        }
      }
    })
  })

  return moves;
}

export const getQueenMoves = ({ position, checker, axisY, axisX }) => {
  const moves = [];
  const us = checker.slice(0, 5);
  const enemy = us === 'white' ? 'black' : 'white';
  const directory = [
    [-1, 1],
    [-1, -1],
    [1, -1],
    [1, 1]
  ];

  directory.forEach(dir => {
    for (let i = 1; i < 8; i++) {
      const y = axisY + (i * dir[0]);
      const x = axisX + (i * dir[1]);
      if (position?.[y]?.[x] === undefined) break;
      if (position[y][x].slice(0, 5) === enemy) {
        if (position[y + dir[0]][x + dir[1]] !== undefined && !position[y + dir[0]][x + dir[1]]) {
          moves.push([y + dir[0], x + dir[1]]);
          break;
        }
        break;
      }
    };
  });

  if (moves.length > 0) return moves;

  directory.forEach(dir => {
    for (let i = 1; i < 8; i++) {
      const y = axisY + (i * dir[0]);
      const x = axisX + (i * dir[1]);
      if (position?.[y]?.[x] === undefined) break;
      if (position[y][x].slice(0, 5) === us) break;
      if (position[y][x].slice(0, 5) === enemy) break;
      moves.push([y, x]);
    };
  });

  return moves;
}

export const getQueenMAttack = ({ position, checker, axisY, axisX }) => {
  const moves = [];
  const us = checker.slice(0, 5);
  const enemy = us === 'white' ? 'black' : 'white';
  const directory = [
    [-1, 1],
    [-1, -1],
    [1, -1],
    [1, 1]
  ];

  directory.forEach(dir => {
    for (let i = 1; i < 8; i++) {
      const y = axisY + (i * dir[0]);
      const x = axisX + (i * dir[1]);
      if (position?.[y]?.[x] === undefined) break;
      if (position[y][x].slice(0, 5) === enemy) {
        if (position[y + dir[0]][x + dir[1]] !== undefined && !position[y + dir[0]][x + dir[1]]) {
          moves.push([y, x]);
          break;
        }
        break;
      }
    };
  });

  return moves;
}