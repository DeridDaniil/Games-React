import arbiter from "./arbiter";

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
    if (position?.[axisY + moveY]?.[axisX] !== undefined && !position?.[axisY + moveY + moveY]?.[axisX] && position?.[axisY + moveY + moveY]?.[axisX] !== undefined) {
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

export const getCastlingMoves = ({ position, castleDirection, figure, axisY, axisX }) => {
  const moves = [];

  if (axisX !== 4 || axisY % 7 !== 0 || castleDirection === 'none') return moves;
  if (arbiter.isPlayerInCheck({ positionAfterMove: position, player: figure.slice(0, 5) })) return moves

  const us = figure.slice(0, 5);
  const y = us === 'white' ? 0 : 7;

  if (['left', 'both'].includes(castleDirection) &&
    !position[y][3] &&
    !position[y][2] &&
    !position[y][1] &&
    position[y][0] === `${us}-rook` &&
    !arbiter.isPlayerInCheck({
      positionAfterMove: arbiter.performMove({ position, figure, axisY, axisX, y, x: 3 }),
      player: us
    }) &&
    !arbiter.isPlayerInCheck({
      positionAfterMove: arbiter.performMove({ position, figure, axisY, axisX, y, x: 2 }),
      player: us
    })) {
    moves.push([y, 2]);
  }

  if (['right', 'both'].includes(castleDirection) &&
    !position[y][5] &&
    !position[y][6] &&
    position[y][7] === `${us}-rook` &&
    !arbiter.isPlayerInCheck({
      positionAfterMove: arbiter.performMove({ position, figure, axisY, axisX, y, x: 6 }),
      player: us
    }) &&
    !arbiter.isPlayerInCheck({
      positionAfterMove: arbiter.performMove({ position, figure, axisY, axisX, y, x: 5 }),
      player: us
    })) {
    moves.push([y, 6]);
  }

  return moves;
}

export const getCastleDirection = ({ castleDirection, figure, axisY, axisX }) => {
  if (figure.slice(6) === 'king') return 'none';
  const direction = castleDirection[figure.slice(0, 5)];
  const y = figure.slice(0, 5) === 'white' ? 0 : 7;

  if (Number(axisY) === y && Number(axisX) === 0) {
    if (direction === 'both') return 'right';
    if (direction === 'left') return 'none';
  }

  if (Number(axisY) === y && Number(axisX) === 7) {
    if (direction === 'both') return 'left';
    if (direction === 'right') return 'none';
  }
}

export const getKingPosition = (position, player) => {
  let kingPosition;

  position.forEach((axisY, y) => {
    axisY.forEach((_axisX, x) => {
      if (position[y][x] === `${player}-king`) kingPosition = [y, x];
    })
  })

  return kingPosition;
}

export const getFigures = (position, enemy) => {
  const enemyfigures = [];

  position.forEach((axisY, y) => {
    axisY.forEach((_axisX, x) => {
      if (position[y][x].slice(0, 5) === enemy) {
        enemyfigures.push({
          figure: position[y][x],
          axisY: y,
          axisX: x
        })
      }
    })
  })

  return enemyfigures;
}