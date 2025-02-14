export const createPosition = () => {
  const position = Array(8).fill('').map(_x => Array(8).fill(''));

  for (let i = 0; i < 8; i++) {
    position[1][i] = 'white-pawn';
    position[6][i] = 'black-pawn';
  }

  position[0][0] = 'white-rook';
  position[0][1] = 'white-knight';
  position[0][2] = 'white-bishop';
  position[0][3] = 'white-queen';
  position[0][4] = 'white-king';
  position[0][5] = 'white-bishop';
  position[0][6] = 'white-knight';
  position[0][7] = 'white-rook';

  position[7][0] = 'black-rook';
  position[7][1] = 'black-knight';
  position[7][2] = 'black-bishop';
  position[7][3] = 'black-queen';
  position[7][4] = 'black-king';
  position[7][5] = 'black-bishop';
  position[7][6] = 'black-knight';
  position[7][7] = 'black-rook';

  return position;
}

export const areSameColorTiles = (coords1, coords2) => (coords1.y + coords1.x) % 2 === (coords2.y + coords2.x) % 2;

export const findFiguresCoords = (position, type) => {
  const result = [];
  position.forEach((axisY, y) => {
    axisY.forEach((axisX, x) => {
      if (axisX === type) result.push({ y, x });
    })
  });
  return result;
}

export const getNewMoveNotation = ({ position, figure, axisY, axisX, y, x, promotesTo }) => {
  let note = '';

  axisY = Number(axisY);
  axisX = Number(axisX);

  if (figure.slice(6) === 'king' && Math.abs(axisX - x) === 2) {
    if (axisX > x) return '0-0';
    else return '0-0-0';
  }

  if (figure.slice(6) !== 'pawn') {
    note += figure.slice(6, 7).toUpperCase();
    if (position[y][x]) {
      note += 'x';
    }
  } else if (axisY !== y && axisX !== x) {
    note += String.fromCharCode(axisX + 97) + 'x';
  }

  note += String.fromCharCode(x + 97) + (y + 1);

  if (promotesTo) note += '=' + promotesTo.toUpperCase();

  return note;
}