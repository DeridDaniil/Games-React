import { ActionTypes } from "../types"
import arbiter from "../../lib/arbiter/arbiter";
import { keepCastlingRights } from "../../lib/arbiter/getMoves";
import { detectCheckmate, detectInsufficientMaterial, detectStalemate } from "./game";

export const makeNewMove = ({ newPosition, newMove }) => {
  return {
    type: ActionTypes.NEW_MOVE,
    payload: { newPosition, newMove }
  }
}

// The actions that finish a move played from `state` (a normal move or a promotion): record it,
// then end the game if the move did. The side to move next is checked with the castling rights it
// keeps after the move and with the position before it, so en passant replies count.
export const playMove = ({ state, newPosition, newMove }) => {
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

export const generateCandidateMoves = ({ candidateMoves }) => {
  return {
    type: ActionTypes.GENERATE_CANDIDATE_MOVES,
    payload: { candidateMoves }
  }
}

export const clearCandidates = () => {
  return {
    type: ActionTypes.CLEAR_CANDIDATE_MOVES
  }
}

export const takeBack = () => {
  return {
    type: ActionTypes.TAKE_BACK
  }
}