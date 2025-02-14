import { createPosition } from "./helper";
import { Status } from "./types";;

export const initChessGame = {
  position: [createPosition()],
  turn: 'white',
  candidateMoves: [],
  movesList: [],
  status: Status.ongoing,
  promotionSquare: null,
  castleDirection: {
    white: 'both',
    black: 'both'
  }
};