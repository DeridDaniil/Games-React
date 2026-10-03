import { ActionTypes, Status } from "../types";
import type { CheckerPiece, CheckersAction, CheckersActionOf, CheckersPosition, CheckersState, CheckersStatus } from "../types";
import type { Square } from "../../../shared/model/types";
import arbiter from "../../lib/arbiter/arbiter";
import { colorOf } from "../../lib/helper";

export const makeNewMove = (
  { newPosition, newMove }: { newPosition: CheckersPosition; newMove: string }
): CheckersActionOf<'NEW_MOVE'> => {
  return {
    type: ActionTypes.NEW_MOVE,
    payload: { newPosition, newMove }
  };
};

// The squares the checker on `from` may move to, shown while that checker is picked up.
export const generateCandidateMoves = (
  { candidateMoves, from }: { candidateMoves: Square[]; from: Square }
): CheckersActionOf<'GENERATE_CANDIDATE_MOVES'> => {
  return {
    type: ActionTypes.GENERATE_CANDIDATE_MOVES,
    payload: { candidateMoves, from }
  }
};

export const generateCandidateAttack = (
  { candidateAttack }: { candidateAttack: Square[] }
): CheckersActionOf<'GENERATE_CANDIDATE_ATTACK'> => {
  return {
    type: ActionTypes.GENERATE_CANDIDATE_ATTACK,
    payload: { candidateAttack }
  }
}

export const clearCandidates = (): CheckersActionOf<'CLEAR_CANDIDATE'> => {
  return {
    type: ActionTypes.CLEAR_CANDIDATE,
  }
};

export const setForcedCaptures = (
  { forcedCapturePieces }: { forcedCapturePieces: Square[] }
): CheckersActionOf<'SET_FORCED_CAPTURES'> => {
  return {
    type: ActionTypes.SET_FORCED_CAPTURES,
    payload: { forcedCapturePieces }
  }
};

export const continueCapture = (
  { newPosition, chainCapturePiece, newMove }: { newPosition: CheckersPosition; chainCapturePiece: Square; newMove: string }
): CheckersActionOf<'CONTINUE_CAPTURE'> => {
  return {
    type: ActionTypes.CONTINUE_CAPTURE,
    payload: { newPosition, chainCapturePiece, newMove }
  }
};

export const gameOver = ({ status }: { status: CheckersStatus }): CheckersActionOf<'GAME_OVER'> => {
  return {
    type: ActionTypes.GAME_OVER,
    payload: { status }
  }
};

export const setupNewGame = (initState: CheckersState): CheckersActionOf<'NEW_GAME'> => {
  return {
    type: ActionTypes.NEW_GAME,
    payload: initState
  }
};

export const takeBack = (): CheckersActionOf<'TAKE_BACK'> => {
  return {
    type: ActionTypes.TAKE_BACK
  }
};

export const startClock = (): CheckersActionOf<'START_CLOCK'> => {
  return {
    type: ActionTypes.START_CLOCK
  }
};

export const tickClock = (delta = 1000): CheckersActionOf<'TICK'> => {
  return {
    type: ActionTypes.TICK,
    payload: { delta }
  }
};

export const surrender = (): CheckersActionOf<'SURRENDER'> => {
  return {
    type: ActionTypes.SURRENDER
  }
};

export const markResultRecorded = (): CheckersActionOf<'RESULT_RECORDED'> => {
  return {
    type: ActionTypes.RESULT_RECORDED
  }
};

const FILES = 'abcdefgh';
const DIRECTIONS = [[1, -1], [1, 1], [-1, 1], [-1, -1]];

const isSameSquare = (a: Square, b: Square): boolean => a[0] === b[0] && a[1] === b[1];

// "c3-d4" for a move, "a5xc3" for a jump.
const moveNotation = (fromY: number, fromX: number, toY: number, toX: number, isCapture: boolean): string =>
  `${FILES[fromX]}${fromY + 1}${isCapture ? 'x' : '-'}${FILES[toX]}${toY + 1}`;

// Whether the checker on `square` may be picked up: one of the side to move in a game in play, and,
// while any checker must capture, one of those (during a chain capture, the chain's checker).
export const canPickUpChecker = (state: CheckersState, square: Square): boolean => {
  const checker = state.position[state.position.length - 1][square[0]][square[1]];
  if (!checker || state.status !== Status.ongoing || colorOf(checker) !== state.turn) return false;
  const forced = state.forcedCapturePieces;
  return forced.length === 0 || forced.some(piece => isSameSquare(piece, square));
};

// Highlights for the checker on `from`: the checkers it would capture and the squares it may go to.
const showMoves = (position: CheckersPosition, checker: CheckerPiece, from: Square): CheckersAction[] => {
  const [axisY, axisX] = from;
  return [
    generateCandidateAttack({ candidateAttack: arbiter.getAttackingMoves({ position, checker, axisY, axisX }) }),
    generateCandidateMoves({ candidateMoves: arbiter.getRegularMoves({ position, checker, axisY, axisX }), from })
  ];
};

// The actions that pick up the checker on `from`, by a drag or a tap: a checker that may move is
// selected with its moves highlighted; anything else only drops the current highlights.
export const selectChecker = (state: CheckersState, from: Square): CheckersAction[] => {
  const position = state.position[state.position.length - 1];
  const checker = position[from[0]][from[1]];
  if (!checker || !canPickUpChecker(state, from)) return [clearCandidates()];
  return showMoves(position, checker, from);
};

// The actions that move the picked-up checker from `from` to `to`, whether it was dropped there or the
// square was tapped. Only a highlighted square of the selected checker counts. A jump removes the
// checker it lands right behind; a checker reaching the far row becomes a queen; the first move starts
// the clock. When the same checker must capture again, the chain goes on (CONTINUE_CAPTURE) and the
// checker stays selected with its next jumps highlighted; otherwise the move is played and the
// highlights go. Anything else only drops the highlights.
export const moveChecker = (state: CheckersState, from: Square, to: Square): CheckersAction[] => {
  const [axisY, axisX] = from;
  const [y, x] = to;
  const position = state.position[state.position.length - 1];
  const checker = position[axisY][axisX];
  const isSelected = state.selected !== null && isSameSquare(state.selected, from);
  if (!checker || !isSelected || !state.candidateMoves.some(square => isSameSquare(square, to))) return [clearCandidates()];

  const player = colorOf(checker);
  const newPosition = position.map(row => [...row]);
  newPosition[axisY][axisX] = '';
  const landedPiece: CheckerPiece = (player === 'white' && y === 7) || (player === 'black' && y === 0) ? `${player}-queen` : checker;
  newPosition[y][x] = landedPiece;

  let wasCapture = false;
  state.candidateAttack.forEach(candidate => {
    DIRECTIONS.forEach(dir => {
      if (y + dir[0] === candidate[0] && x + dir[1] === candidate[1]) {
        newPosition[candidate[0]][candidate[1]] = '';
        wasCapture = true;
      }
    });
  });

  const newMove = moveNotation(axisY, axisX, y, x, wasCapture);
  const clock: CheckersAction[] = state.clockStarted ? [] : [startClock()];

  if (wasCapture && arbiter.getAttackingMoves({ position: newPosition, checker: landedPiece, axisY: y, axisX: x }).length > 0) {
    return [
      ...clock,
      continueCapture({ newPosition, chainCapturePiece: [y, x], newMove }),
      clearCandidates(),
      ...showMoves(newPosition, landedPiece, [y, x])
    ];
  }

  return [...clock, makeNewMove({ newPosition, newMove }), clearCandidates()];
};
