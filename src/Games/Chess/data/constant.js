import { createPosition } from "./helper";
import { Status } from "./types";;

// Total time per side in milliseconds (e.g. 5 minutes)
export const DEFAULT_TIME_CONTROL_MS = 5 * 60 * 1000;

export const initChessGame = {
  position: [createPosition()],
  turn: 'white',
  candidateMoves: [],
  movesList: [],
  clockStarted: false,
  status: Status.ongoing,
  promotionSquare: null,
  castleDirection: {
    white: 'both',
    black: 'both'
  },
  whiteTime: DEFAULT_TIME_CONTROL_MS,
  blackTime: DEFAULT_TIME_CONTROL_MS,
  turnStartTimes: { whiteTime: DEFAULT_TIME_CONTROL_MS, blackTime: DEFAULT_TIME_CONTROL_MS },
  timeHistory: []
};