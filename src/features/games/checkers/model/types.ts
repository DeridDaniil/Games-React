import type { ClockTimes, PlayerColor, Square } from '../../shared/model/types';

export const ActionTypes = {
  'NEW_MOVE': 'NEW_MOVE',
  'GENERATE_CANDIDATE_MOVES': 'GENERATE_CANDIDATE_MOVES',
  'GENERATE_CANDIDATE_ATTACK': 'GENERATE_CANDIDATE_ATTACK',
  'CLEAR_CANDIDATE': 'CLEAR_CANDIDATE',
  'SET_FORCED_CAPTURES': 'SET_FORCED_CAPTURES',
  'CONTINUE_CAPTURE': 'CONTINUE_CAPTURE',
  'GAME_OVER': 'GAME_OVER',
  'NEW_GAME': 'NEW_GAME',
  'TAKE_BACK': 'TAKE_BACK',
  'START_CLOCK': 'START_CLOCK',
  'TICK': 'TICK',
  'SURRENDER': 'SURRENDER',
  'RESULT_RECORDED': 'RESULT_RECORDED'
} as const;

export const Status = {
  ongoing: 'Ongoing',
  whiteWins: 'White wins',
  blackWins: 'Black wins',
  draw: 'Draw',
  whiteOnTime: 'White wins on time',
  blackOnTime: 'Black wins on time',
  whiteSurrender: 'White surrendered',
  blackSurrender: 'Black surrendered'
} as const;

export type CheckersStatus = (typeof Status)[keyof typeof Status];

export type CheckerKind = 'checker' | 'queen';
export type CheckerPiece = `${PlayerColor}-${CheckerKind}`;
export type CheckersCell = CheckerPiece | '';
// position[y][x], y = rank - 1 (0 is White's back rank), x = file (0 is a).
export type CheckersPosition = CheckersCell[][];

// A chain capture under way: where its turn started in `position` and its jumps so far ("a3xc5xe7").
export interface ChainCapture {
  start: number;
  notation: string;
}

export interface CheckersState {
  // Every position of the game, the current one last.
  position: CheckersPosition[];
  turn: PlayerColor;
  // The checker picked up by a drag or a tap, whose moves and captures are highlighted.
  selected: Square | null;
  candidateMoves: Square[];
  candidateAttack: Square[];
  forcedCapturePieces: Square[];
  // The checker that must go on capturing in this turn.
  chainCapturePiece: Square | null;
  chain: ChainCapture | null;
  resultRecorded: boolean;
  status: CheckersStatus;
  movesList: string[];
  clockStarted: boolean;
  whiteTime: number;
  blackTime: number;
  turnStartTimes: ClockTimes;
  timeHistory: ClockTimes[];
}

export type CheckersAction =
  | { type: typeof ActionTypes.NEW_MOVE; payload: { newPosition: CheckersPosition; newMove: string } }
  | { type: typeof ActionTypes.GENERATE_CANDIDATE_MOVES; payload: { candidateMoves: Square[]; from: Square } }
  | { type: typeof ActionTypes.GENERATE_CANDIDATE_ATTACK; payload: { candidateAttack: Square[] } }
  | { type: typeof ActionTypes.CLEAR_CANDIDATE }
  | { type: typeof ActionTypes.SET_FORCED_CAPTURES; payload: { forcedCapturePieces: Square[] } }
  | {
    type: typeof ActionTypes.CONTINUE_CAPTURE;
    payload: { newPosition: CheckersPosition; chainCapturePiece: Square; newMove: string };
  }
  | { type: typeof ActionTypes.GAME_OVER; payload: { status: CheckersStatus } }
  | { type: typeof ActionTypes.NEW_GAME; payload: CheckersState }
  | { type: typeof ActionTypes.TAKE_BACK }
  | { type: typeof ActionTypes.START_CLOCK }
  | { type: typeof ActionTypes.TICK; payload: { delta: number } }
  | { type: typeof ActionTypes.SURRENDER }
  | { type: typeof ActionTypes.RESULT_RECORDED };

// The action with the given type, e.g. CheckersActionOf<'TICK'>.
export type CheckersActionOf<T extends CheckersAction['type']> = Extract<CheckersAction, { type: T }>;
