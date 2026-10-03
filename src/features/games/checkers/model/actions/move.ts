import { ActionTypes } from "../types";
import type { CheckersActionOf, CheckersPosition, CheckersState, CheckersStatus } from "../types";
import type { Square } from "../../../shared/model/types";

export const makeNewMove = (
  { newPosition, newMove }: { newPosition: CheckersPosition; newMove: string }
): CheckersActionOf<'NEW_MOVE'> => {
  return {
    type: ActionTypes.NEW_MOVE,
    payload: { newPosition, newMove }
  };
};

export const generateCandidateMoves = (
  { candidateMoves }: { candidateMoves: Square[] }
): CheckersActionOf<'GENERATE_CANDIDATE_MOVES'> => {
  return {
    type: ActionTypes.GENERATE_CANDIDATE_MOVES,
    payload: { candidateMoves }
  }
};

export const generateCandidateAttack = (
  { candidateAttack }: { candidateAttack: Square[] }
): CheckersActionOf<'GENERATE_CANDIDATE_ATTACK'> => {
  return {
    type: ActionTypes.GENERATE_CANDIDATE_ATTACK,
    payload: { candidateAttack }
  }
}

export const clearCandidates = (): CheckersActionOf<'CLEAR_CANDIDATE'> => {
  return {
    type: ActionTypes.CLEAR_CANDIDATE,
  }
};

export const setForcedCaptures = (
  { forcedCapturePieces }: { forcedCapturePieces: Square[] }
): CheckersActionOf<'SET_FORCED_CAPTURES'> => {
  return {
    type: ActionTypes.SET_FORCED_CAPTURES,
    payload: { forcedCapturePieces }
  }
};

export const continueCapture = (
  { newPosition, chainCapturePiece, newMove }: { newPosition: CheckersPosition; chainCapturePiece: Square; newMove: string }
): CheckersActionOf<'CONTINUE_CAPTURE'> => {
  return {
    type: ActionTypes.CONTINUE_CAPTURE,
    payload: { newPosition, chainCapturePiece, newMove }
  }
};

export const gameOver = ({ status }: { status: CheckersStatus }): CheckersActionOf<'GAME_OVER'> => {
  return {
    type: ActionTypes.GAME_OVER,
    payload: { status }
  }
};

export const setupNewGame = (initState: CheckersState): CheckersActionOf<'NEW_GAME'> => {
  return {
    type: ActionTypes.NEW_GAME,
    payload: initState
  }
};

export const takeBack = (): CheckersActionOf<'TAKE_BACK'> => {
  return {
    type: ActionTypes.TAKE_BACK
  }
};

export const startClock = (): CheckersActionOf<'START_CLOCK'> => {
  return {
    type: ActionTypes.START_CLOCK
  }
};

export const tickClock = (delta = 1000): CheckersActionOf<'TICK'> => {
  return {
    type: ActionTypes.TICK,
    payload: { delta }
  }
};

export const surrender = (): CheckersActionOf<'SURRENDER'> => {
  return {
    type: ActionTypes.SURRENDER
  }
};

export const markResultRecorded = (): CheckersActionOf<'RESULT_RECORDED'> => {
  return {
    type: ActionTypes.RESULT_RECORDED
  }
};
