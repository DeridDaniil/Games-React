import { ActionTypes } from "../../data/types"
import { initChessGame } from "../../data/constant"

export const updateCastling = (direction) => {
  return {
    type: ActionTypes.CAN_CASTLE,
    payload: direction
  }
}

export const detectStalemate = () => {
  return {
    type: ActionTypes.STALEMATE,
  }
}

export const setupNewGame = () => {
  return {
    type: ActionTypes.NEW_GAME,
    payload: initChessGame
  }
}