import { createPosition } from "./helper";
import { Status } from "./types";

export const DEFAULT_TIME_CONTROL_MS = 5 * 60 * 1000;

export const initCheckersGame = {
  position: [createPosition()],
  turn: 'white',
  candidateMoves: [],
  candidateAttack: [],
  forcedCapturePieces: [],
  chainCapturePiece: null,
  status: Status.ongoing,
  movesList: [],
  clockStarted: false,
  whiteTime: DEFAULT_TIME_CONTROL_MS,
  blackTime: DEFAULT_TIME_CONTROL_MS,
  turnStartTimes: { whiteTime: DEFAULT_TIME_CONTROL_MS, blackTime: DEFAULT_TIME_CONTROL_MS },
  timeHistory: []
}