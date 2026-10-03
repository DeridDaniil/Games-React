import { ActionTypes, Status } from "../types"
import type { ChessAction, ChessActionOf, ChessPosition, ChessState } from "../types"
import type { Square } from "../../../shared/model/types"
import arbiter from "../../lib/arbiter/arbiter";
import { keepCastlingRights } from "../../lib/arbiter/castling";
import { getNewMoveNotation, pieceColor } from "../../lib/helper";
import { detectCheckmate, detectInsufficientMaterial, detectStalemate, startClock } from "./game";
import { openPromotion } from "./popup";

export const makeNewMove = (
  { newPosition, newMove }: { newPosition: ChessPosition; newMove: string }
): ChessActionOf<'NEW_MOVE'> => {
  return {
    type: ActionTypes.NEW_MOVE,
    payload: { newPosition, newMove }
  }
}

// What playMove returns: the move itself, then the end of the game if the move ended it.
type PlayedMove =
  | [ChessActionOf<'NEW_MOVE'>]
  | [ChessActionOf<'NEW_MOVE'>, ChessActionOf<'INSUFFICIENT_MATERIAL' | 'STALEMATE' | 'WIN'>];

// The actions that finish a move played from `state` (a normal move or a promotion): record it,
// then end the game if the move did. The side to move next is checked with the castling rights it
// keeps after the move and with the position before it, so en passant replies count.
export const playMove = (
  { state, newPosition, newMove }: { state: ChessState; newPosition: ChessPosition; newMove: string }
): PlayedMove => {
  const previousPosition = state.position[state.position.length - 1];
  const mover = state.turn;
  const opponent = mover === 'white' ? 'black' : 'white';
  const opponentCastling = keepCastlingRights(state.castleDirection[opponent], newPosition, opponent);
  const record = makeNewMove({ newPosition, newMove });

  if (arbiter.insufficientMaterial(newPosition)) return [record, detectInsufficientMaterial()];
  if (arbiter.isStalemate(newPosition, opponent, opponentCastling, previousPosition)) return [record, detectStalemate()];
  if (arbiter.isCheckmate(newPosition, opponent, opponentCastling, previousPosition)) return [record, detectCheckmate(mover)];
  return [record];
}

// The squares the piece on `from` may move to, shown while that piece is picked up.
export const generateCandidateMoves = (
  { candidateMoves, from }: { candidateMoves: Square[]; from: Square }
): ChessActionOf<'GENERATE_CANDIDATE_MOVES'> => {
  return {
    type: ActionTypes.GENERATE_CANDIDATE_MOVES,
    payload: { candidateMoves, from }
  }
}

const isSameSquare = (a: Square, b: Square): boolean => a[0] === b[0] && a[1] === b[1];

// The actions that pick up the piece on `from`, by a drag or a tap. A piece of the side to move in a
// game in play is selected with its legal squares highlighted, and the first piece White picks up
// starts the clock; anything else only drops the current highlights.
export const selectPiece = (state: ChessState, from: Square): ChessAction[] => {
  const [axisY, axisX] = from;
  const position = state.position[state.position.length - 1];
  const figure = position[axisY][axisX];
  if (state.status !== Status.ongoing || !figure || pieceColor(figure) !== state.turn) return [clearCandidates()];

  const candidateMoves = arbiter.getValidMoves({
    position,
    prevPosition: state.position.at(-2),
    castleDirection: state.castleDirection[state.turn],
    figure,
    axisY,
    axisX
  });
  return [
    ...(state.clockStarted ? [] : [startClock()]),
    generateCandidateMoves({ candidateMoves, from })
  ];
}

// The actions that move the picked-up piece from `from` to `to`, whether it was dropped there or the
// square was tapped. Only a highlighted square of the selected piece counts: a pawn reaching the last
// rank then waits for the promotion choice, any other move is played at once (see playMove), and the
// highlights go. Anything else only drops the highlights.
export const movePiece = (state: ChessState, from: Square, to: Square): ChessAction[] => {
  const [axisY, axisX] = from;
  const [y, x] = to;
  const position = state.position[state.position.length - 1];
  const figure = position[axisY][axisX];
  const isSelected = state.selected !== null && isSameSquare(state.selected, from);
  if (!figure || !isSelected || !state.candidateMoves.some(square => isSameSquare(square, to))) return [clearCandidates()];

  if (figure === 'white-pawn' && y === 7 || figure === 'black-pawn' && y === 0) {
    return [openPromotion({ axisY, axisX, y, x })];
  }

  const newPosition = arbiter.performMove({ position, figure, axisY, axisX, y, x });
  const newMove = getNewMoveNotation({ position, figure, axisY, axisX, y, x });
  return [...playMove({ state, newPosition, newMove }), clearCandidates()];
}

export const clearCandidates = (): ChessActionOf<'CLEAR_CANDIDATE_MOVES'> => {
  return {
    type: ActionTypes.CLEAR_CANDIDATE_MOVES
  }
}

export const takeBack = (): ChessActionOf<'TAKE_BACK'> => {
  return {
    type: ActionTypes.TAKE_BACK
  }
}
