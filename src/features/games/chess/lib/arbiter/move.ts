import { pieceColor, pieceType } from '../helper';
import type { ChessPiece, ChessPosition } from '../../model/types';

// A piece going from [axisY, axisX] to [y, x] in `position`.
interface PieceMove {
  position: ChessPosition;
  figure: ChessPiece;
  axisY: number;
  axisX: number;
  y: number;
  x: number;
}

export const movePawns = ({ position, figure, axisY, axisX, y, x }: PieceMove): ChessPosition => {
  const newPosition = position.map(axisY => axisY.map(axixX => axixX));

  if (!newPosition[y][x] && y !== axisY && x != axisX) {
    newPosition[axisY][x] = '';
  }

  newPosition[axisY][axisX] = '';
  newPosition[y][x] = figure;
  return newPosition;
};

export const moveFigures = ({ position, figure, axisY, axisX, y, x }: PieceMove): ChessPosition => {
  const newPosition = position.map(axisY => axisY.map(axixX => axixX));

  if (figure.slice(6) === 'king' && Math.abs(x - axisX) > 1) {
    if (x === 2) {
      newPosition[axisY][0] = '';
      newPosition[axisY][3] = `${pieceColor(figure)}-rook`;
    }
    if (x === 6) {
      newPosition[axisY][7] = '';
      newPosition[axisY][5] = `${pieceColor(figure)}-rook`;
    }
  }

  newPosition[axisY][axisX] = '';
  newPosition[y][x] = figure;
  return newPosition;
};

// The position after a move, with what the move takes along: the pawn taken en passant, the rook
// of a castling.
export const performMove = (move: PieceMove): ChessPosition =>
  pieceType(move.figure) === 'pawn' ? movePawns(move) : moveFigures(move);
