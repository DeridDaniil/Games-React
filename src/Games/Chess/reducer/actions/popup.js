import { ActionTypes } from "../../data/types"

export const openPromotion = ({ axisY, axisX, y, x }) => {
  return {
    type: ActionTypes.PROMOTION_OPEN,
    payload: { axisY, axisX, y, x }
  }
}

export const closePopup = () => {
  return {
    type: ActionTypes.PROMOTION_CLOSE,
  }
}