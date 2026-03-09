import { ActionTypes } from "../../data/types";

export const makeNewMove = ({ newPosition, newMove }) => {
  return {
    type: ActionTypes.NEW_MOVE,
    payload: { newPosition, newMove }
  };
};

export const generateCandidateMoves = ({ candidateMoves }) => {
  return {
    type: ActionTypes.GENERATE_CANDIDATE_MOVES,
    payload: { candidateMoves }
  }
};

export const generateCandidateAttack = ({ candidateAttack }) => {
  return {
    type: ActionTypes.GENERATE_CANDIDATE_ATTACK,
    payload: { candidateAttack }
  }
}

export const clearCandidates = () => {
  return {
    type: ActionTypes.CLEAR_CANDIDATE,
  }
};

export const setForcedCaptures = ({ forcedCapturePieces }) => {
  return {
    type: ActionTypes.SET_FORCED_CAPTURES,
    payload: { forcedCapturePieces }
  }
};

export const continueCapture = ({ newPosition, chainCapturePiece, newMove }) => {
  return {
    type: ActionTypes.CONTINUE_CAPTURE,
    payload: { newPosition, chainCapturePiece, newMove }
  }
};

export const gameOver = ({ status }) => {
  return {
    type: ActionTypes.GAME_OVER,
    payload: { status }
  }
};

export const setupNewGame = (initState) => {
  return {
    type: ActionTypes.NEW_GAME,
    payload: initState
  }
};

export const takeBack = () => {
  return {
    type: ActionTypes.TAKE_BACK
  }
};

export const startClock = () => {
  return {
    type: ActionTypes.START_CLOCK
  }
};

export const tickClock = (delta = 1000) => {
  return {
    type: ActionTypes.TICK,
    payload: { delta }
  }
};

export const surrender = () => {
  return {
    type: ActionTypes.SURRENDER
  }
};
