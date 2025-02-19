import { ActionTypes } from "../data/types";

export const CheckersReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.NEW_MOVE: {
      let { turn, position } = state;
      turn = turn === 'white' ? 'black' : 'white';
      position = [
        ...position,
        action.payload.newPosition
      ];
      return {
        ...state,
        turn,
        position
      }
    }

    case ActionTypes.GENERATE_CANDIDATE_MOVES: {
      return {
        ...state,
        candidateMoves: action.payload.candidateMoves
      }
    }

    case ActionTypes.GENERATE_CANDIDATE_ATTACK: {
      return {
        ...state,
        candidateAttack: action.payload.candidateAttack
      }
    }

    case ActionTypes.CLEAR_CANDIDATE: {
      return {
        ...state,
        candidateMoves: [],
        candidateAttack: []
      }
    }
  }

  return state;
}