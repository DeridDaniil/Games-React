import type { CheckerPiece, CheckersCell, CheckersPosition } from '../model/types';
import type { PlayerColor } from '../../shared/model/types';

// Drag data written by Checker.onDragStart: "<y>, <x>, <colour>-<checker|queen>".
const DRAG_DATA = /^([0-7]), ([0-7]), ((?:white|black)-(?:checker|queen))$/;

// "white-queen" → "white".
export const colorOf = (piece: CheckerPiece): PlayerColor => (piece.startsWith('white') ? 'white' : 'black');

interface DraggedChecker {
  axisY: number;
  axisX: number;
  checker: CheckerPiece;
}

// The dragged checker if the drag data describes a checker of the side to move that still stands
// on that square; null for anything else dropped on the board (other text, stale or spoofed data).
export const readDraggedChecker = (data: string | null | undefined, position: CheckersPosition, turn: PlayerColor): DraggedChecker | null => {
  const match = DRAG_DATA.exec(data ?? '');
  if (!match) return null;
  const [, axisY, axisX, checker] = match;
  const y = Number(axisY);
  const x = Number(axisX);
  const piece = position[y][x];
  if (piece === '' || piece !== checker || colorOf(piece) !== turn) return null;
  return { axisY: y, axisX: x, checker: piece };
};

export const createPosition = (): CheckersPosition => {
  const position = Array.from({ length: 8 }, () => Array<CheckersCell>(8).fill(''));

  position[0][0] = 'white-checker';
  position[0][2] = 'white-checker';
  position[0][4] = 'white-checker';
  position[0][6] = 'white-checker';
  position[1][1] = 'white-checker';
  position[1][3] = 'white-checker';
  position[1][5] = 'white-checker';
  position[1][7] = 'white-checker';
  position[2][0] = 'white-checker';
  position[2][2] = 'white-checker';
  position[2][4] = 'white-checker';
  position[2][6] = 'white-checker';

  position[7][1] = 'black-checker';
  position[7][3] = 'black-checker';
  position[7][5] = 'black-checker';
  position[7][7] = 'black-checker';
  position[6][0] = 'black-checker';
  position[6][2] = 'black-checker';
  position[6][4] = 'black-checker';
  position[6][6] = 'black-checker';
  position[5][1] = 'black-checker';
  position[5][3] = 'black-checker';
  position[5][5] = 'black-checker';
  position[5][7] = 'black-checker';

  return position;
}
