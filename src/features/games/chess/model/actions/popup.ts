import { ActionTypes } from "../types"
import type { ChessActionOf, PromotionSquare } from "../types"

export const openPromotion = ({ axisY, axisX, y, x }: PromotionSquare): ChessActionOf<'PROMOTION_OPEN'> => {
  return {
    type: ActionTypes.PROMOTION_OPEN,
    payload: { axisY, axisX, y, x }
  }
}

export const closePopup = (): ChessActionOf<'PROMOTION_CLOSE'> => {
  return {
    type: ActionTypes.PROMOTION_CLOSE,
  }
}
