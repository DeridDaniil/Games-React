import { ActionTypes } from "../types"
import { initChessGame } from "../constant"

export const detectStalemate = () => {
  return {
    type: ActionTypes.STALEMATE,
  }
}

export const detectInsufficientMaterial = () => {
  return {
    type: ActionTypes.INSUFFICIENT_MATERIAL,
  }
}

export const detectCheckmate = (winner) => {
  return {
    type: ActionTypes.WIN,
    payload: winner
  }
}

export const markResultRecorded = () => {
  return {
    type: ActionTypes.RESULT_RECORDED
  }
}

export const startClock = () => {
  return {
    type: ActionTypes.START_CLOCK,
  }
}

export const setupNewGame = () => {
  return {
    type: ActionTypes.NEW_GAME,
    payload: initChessGame
  }
}

export const tickClock = (delta = 1000) => {
  return {
    type: ActionTypes.TICK,
    payload: { delta }
  }
}