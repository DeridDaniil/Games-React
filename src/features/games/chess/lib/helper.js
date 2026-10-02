export const createPosition = () => {
  const position = Array(8).fill('').map(() => Array(8).fill(''));

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

// Drag data written by Figure.onDragStart: "<colour>-<piece>, <y>, <x>".
const DRAG_DATA = /^((?:white|black)-(?:pawn|knight|bishop|rook|queen|king)), ([0-7]), ([0-7])$/;

// The dragged piece if the drag data describes a piece of the side to move standing on that
// square; null for anything else dropped on the board (other text, stale or spoofed data).
export const readDraggedFigure = (data, position, turn) => {
  const match = DRAG_DATA.exec(data ?? '');
  if (!match) return null;
  const [, figure, axisY, axisX] = match;
  const y = Number(axisY);
  const x = Number(axisX);
  if (position[y][x] !== figure || figure.slice(0, 5) !== turn) return null;
  return { figure, axisY: y, axisX: x };
}

export const PIECE_LETTERS = { king: 'K', queen: 'Q', rook: 'R', bishop: 'B', knight: 'N' };

// Simplified algebraic notation of a move, read from the position before it: "e4", "exd5", "Nf3",
// "Rxa7", "0-0", "0-0-0", "e8=Q". `promotesTo` is the name of the piece a pawn becomes.
export const getNewMoveNotation = ({ position, figure, axisY, axisX, y, x, promotesTo }) => {
  let note = '';

  axisY = Number(axisY);
  axisX = Number(axisX);

  if (figure.slice(6) === 'king' && Math.abs(axisX - x) === 2) {
    return x > axisX ? '0-0' : '0-0-0';
  }

  if (figure.slice(6) !== 'pawn') {
    note += PIECE_LETTERS[figure.slice(6)];
    if (position[y][x]) {
      note += 'x';
    }
  } else if (axisY !== y && axisX !== x) {
    note += String.fromCharCode(axisX + 97) + 'x';
  }

  note += String.fromCharCode(x + 97) + (y + 1);

  if (promotesTo) note += '=' + PIECE_LETTERS[promotesTo];

  return note;
}