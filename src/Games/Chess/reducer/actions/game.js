import { ActionTypes } from "../../data/types"

export const updateCastling = (direction) => {
  return {
    type: ActionTypes.CAN_CASTLE,
    payload: direction
  }
}