import { createPosition } from "./helper";
import { Status } from "./types";;

export const initChessGame = {
  position: [createPosition()],
  turn: 'white',
  candidateMoves: [],
  status: Status.ongoing,
  promotionSquare: null
};