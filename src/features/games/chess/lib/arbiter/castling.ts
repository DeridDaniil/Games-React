import { isPlayerInCheck } from './check';
import { performMove } from './move';
import { pieceColor } from '../helper';
import type { CastlingRights, ChessPiece, ChessPosition } from '../../model/types';
import type { PlayerColor, Square } from '../../../shared/model/types';

interface KingAt {
  position: ChessPosition;
  castleDirection: CastlingRights;
  figure: ChessPiece;
  axisY: number;
  axisX: number;
}

// The squares the king may castle to: its side still has the right, the squares between king and
// rook are empty, and the king is not in check, does not pass an attacked square or land on one.
export const getCastlingMoves = ({ position, castleDirection, figure, axisY, axisX }: KingAt): Square[] => {
  const moves: Square[] = [];

  if (axisX !== 4 || axisY % 7 !== 0 || castleDirection === 'none') return moves;
  if (isPlayerInCheck({ positionAfterMove: position, player: pieceColor(figure) })) return moves

  const us = pieceColor(figure);
  const y = us === 'white' ? 0 : 7;

  if (['left', 'both'].includes(castleDirection) &&
    !position[y][3] &&
    !position[y][2] &&
    !position[y][1] &&
    position[y][0] === `${us}-rook` &&
    !isPlayerInCheck({
      positionAfterMove: performMove({ position, figure, axisY, axisX, y, x: 3 }),
      player: us
    }) &&
    !isPlayerInCheck({
      positionAfterMove: performMove({ position, figure, axisY, axisX, y, x: 2 }),
      player: us
    })) {
    moves.push([y, 2]);
  }

  if (['right', 'both'].includes(castleDirection) &&
    !position[y][5] &&
    !position[y][6] &&
    position[y][7] === `${us}-rook` &&
    !isPlayerInCheck({
      positionAfterMove: performMove({ position, figure, axisY, axisX, y, x: 6 }),
      player: us
    }) &&
    !isPlayerInCheck({
      positionAfterMove: performMove({ position, figure, axisY, axisX, y, x: 5 }),
      player: us
    })) {
    moves.push([y, 6]);
  }

  return moves;
}

// Castling rights of one colour after a move ('both', 'left' = queenside, 'right' = kingside, 'none').
// A side survives only while its king and rook still stand on their starting squares, so king moves,
// rook moves and rooks captured in their corner all count; a lost side never comes back.
export const keepCastlingRights = (direction: CastlingRights, position: ChessPosition, color: PlayerColor): CastlingRights => {
  const y = color === 'white' ? 0 : 7;
  const kingHome = position[y][4] === `${color}-king`;
  const queenside = kingHome && ['both', 'left'].includes(direction) && position[y][0] === `${color}-rook`;
  const kingside = kingHome && ['both', 'right'].includes(direction) && position[y][7] === `${color}-rook`;

  if (queenside && kingside) return 'both';
  if (queenside) return 'left';
  if (kingside) return 'right';
  return 'none';
}
