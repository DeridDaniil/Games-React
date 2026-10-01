import { describe, expect, it } from 'vitest';
import { ChessReducer } from './Reducer';
import { clearCandidates, generateCandidateMoves, makeNewMove, takeBack } from './actions/move';
import { closePopup, openPromotion } from './actions/popup';
import {
  detectCheckmate,
  detectInsufficientMaterial,
  detectStalemate,
  setupNewGame,
  startClock,
  tickClock,
  updateCastling
} from './actions/game';
import { DEFAULT_TIME_CONTROL_MS, initChessGame } from './constant';
import { Status } from './types';
import arbiter from '../lib/arbiter/arbiter';
import { at, pieceAt, sq } from '../../shared/test/boardTestUtils';

const reduce = (state, ...actions) => actions.reduce(ChessReducer, state);
const currentPosition = (state) => state.position[state.position.length - 1];

// Mirrors Figures.jsx: performs the move with the engine and dispatches NEW_MOVE.
const moveAction = (state, from, target, newMove = `${from}-${target}`) => {
  const position = currentPosition(state);
  const [y, x] = sq(target);
  const newPosition = arbiter.performMove({ position, figure: pieceAt(position, from), ...at(from), y, x });
  return makeNewMove({ newPosition, newMove });
};

const playMoves = (state, moves) =>
  moves.reduce((current, [from, target]) => ChessReducer(current, moveAction(current, from, target)), state);

describe('ChessReducer', () => {
  describe('initial state', () => {
    it('starts an ongoing game with white to move and full clocks', () => {
      expect(initChessGame.turn).toBe('white');
      expect(initChessGame.status).toBe(Status.ongoing);
      expect(initChessGame.position).toHaveLength(1);
      expect(initChessGame.movesList).toEqual([]);
      expect(initChessGame.castleDirection).toEqual({ white: 'both', black: 'both' });
      expect(initChessGame.whiteTime).toBe(DEFAULT_TIME_CONTROL_MS);
      expect(initChessGame.blackTime).toBe(DEFAULT_TIME_CONTROL_MS);
      expect(initChessGame.clockStarted).toBe(false);
    });
  });

  describe('NEW_MOVE', () => {
    it('appends the position and notation and passes the turn', () => {
      const state = ChessReducer(initChessGame, moveAction(initChessGame, 'e2', 'e4', 'e4'));

      expect(state.turn).toBe('black');
      expect(state.position).toHaveLength(2);
      expect(pieceAt(currentPosition(state), 'e4')).toBe('white-pawn');
      expect(state.movesList).toEqual(['e4']);
    });

    it('alternates the turn on every move', () => {
      const state = playMoves(initChessGame, [['e2', 'e4'], ['e7', 'e5'], ['g1', 'f3']]);

      expect(state.turn).toBe('black');
      expect(state.position).toHaveLength(4);
      expect(state.movesList).toHaveLength(3);
    });

    it('stores the clock snapshot of the finished turn', () => {
      const ticking = reduce(initChessGame, startClock(), tickClock(3000));
      const state = ChessReducer(ticking, moveAction(ticking, 'e2', 'e4'));

      expect(state.timeHistory).toEqual([{ whiteTime: DEFAULT_TIME_CONTROL_MS, blackTime: DEFAULT_TIME_CONTROL_MS }]);
      expect(state.turnStartTimes).toEqual({ whiteTime: DEFAULT_TIME_CONTROL_MS - 3000, blackTime: DEFAULT_TIME_CONTROL_MS });
    });

    it('does not mutate the previous state', () => {
      const snapshot = JSON.stringify(initChessGame);
      ChessReducer(initChessGame, moveAction(initChessGame, 'e2', 'e4'));
      expect(JSON.stringify(initChessGame)).toBe(snapshot);
    });
  });

  describe('TAKE_BACK', () => {
    it('restores the previous position, notation and turn', () => {
      const afterTwoMoves = playMoves(initChessGame, [['e2', 'e4'], ['e7', 'e5']]);
      const state = ChessReducer(afterTwoMoves, takeBack());

      expect(state.turn).toBe('black');
      expect(state.position).toHaveLength(2);
      expect(state.movesList).toHaveLength(1);
      expect(currentPosition(state)).toEqual(afterTwoMoves.position[1]);
    });

    it('restores both clocks to the start of the undone turn', () => {
      const started = reduce(initChessGame, startClock(), tickClock(2000));
      const afterWhite = ChessReducer(started, moveAction(started, 'e2', 'e4'));
      const blackThinking = reduce(afterWhite, tickClock(5000));
      const afterBlack = ChessReducer(blackThinking, moveAction(blackThinking, 'e7', 'e5'));

      const state = ChessReducer(afterBlack, takeBack());

      expect(state.whiteTime).toBe(DEFAULT_TIME_CONTROL_MS - 2000);
      expect(state.blackTime).toBe(DEFAULT_TIME_CONTROL_MS);
      expect(state.turnStartTimes).toEqual({ whiteTime: DEFAULT_TIME_CONTROL_MS - 2000, blackTime: DEFAULT_TIME_CONTROL_MS });
    });

    it('gives White back the time spent on the undone move', () => {
      const thinking = reduce(initChessGame, startClock(), tickClock(2000));
      const moved = ChessReducer(thinking, moveAction(thinking, 'e2', 'e4'));

      const state = ChessReducer(moved, takeBack());

      expect(state.turn).toBe('white');
      expect(state.whiteTime).toBe(DEFAULT_TIME_CONTROL_MS);
      expect(state.blackTime).toBe(DEFAULT_TIME_CONTROL_MS);
    });

    it('does nothing in the initial position', () => {
      const state = ChessReducer(initChessGame, takeBack());

      expect(state.turn).toBe('white');
      expect(state.position).toBe(initChessGame.position);
      expect(state.movesList).toBe(initChessGame.movesList);
    });

    // KNOWN LIMITATION (not fixed in this stage): castling rights are not part of the undo history.
    it('keeps castling rights lost by the undone king move (current behaviour)', () => {
      const opening = playMoves(initChessGame, [['e2', 'e4'], ['e7', 'e5']]);
      // Figures.jsx dispatches CAN_CASTLE right before NEW_MOVE for king and rook moves.
      const kingMoved = reduce(opening, updateCastling('none'), moveAction(opening, 'e1', 'e2'));

      const state = ChessReducer(kingMoved, takeBack());

      expect(state.turn).toBe('white');
      expect(pieceAt(currentPosition(state), 'e1')).toBe('white-king');
      expect(state.castleDirection.white).toBe('none');
    });
  });

  describe('promotion', () => {
    const promotionSquare = { axisY: 6, axisX: 0, y: 7, x: 0 };

    it('PROMOTION_OPEN switches the game into the promoting state', () => {
      const state = ChessReducer(initChessGame, openPromotion(promotionSquare));

      expect(state.status).toBe(Status.promoting);
      expect(state.promotionSquare).toEqual(promotionSquare);
      expect(state.turn).toBe('white');
    });

    it('PROMOTION_CLOSE returns the game to the ongoing state', () => {
      const state = reduce(initChessGame, openPromotion(promotionSquare), closePopup());

      expect(state.status).toBe(Status.ongoing);
      expect(state.promotionSquare).toBeNull();
    });
  });

  describe('CAN_CASTLE', () => {
    it('updates the castling rights of the player to move', () => {
      const white = ChessReducer(initChessGame, updateCastling('right'));
      const black = ChessReducer({ ...initChessGame, turn: 'black' }, updateCastling('left'));

      expect(white.castleDirection).toEqual({ white: 'right', black: 'both' });
      expect(black.castleDirection).toEqual({ white: 'both', black: 'left' });
    });

    it('does not leak castling rights into the initial state or a new game', () => {
      const afterKingMove = ChessReducer(initChessGame, updateCastling('none'));
      const newGame = ChessReducer(afterKingMove, setupNewGame());

      expect(afterKingMove.castleDirection.white).toBe('none');
      expect(initChessGame.castleDirection).toEqual({ white: 'both', black: 'both' });
      expect(newGame.castleDirection).toEqual({ white: 'both', black: 'both' });
    });
  });

  describe('game over', () => {
    it('WIN stores the winner', () => {
      expect(ChessReducer(initChessGame, detectCheckmate('white')).status).toBe(Status.white);
      expect(ChessReducer(initChessGame, detectCheckmate('black')).status).toBe(Status.black);
    });

    it('STALEMATE and INSUFFICIENT_MATERIAL end the game in a draw', () => {
      expect(ChessReducer(initChessGame, detectStalemate()).status).toBe(Status.stalemate);
      expect(ChessReducer(initChessGame, detectInsufficientMaterial()).status).toBe(Status.insufficient);
    });

    it("records fool's mate the same way the board does after the final move", () => {
      const state = playMoves(initChessGame, [['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4'], ['d8', 'h4']]);
      const position = currentPosition(state);
      const checkmated = arbiter.isCheckmate(position, state.turn, state.castleDirection[state.turn]);

      const finished = checkmated ? ChessReducer(state, detectCheckmate('black')) : state;

      expect(state.turn).toBe('white');
      expect(finished.status).toBe(Status.black);
    });
  });

  describe('clock', () => {
    it('START_CLOCK marks the clock as started', () => {
      expect(ChessReducer(initChessGame, startClock()).clockStarted).toBe(true);
    });

    it('TICK only consumes the time of the player to move', () => {
      const white = ChessReducer(initChessGame, tickClock(1000));
      const black = ChessReducer({ ...initChessGame, turn: 'black' }, tickClock(1000));

      expect(white.whiteTime).toBe(DEFAULT_TIME_CONTROL_MS - 1000);
      expect(white.blackTime).toBe(DEFAULT_TIME_CONTROL_MS);
      expect(black.blackTime).toBe(DEFAULT_TIME_CONTROL_MS - 1000);
    });

    it('TICK ends the game on time in favour of the opponent', () => {
      const whiteFlag = ChessReducer({ ...initChessGame, whiteTime: 500 }, tickClock(1000));
      const blackFlag = ChessReducer({ ...initChessGame, turn: 'black', blackTime: 1000 }, tickClock(1000));

      expect(whiteFlag.whiteTime).toBe(0);
      expect(whiteFlag.status).toBe(Status.blackOnTime);
      expect(blackFlag.blackTime).toBe(0);
      expect(blackFlag.status).toBe(Status.whiteOnTime);
    });

    it('TICK keeps running while a promotion is being chosen', () => {
      const promoting = ChessReducer(initChessGame, openPromotion({ axisY: 6, axisX: 0, y: 7, x: 0 }));
      expect(ChessReducer(promoting, tickClock(1000)).whiteTime).toBe(DEFAULT_TIME_CONTROL_MS - 1000);
    });

    it('TICK is ignored once the game is over', () => {
      const finished = ChessReducer(initChessGame, detectCheckmate('white'));
      expect(ChessReducer(finished, tickClock(1000))).toBe(finished);
    });
  });

  describe('candidate moves', () => {
    it('stores and clears the highlighted moves', () => {
      const withCandidates = ChessReducer(initChessGame, generateCandidateMoves({ candidateMoves: [[2, 4], [3, 4]] }));
      expect(withCandidates.candidateMoves).toEqual([[2, 4], [3, 4]]);
      expect(ChessReducer(withCandidates, clearCandidates()).candidateMoves).toEqual([]);
    });
  });

  describe('NEW_GAME', () => {
    it('resets a finished game to the initial state', () => {
      const finished = reduce(
        playMoves(initChessGame, [['e2', 'e4'], ['e7', 'e5']]),
        startClock(),
        tickClock(4000),
        detectCheckmate('white')
      );

      expect(ChessReducer(finished, setupNewGame())).toEqual(initChessGame);
    });
  });

  it('returns the same state for unknown actions', () => {
    expect(ChessReducer(initChessGame, { type: 'UNKNOWN' })).toBe(initChessGame);
  });
});
