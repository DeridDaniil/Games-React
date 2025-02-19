import { ActionTypes } from "../../data/types";

export const makeNewMove = ({ newPosition }) => {
  return {
    type: ActionTypes.NEW_MOVE,
    payload: { newPosition }
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