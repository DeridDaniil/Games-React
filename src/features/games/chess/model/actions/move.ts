import { ActionTypes } from "../types"
import type { ChessActionOf, ChessPosition, ChessState } from "../types"
import type { Square } from "../../../shared/model/types"
import arbiter from "../../lib/arbiter/arbiter";
import { keepCastlingRights } from "../../lib/arbiter/castling";
import { detectCheckmate, detectInsufficientMaterial, detectStalemate } from "./game";

export const makeNewMove = (
  { newPosition, newMove }: { newPosition: ChessPosition; newMove: string }
): ChessActionOf<'NEW_MOVE'> => {
  return {
    type: ActionTypes.NEW_MOVE,
    payload: { newPosition, newMove }
  }
}

// What playMove returns: the move itself, then the end of the game if the move ended it.
export type PlayedMove =
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

export const generateCandidateMoves = (
  { candidateMoves }: { candidateMoves: Square[] }
): ChessActionOf<'GENERATE_CANDIDATE_MOVES'> => {
  return {
    type: ActionTypes.GENERATE_CANDIDATE_MOVES,
    payload: { candidateMoves }
  }
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
