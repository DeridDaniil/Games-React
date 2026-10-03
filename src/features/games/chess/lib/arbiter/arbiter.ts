import { areSameColorTiles, findFiguresCoords, pieceColor, pieceType } from "../helper";
import { getFigures, getPawnCaptures, getRegularMoves } from "./getMoves"
import { getCastlingMoves } from "./castling";
import { isPlayerInCheck } from "./check";
import { performMove } from "./move";
import type { CastlingRights, ChessPiece, ChessPosition } from "../../model/types";
import type { PlayerColor, Square } from "../../../shared/model/types";

// The rules of the game on top of the move generators (getMoves, castling), the board update
// (move) and the check test (check); none of those lower modules imports this one.

interface ValidMovesQuery {
  position: ChessPosition;
  // The position before the last move; without it en passant is not seen.
  prevPosition?: ChessPosition | undefined;
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

// Material with which neither side can ever checkmate: the kings alone, a king and one bishop or
// knight against a bare king, and kings with bishops only, every bishop on squares of one colour
// (K+B against K+B, K+B+B against K, ...). Other dead positions are not looked for.
const insufficientMaterial = (position: ChessPosition): boolean => {
  const figures = position.flat().filter((cell): cell is ChessPiece => cell !== '');

  if (figures.length === 2) return true;
  if (figures.length === 3 && figures.some(f => pieceType(f) === 'bishop' || pieceType(f) === 'knight')) return true;

  const bishops = [...findFiguresCoords(position, 'white-bishop'), ...findFiguresCoords(position, 'black-bishop')];
  const kingsAndBishopsOnly = figures.every(f => pieceType(f) === 'king' || pieceType(f) === 'bishop');
  return kingsAndBishopsOnly && bishops.length > 0 && bishops.every(bishop => areSameColorTiles(bishop, bishops[0]));
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
