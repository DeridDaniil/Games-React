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
  }

  return state;
}