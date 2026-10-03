import { ActionTypes } from "../types"
import type { ChessActionOf } from "../types"
import type { PlayerColor } from "../../../shared/model/types"
import { initChessGame } from "../constant"

export const detectStalemate = (): ChessActionOf<'STALEMATE'> => {
  return {
    type: ActionTypes.STALEMATE,
  }
}

export const detectInsufficientMaterial = (): ChessActionOf<'INSUFFICIENT_MATERIAL'> => {
  return {
    type: ActionTypes.INSUFFICIENT_MATERIAL,
  }
}

export const detectCheckmate = (winner: PlayerColor): ChessActionOf<'WIN'> => {
  return {
    type: ActionTypes.WIN,
    payload: winner
  }
}

export const markResultRecorded = (): ChessActionOf<'RESULT_RECORDED'> => {
  return {
    type: ActionTypes.RESULT_RECORDED
  }
}

export const startClock = (): ChessActionOf<'START_CLOCK'> => {
  return {
    type: ActionTypes.START_CLOCK,
  }
}

export const setupNewGame = (): ChessActionOf<'NEW_GAME'> => {
  return {
    type: ActionTypes.NEW_GAME,
    payload: initChessGame
  }
}

export const tickClock = (delta = 1000): ChessActionOf<'TICK'> => {
  return {
    type: ActionTypes.TICK,
    payload: { delta }
  }
}
