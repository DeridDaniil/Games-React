import { createPosition } from "../lib/helper";
import { Status } from "./types";

export const DEFAULT_TIME_CONTROL_MS = 5 * 60 * 1000;

export const initCheckersGame = {
  position: [createPosition()],
  turn: 'white',
  candidateMoves: [],
  candidateAttack: [],
  forcedCapturePieces: [],
  chainCapturePiece: null,
  // While a chain capture is under way: where its turn started in `position` and the jumps so far.
  chain: null,
  // Whether this game's result is in the profile already; a game resumed by Take Back keeps it.
  resultRecorded: false,
  status: Status.ongoing,
  movesList: [],
  clockStarted: false,
  whiteTime: DEFAULT_TIME_CONTROL_MS,
  blackTime: DEFAULT_TIME_CONTROL_MS,
  turnStartTimes: { whiteTime: DEFAULT_TIME_CONTROL_MS, blackTime: DEFAULT_TIME_CONTROL_MS },
  timeHistory: []
}