import { ActionTypes } from "../../data/types"

export const makeNewMove = ({ newPosition }) => {
  return {
    type: ActionTypes.NEW_MOVE,
    payload: { newPosition }
  }
}