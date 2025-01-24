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
    }
  })

  return moves;
}

export const getBishopMoves = ({ position, figure, axisY, axisX }) => {
  const moves = [];
  const us = figure.slice(0, 5);
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

export const getQueenMoves = ({ position, figure, axisY, axisX }) => {
  const moves = [
    ...getRookMoves({ position, figure, axisY, axisX }),
    ...getBishopMoves({ position, figure, axisY, axisX })
  ];
  return moves;
}

export const getKingMoves = ({ position, figure, axisY, axisX }) => {
  const moves = [];
  const us = figure.slice(0, 5);
  const directions = [
    [0, 1],
    [0, -1],
    [1, 0],
    [1, -1],
    [1, 1],
    [-1, 0],
    [-1, 1],
    [-1, -1],
  ];

  directions.forEach(dir => {
    const cell = position?.[axisY + dir[0]]?.[axisX + dir[1]];
    if (cell !== undefined && cell.slice(0, 5) !== us) {
      moves.push([axisY + dir[0], axisX + dir[1]]);
    }
  })

  return moves;
}

export const getPawnMoves = ({ position, figure, axisY, axisX }) => {
  const moves = [];
  const isWhite = figure.slice(0, 5) === 'white';
  const moveY = isWhite ? 1 : -1;
  const moveX = [1, -1];
  const enemy = isWhite ? 'black' : 'white';

  if (!position?.[axisY + moveY]?.[axisX]) {
    moves.push([axisY + moveY, axisX]);
  }

  if (axisY % 5 === 1) {
    if (position?.[axisY + moveY]?.[axisX] !== undefined && !position?.[axisY + moveY + moveY]?.[axisX]) {
      moves.push([axisY + moveY + moveY, axisX]);
    }
  }

  moveX.forEach(x => {
    if (position?.[axisY + moveY]?.[axisX + x] !== undefined && position?.[axisY + moveY]?.[axisX + x].slice(0, 5) === enemy) {
      moves.push([axisY + moveY, axisX + x]);
    }
  });

  return moves;
}

export const getPawnCaptures = ({ position, prevPosition, figure, axisY, axisX }) => {
  const moves = [];
  const moveY = figure.slice(0, 5) === 'white' ? 1 : -1;
  const moveX = [1, -1];
  const enemyPawn = moveY === 1 ? 'black-pawn' : 'white-pawn';
  if (prevPosition) {
    if ((moveY === 1 && axisY === 4) || (moveY === -1 && axisY === 3)) {
      moveX.forEach(x => {
        if (position?.[axisY]?.[axisX + x] === enemyPawn &&
          position?.[axisY + moveY + moveY]?.[axisX + x] === '' &&
          prevPosition?.[axisY]?.[axisX + x] === '' &&
          prevPosition?.[axisY + moveY + moveY]?.[axisX + x] === enemyPawn
        ) {
          moves.push([axisY + moveY, axisX + x]);
        }
      })
    }
  }
  return moves;
}