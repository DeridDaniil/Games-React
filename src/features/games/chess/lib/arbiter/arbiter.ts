import { areSameColorTiles, findFiguresCoords, pieceColor, pieceType } from "../helper";
import { getFigures, getPawnCaptures, getRegularMoves } from "./getMoves"
import { getCastlingMoves } from "./castling";
import { isPlayerInCheck } from "./check";
import { performMove } from "./move";
import type { CastlingRights, ChessCell, ChessPiece, ChessPosition } from "../../model/types";
import type { PlayerColor, Square } from "../../../shared/model/types";

// The rules of the game on top of the move generators (getMoves, castling), the board update
// (move) and the check test (check); none of those lower modules imports this one.

interface ValidMovesQuery {
  position: ChessPosition;
  // The position before the last move; without it en passant is not seen.
  prevPosition?: ChessPosition;
  castleDirection: CastlingRights;
  figure: ChessPiece;
  axisY: number;
  axisX: number;
}

// The moves the piece may make: its own moves, en passant and castling, except those that would
// leave its king in check.
const getValidMoves = ({ position, prevPosition, castleDirection, figure, axisY, axisX }: ValidMovesQuery): Square[] => {
  let moves = getRegularMoves({ position, figure, axisY, axisX });
  const notInCheckMoves: Square[] = [];

  if (pieceType(figure) === 'pawn') {
    moves = [
      ...moves,
      ...getPawnCaptures({ position, prevPosition, figure, axisY, axisX })
    ];
  };

  if (pieceType(figure) === 'king') {
    moves = [
      ...moves,
      ...getCastlingMoves({ position, castleDirection, figure, axisY, axisX })
    ];
  };

  moves.forEach(([y, x]) => {
    const positionAfterMove = performMove({ position, figure, axisY, axisX, y, x });
    if (!isPlayerInCheck({ positionAfterMove, position, player: pieceColor(figure) })) {
      notInCheckMoves.push([y, x]);
    }
  })

  return notInCheckMoves;
}

// Every move `player` could make in `position`.
const getAllValidMoves = (position: ChessPosition, player: PlayerColor, castleDirection: CastlingRights, prevPosition?: ChessPosition) =>
  getFigures(position, player).reduce<Square[]>((acc, f) => acc = [
    ...acc,
    ...(getValidMoves({
      position,
      prevPosition,
      castleDirection,
      ...f
    }))
  ], []);

// `prevPosition` is the position before the last move; without it en passant replies are not seen.
const isStalemate = (position: ChessPosition, player: PlayerColor, castleDirection: CastlingRights, prevPosition?: ChessPosition): boolean => {
  const isInCheck = isPlayerInCheck({ positionAfterMove: position, player });
  if (isInCheck) return false;

  const moves = getAllValidMoves(position, player, castleDirection, prevPosition);

  return (!isInCheck && moves.length === 0);
}

const insufficientMaterial = (position: ChessPosition): boolean => {
  const figures = position.reduce<ChessCell[]>((acc, axisY) => acc = [
    ...acc,
    ...axisY.filter(axisX => axisX)
  ], []);

  if (figures.length === 2) return true;
  if (figures.length === 3 && (figures.some(f => f.slice(6) === 'bishop' || f.slice(6) === 'knight'))) return true;
  if (figures.length === 4 &&
    figures.every(f => f.slice(6) === 'bishop' || f.slice(6) === 'king') &&
    new Set(figures).size === 4 &&
    areSameColorTiles(
      findFiguresCoords(position, 'white-bishop')[0],
      findFiguresCoords(position, 'black-bishop')[0]
    )
  ) return true;

  return false;
}

const isCheckmate = (position: ChessPosition, player: PlayerColor, castleDirection: CastlingRights, prevPosition?: ChessPosition): boolean => {
  const isInCheck = isPlayerInCheck({ positionAfterMove: position, player });
  const moves = getAllValidMoves(position, player, castleDirection, prevPosition);

  return (isInCheck && moves.length === 0);
}

const arbiter = {
  getRegularMoves,
  getValidMoves,
  performMove,
  isPlayerInCheck,
  isStalemate,
  insufficientMaterial,
  isCheckmate,
}

export default arbiter;
