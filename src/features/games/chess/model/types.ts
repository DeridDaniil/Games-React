import type { ClockTimes, PlayerColor, Square } from '../../shared/model/types';

export const ActionTypes = {
  'NEW_MOVE': 'NEW_MOVE',
  'GENERATE_CANDIDATE_MOVES': 'GENERATE_CANDIDATE_MOVES',
  'CLEAR_CANDIDATE_MOVES': 'CLEAR_CANDIDATE_MOVES',
  'PROMOTION_OPEN': 'PROMOTION_OPEN',
  'PROMOTION_CLOSE': 'PROMOTION_CLOSE',
  'START_CLOCK': 'START_CLOCK',
  'STALEMATE': 'STALEMATE',
  'INSUFFICIENT_MATERIAL': 'INSUFFICIENT_MATERIAL',
  'WIN': 'WIN',
  'NEW_GAME': 'NEW_GAME',
  'TAKE_BACK': 'TAKE_BACK',
  'TICK': 'TICK',
  'TIMEOUT': 'TIMEOUT',
  'RESULT_RECORDED': 'RESULT_RECORDED'
} as const;

export const Status = {
  'ongoing': 'Ongoing',
  'promoting': 'Promoting',
  'white': 'White wins',
  'black': 'Black wins',
  'stalemate': 'Game draws due to stalemate',
  'insufficient': 'Game draws due to insufficient material',
  'whiteOnTime': 'White wins on time',
  'blackOnTime': 'Black wins on time'
} as const;

export type ChessStatus = (typeof Status)[keyof typeof Status];

export type ChessPieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
export type ChessPiece = `${PlayerColor}-${ChessPieceType}`;
export type ChessCell = ChessPiece | '';
// position[y][x], y = rank - 1 (0 is White's back rank), x = file (0 is a).
export type ChessPosition = ChessCell[][];

// The pieces a pawn can become.
export type PromotionPiece = 'queen' | 'rook' | 'bishop' | 'knight';

// The castling a side may still do: 'left' is queenside (towards a), 'right' is kingside (towards h).
export type CastlingRights = 'both' | 'left' | 'right' | 'none';
export type CastlingState = Record<PlayerColor, CastlingRights>;

// A pawn waiting for its promotion choice: the square it stands on and the one it moves to.
export interface PromotionSquare {
  axisY: number;
  axisX: number;
  y: number;
  x: number;
}

export interface ChessState {
  // Every position of the game, the current one last.
  position: ChessPosition[];
  turn: PlayerColor;
  candidateMoves: Square[];
  movesList: string[];
  clockStarted: boolean;
  status: ChessStatus;
  promotionSquare: PromotionSquare | null;
  castleDirection: CastlingState;
  // The castling rights before every move played, so Take Back can restore them exactly.
  castlingHistory: CastlingState[];
  resultRecorded: boolean;
  whiteTime: number;
  blackTime: number;
  turnStartTimes: ClockTimes;
  timeHistory: ClockTimes[];
}

export type ChessAction =
  | { type: typeof ActionTypes.NEW_MOVE; payload: { newPosition: ChessPosition; newMove: string } }
  | { type: typeof ActionTypes.GENERATE_CANDIDATE_MOVES; payload: { candidateMoves: Square[] } }
  | { type: typeof ActionTypes.CLEAR_CANDIDATE_MOVES }
  | { type: typeof ActionTypes.PROMOTION_OPEN; payload: PromotionSquare }
  | { type: typeof ActionTypes.PROMOTION_CLOSE }
  | { type: typeof ActionTypes.START_CLOCK }
  | { type: typeof ActionTypes.STALEMATE }
  | { type: typeof ActionTypes.INSUFFICIENT_MATERIAL }
  | { type: typeof ActionTypes.WIN; payload: PlayerColor }
  | { type: typeof ActionTypes.NEW_GAME; payload: ChessState }
  | { type: typeof ActionTypes.TAKE_BACK }
  | { type: typeof ActionTypes.TICK; payload: { delta: number } }
  // The side whose time ran out.
  | { type: typeof ActionTypes.TIMEOUT; payload: PlayerColor }
  | { type: typeof ActionTypes.RESULT_RECORDED };

// The action with the given type, e.g. ChessActionOf<'TICK'>.
export type ChessActionOf<T extends ChessAction['type']> = Extract<ChessAction, { type: T }>;
