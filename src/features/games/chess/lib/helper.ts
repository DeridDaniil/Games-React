import type { ChessCell, ChessPiece, ChessPieceType, ChessPosition, PromotionPiece } from '../model/types';
import type { PlayerColor } from '../../shared/model/types';

const PIECE_TYPES: readonly ChessPieceType[] = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];

// "white-knight" → "white".
export const pieceColor = (piece: ChessPiece): PlayerColor => (piece.startsWith('white') ? 'white' : 'black');

// "white-knight" → "knight".
export const pieceType = (piece: ChessPiece): ChessPieceType => {
  const type = PIECE_TYPES.find(name => piece.endsWith(`-${name}`));
  if (!type) throw new Error(`Not a chess piece: "${piece}"`);
  return type;
};

export const createPosition = (): ChessPosition => {
  const position = Array.from({ length: 8 }, () => Array<ChessCell>(8).fill(''));

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

interface Coords {
  y: number;
  x: number;
}

export const areSameColorTiles = (coords1: Coords, coords2: Coords): boolean => (coords1.y + coords1.x) % 2 === (coords2.y + coords2.x) % 2;

export const findFiguresCoords = (position: ChessPosition, type: ChessPiece): Coords[] => {
  const result: Coords[] = [];
  position.forEach((axisY, y) => {
    axisY.forEach((axisX, x) => {
      if (axisX === type) result.push({ y, x });
    })
  });
  return result;
}

// Drag data written by Figure.onDragStart: "<colour>-<piece>, <y>, <x>".
const DRAG_DATA = /^((?:white|black)-(?:pawn|knight|bishop|rook|queen|king)), ([0-7]), ([0-7])$/;

interface DraggedFigure {
  figure: ChessPiece;
  axisY: number;
  axisX: number;
}

// The dragged piece if the drag data describes a piece of the side to move standing on that
// square; null for anything else dropped on the board (other text, stale or spoofed data).
export const readDraggedFigure = (data: string | null | undefined, position: ChessPosition, turn: PlayerColor): DraggedFigure | null => {
  const match = DRAG_DATA.exec(data ?? '');
  if (!match) return null;
  const [, figure, axisY, axisX] = match;
  const y = Number(axisY);
  const x = Number(axisX);
  const piece = position[y][x];
  if (piece === '' || piece !== figure || pieceColor(piece) !== turn) return null;
  return { figure: piece, axisY: y, axisX: x };
}

const PIECE_LETTERS: Record<Exclude<ChessPieceType, 'pawn'>, string> = { king: 'K', queen: 'Q', rook: 'R', bishop: 'B', knight: 'N' };

interface NotationInput {
  position: ChessPosition;
  figure: ChessPiece;
  // The square the piece leaves; it may come as text, the way drag data carries it.
  axisY: number | string;
  axisX: number | string;
  y: number;
  x: number;
  promotesTo?: PromotionPiece;
}

// Simplified algebraic notation of a move, read from the position before it: "e4", "exd5", "Nf3",
// "Rxa7", "0-0", "0-0-0", "e8=Q". `promotesTo` is the name of the piece a pawn becomes.
export const getNewMoveNotation = ({ position, figure, axisY, axisX, y, x, promotesTo }: NotationInput): string => {
  let note = '';

  axisY = Number(axisY);
  axisX = Number(axisX);

  const type = pieceType(figure);
  if (type === 'king' && Math.abs(axisX - x) === 2) {
    return x > axisX ? '0-0' : '0-0-0';
  }

  if (type !== 'pawn') {
    note += PIECE_LETTERS[type];
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
