import { describe, expect, it } from 'vitest';
import { ChessReducer } from './Reducer';
import { clearCandidates, generateCandidateMoves, makeNewMove, playMove, takeBack } from './actions/move';
import { closePopup, openPromotion } from './actions/popup';
import {
  detectCheckmate,
  detectInsufficientMaterial,
  detectStalemate,
  markResultRecorded,
  setupNewGame,
  startClock,
  surrender,
  tickClock
} from './actions/game';
import { DEFAULT_TIME_CONTROL_MS, initChessGame } from './constant';
import { ActionTypes, Status } from './types';
import arbiter from '../lib/arbiter/arbiter';
import { pieceColor } from '../lib/helper';
import { at, boardWith, pieceAt, sq } from '../../shared/test/boardTestUtils';
import type { ChessAction, ChessCell, ChessPiece, ChessPosition, ChessState, PromotionPiece } from './types';
import type { PlayerColor } from '../../shared/model/types';

type Pieces = Record<string, ChessCell>;

const reduce = (state: ChessState, ...actions: ChessAction[]) => actions.reduce(ChessReducer, state);
const currentPosition = (state: ChessState) => state.position[state.position.length - 1];

// The piece on an occupied square.
const pieceOn = (position: ChessPosition, square: string): ChessPiece => {
  const piece = pieceAt(position, square);
  if (!piece) throw new Error(`No piece on ${square}`);
  return piece;
};

// Mirrors Figures.tsx: performs the move with the engine and dispatches NEW_MOVE.
const moveAction = (state: ChessState, from: string, target: string, newMove = `${from}-${target}`) => {
  const position = currentPosition(state);
  const [y, x] = sq(target);
  const newPosition = arbiter.performMove({ position, figure: pieceOn(position, from), ...at(from), y, x });
  return makeNewMove({ newPosition, newMove });
};

const playMoves = (state: ChessState, moves: [string, string][]) =>
  moves.reduce((current, [from, target]) => ChessReducer(current, moveAction(current, from, target)), state);

// A game that starts from an arbitrary position with `turn` to move.
const gameFrom = (pieces: Pieces, turn: PlayerColor = 'white'): ChessState => ({ ...initChessGame, position: [boardWith(pieces)], turn });

// Both kings and all four rooks on their starting squares.
const castlingHome: Pieces = { e1: 'white-king', a1: 'white-rook', h1: 'white-rook', e8: 'black-king', a8: 'black-rook', h8: 'black-rook' };

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

    it('restores the castling rights lost by the undone king move', () => {
      const opening = playMoves(initChessGame, [['e2', 'e4'], ['e7', 'e5']]);
      const kingMoved = playMoves(opening, [['e1', 'e2']]);

      const state = ChessReducer(kingMoved, takeBack());

      expect(kingMoved.castleDirection.white).toBe('none');
      expect(state.turn).toBe('white');
      expect(pieceAt(currentPosition(state), 'e1')).toBe('white-king');
      expect(state.castleDirection).toEqual({ white: 'both', black: 'both' });
    });

    it('restores the castling right lost by the undone rook move', () => {
      const rookMoved = playMoves(gameFrom(castlingHome), [['a1', 'a2']]);

      const state = ChessReducer(rookMoved, takeBack());

      expect(rookMoved.castleDirection.white).toBe('right');
      expect(state.castleDirection).toEqual({ white: 'both', black: 'both' });
      expect(state.castlingHistory).toEqual([]);
    });

    it('gives back the castling right lost when the opponent captured a corner rook', () => {
      const captured = playMoves(gameFrom({ ...castlingHome, b7: 'black-bishop' }, 'black'), [['b7', 'h1']]);

      const state = ChessReducer(captured, takeBack());

      expect(captured.castleDirection.white).toBe('left');
      expect(pieceAt(currentPosition(state), 'h1')).toBe('white-rook');
      expect(state.castleDirection.white).toBe('both');
    });

    it('restores the rights of each undone move in turn', () => {
      const played = playMoves(gameFrom(castlingHome), [['a1', 'a2'], ['h8', 'h5'], ['e1', 'd1']]);

      const oneBack = ChessReducer(played, takeBack());
      const twoBack = ChessReducer(oneBack, takeBack());
      const threeBack = ChessReducer(twoBack, takeBack());

      expect(played.castleDirection).toEqual({ white: 'none', black: 'left' });
      expect(oneBack.castleDirection).toEqual({ white: 'right', black: 'left' });
      expect(twoBack.castleDirection).toEqual({ white: 'right', black: 'both' });
      expect(threeBack.castleDirection).toEqual({ white: 'both', black: 'both' });
    });

    it('puts a finished game back in play when the deciding move is taken back', () => {
      const mated = reduce(
        playMoves(initChessGame, [['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4'], ['d8', 'h4']]),
        detectCheckmate('black')
      );

      const state = ChessReducer(mated, takeBack());

      expect(mated.status).toBe(Status.black);
      expect(state.status).toBe(Status.ongoing);
      expect(state.turn).toBe('black');
      expect(pieceAt(currentPosition(state), 'd8')).toBe('black-queen');
    });

    it('stops the clock once every move is taken back, until White picks up a piece again', () => {
      const afterTwo = playMoves(reduce(initChessGame, startClock()), [['e2', 'e4'], ['e7', 'e5']]);

      const oneBack = ChessReducer(afterTwo, takeBack());
      const allBack = ChessReducer(oneBack, takeBack());

      expect(oneBack.clockStarted).toBe(true);
      expect(allBack.clockStarted).toBe(false);
    });

    it('keeps the mark that the result of a resumed game was already recorded', () => {
      const recorded = reduce(
        playMoves(initChessGame, [['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4'], ['d8', 'h4']]),
        detectCheckmate('black'),
        markResultRecorded()
      );

      const state = ChessReducer(recorded, takeBack());

      expect(state.status).toBe(Status.ongoing);
      expect(state.resultRecorded).toBe(true);
    });

    it('only cancels a pending promotion and keeps the last finished move', () => {
      const afterE4 = playMoves(initChessGame, [['e2', 'e4']]);
      const promoting = reduce(
        afterE4,
        generateCandidateMoves({ candidateMoves: [[0, 0]], from: [1, 0] }),
        openPromotion({ axisY: 1, axisX: 0, y: 0, x: 0 })
      );

      const state = ChessReducer(promoting, takeBack());

      expect(state.status).toBe(Status.ongoing);
      expect(state.promotionSquare).toBeNull();
      expect(state.candidateMoves).toEqual([]);
      expect(state.turn).toBe('black');
      expect(state.position).toBe(afterE4.position);
      expect(state.movesList).toBe(afterE4.movesList);
      expect(state.timeHistory).toBe(afterE4.timeHistory);
      expect(state.whiteTime).toBe(afterE4.whiteTime);
      expect(state.blackTime).toBe(afterE4.blackTime);
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

  describe('castling rights after a move', () => {
    it('are lost on both sides once the king moves', () => {
      const state = playMoves(gameFrom(castlingHome), [['e1', 'e2']]);
      expect(state.castleDirection).toEqual({ white: 'none', black: 'both' });
    });

    it('lose the side of the rook that moves first', () => {
      const queenside = playMoves(gameFrom(castlingHome), [['a1', 'a2']]);
      const kingside = playMoves(gameFrom(castlingHome, 'black'), [['h8', 'h5']]);

      expect(queenside.castleDirection).toEqual({ white: 'right', black: 'both' });
      expect(kingside.castleDirection).toEqual({ white: 'both', black: 'left' });
    });

    it('lose the side of a rook captured on its starting square', () => {
      const state = playMoves(gameFrom({ ...castlingHome, b7: 'black-bishop' }, 'black'), [['b7', 'h1']]);
      expect(state.castleDirection).toEqual({ white: 'left', black: 'both' });
    });

    it('are spent by castling', () => {
      const state = playMoves(gameFrom(castlingHome), [['e1', 'g1']]);

      expect(pieceAt(currentPosition(state), 'f1')).toBe('white-rook');
      expect(state.castleDirection.white).toBe('none');
    });

    it('do not come back when a rook returns to its corner', () => {
      const state = playMoves(gameFrom(castlingHome), [['a1', 'a2'], ['e8', 'd8'], ['a2', 'a1']]);
      expect(state.castleDirection).toEqual({ white: 'right', black: 'none' });
    });

    it('keep a snapshot of the rights before every move', () => {
      const state = playMoves(gameFrom(castlingHome), [['a1', 'a2'], ['e8', 'd8']]);

      expect(state.castlingHistory).toEqual([
        { white: 'both', black: 'both' },
        { white: 'right', black: 'both' }
      ]);
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

    it('TICK running out during a promotion ends the game and drops the pending promotion', () => {
      const promoting = reduce(
        { ...initChessGame, whiteTime: 500 },
        generateCandidateMoves({ candidateMoves: [[7, 0]], from: [6, 0] }),
        openPromotion({ axisY: 6, axisX: 0, y: 7, x: 0 })
      );

      const state = ChessReducer(promoting, tickClock(1000));

      expect(state.status).toBe(Status.blackOnTime);
      expect(state.promotionSquare).toBeNull();
      expect(state.candidateMoves).toEqual([]);
    });

    it('TIMEOUT ends the game and clears the highlighted moves', () => {
      const highlighted = ChessReducer(initChessGame, generateCandidateMoves({ candidateMoves: [[2, 4]], from: [1, 4] }));

      const state = ChessReducer(highlighted, { type: ActionTypes.TIMEOUT, payload: 'white' });

      expect(state.status).toBe(Status.blackOnTime);
      expect(state.candidateMoves).toEqual([]);
      expect(state.selected).toBeNull();
    });

    it('TICK is ignored once the game is over', () => {
      const finished = ChessReducer(initChessGame, detectCheckmate('white'));
      expect(ChessReducer(finished, tickClock(1000))).toBe(finished);
    });
  });

  describe('candidate moves', () => {
    it('stores and clears the highlighted moves', () => {
      const withCandidates = ChessReducer(initChessGame, generateCandidateMoves({ candidateMoves: [[2, 4], [3, 4]], from: [1, 4] }));
      expect(withCandidates.candidateMoves).toEqual([[2, 4], [3, 4]]);
      expect(withCandidates.selected).toEqual([1, 4]);

      const cleared = ChessReducer(withCandidates, clearCandidates());
      expect(cleared.candidateMoves).toEqual([]);
      expect(cleared.selected).toBeNull();
    });

    it('Take Back drops the picked-up piece with its highlights', () => {
      const afterE4 = playMoves(initChessGame, [['e2', 'e4']]);
      const picked = ChessReducer(afterE4, generateCandidateMoves({ candidateMoves: [[4, 4]], from: [6, 4] }));

      const state = ChessReducer(picked, takeBack());

      expect(state.selected).toBeNull();
      expect(state.candidateMoves).toEqual([]);
    });
  });

  describe('SURRENDER', () => {
    it('ends a game in play against the side to move', () => {
      expect(ChessReducer(initChessGame, surrender()).status).toBe(Status.whiteSurrender);

      const afterE4 = playMoves(initChessGame, [['e2', 'e4']]);
      expect(ChessReducer(afterE4, surrender()).status).toBe(Status.blackSurrender);
    });

    it('drops a pending promotion choice and the highlights', () => {
      const promoting = reduce(
        initChessGame,
        generateCandidateMoves({ candidateMoves: [[7, 0]], from: [6, 0] }),
        openPromotion({ axisY: 6, axisX: 0, y: 7, x: 0 })
      );

      const state = ChessReducer(promoting, surrender());

      expect(state.status).toBe(Status.whiteSurrender);
      expect(state.promotionSquare).toBeNull();
      expect(state.candidateMoves).toEqual([]);
      expect(state.selected).toBeNull();
    });

    it('is ignored once the game is over', () => {
      const finished = ChessReducer(initChessGame, { type: ActionTypes.TIMEOUT, payload: 'black' });

      expect(ChessReducer(finished, surrender())).toBe(finished);
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

    it('starts with the result of the new game not yet recorded', () => {
      const recorded = reduce(initChessGame, detectCheckmate('white'), markResultRecorded());

      expect(recorded.resultRecorded).toBe(true);
      expect(ChessReducer(recorded, setupNewGame()).resultRecorded).toBe(false);
    });

    it('always starts with full castling rights and no castling history', () => {
      const kingMoved = playMoves(initChessGame, [['e2', 'e4'], ['e7', 'e5'], ['e1', 'e2']]);

      const state = ChessReducer(kingMoved, setupNewGame());

      expect(kingMoved.castleDirection.white).toBe('none');
      expect(state.castleDirection).toEqual({ white: 'both', black: 'both' });
      expect(state.castlingHistory).toEqual([]);
      expect(initChessGame.castleDirection).toEqual({ white: 'both', black: 'both' });
    });
  });

  describe('playMove (a finished move and the ending it causes)', () => {
    // Plays `from`-`target` from the current position like the board does, optionally promoting the pawn.
    const finish = (state: ChessState, from: string, target: string, promotesTo?: PromotionPiece) => {
      const position = currentPosition(state);
      const figure = pieceOn(position, from);
      const [y, x] = sq(target);
      const newPosition = arbiter.performMove({ position, figure, ...at(from), y, x });
      if (promotesTo) newPosition[y][x] = `${pieceColor(figure)}-${promotesTo}`;
      const actions = playMove({ state, newPosition, newMove: `${from}-${target}` });
      return { actions: actions.map(action => action.type), state: actions.reduce(ChessReducer, state) };
    };

    it('only records a move that does not end the game', () => {
      const { actions, state } = finish(initChessGame, 'e2', 'e4');

      expect(actions).toEqual([ActionTypes.NEW_MOVE]);
      expect(state.status).toBe(Status.ongoing);
    });

    it('declares the mover the winner after a checkmating move', () => {
      const opening = playMoves(initChessGame, [['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4']]);
      const { actions, state } = finish(opening, 'd8', 'h4');

      expect(actions).toEqual([ActionTypes.NEW_MOVE, ActionTypes.WIN]);
      expect(state.status).toBe(Status.black);
    });

    it('ends the game when a promotion checkmates', () => {
      const promotion = gameFrom({ b6: 'white-king', c7: 'white-pawn', a8: 'black-king' });

      expect(finish(promotion, 'c7', 'c8', 'queen').state.status).toBe(Status.white);
      expect(finish(promotion, 'c7', 'c8', 'rook').state.status).toBe(Status.white);
    });

    it('ends the game in a draw when a promotion stalemates', () => {
      const { actions, state } = finish(gameFrom({ c1: 'white-king', g7: 'white-pawn', a1: 'black-king' }), 'g7', 'g8', 'queen');

      expect(actions).toEqual([ActionTypes.NEW_MOVE, ActionTypes.STALEMATE]);
      expect(state.status).toBe(Status.stalemate);
    });

    it('ends the game in a draw when an under-promotion leaves insufficient material', () => {
      const promotion = gameFrom({ b6: 'white-king', c7: 'white-pawn', a8: 'black-king' });

      expect(finish(promotion, 'c7', 'c8', 'knight').state.status).toBe(Status.insufficient);
      expect(finish(promotion, 'c7', 'c8', 'bishop').state.status).toBe(Status.insufficient);
    });

    it('is no stalemate when the only reply is an en passant capture', () => {
      const game = gameFrom({ a1: 'white-king', e5: 'white-pawn', b3: 'black-queen', e6: 'black-knight', h8: 'black-king', d7: 'black-pawn' }, 'black');
      const { actions, state } = finish(game, 'd7', 'd5');

      expect(actions).toEqual([ActionTypes.NEW_MOVE]);
      expect(state.status).toBe(Status.ongoing);
    });

    it('is no checkmate when an en passant capture removes the checking pawn', () => {
      const game = gameFrom({ e4: 'white-king', e5: 'white-pawn', d7: 'black-pawn', c6: 'black-pawn', f8: 'black-rook', a3: 'black-rook', b5: 'black-knight', h8: 'black-king' }, 'black');
      const { actions, state } = finish(game, 'd7', 'd5');

      expect(actions).toEqual([ActionTypes.NEW_MOVE]);
      expect(state.status).toBe(Status.ongoing);
    });
  });

  it('returns the same state for unknown actions', () => {
    // An action from outside the typed set, as only untyped code could send it.
    const unknownAction: { type: string } = { type: 'UNKNOWN' };
    expect(ChessReducer(initChessGame, unknownAction as ChessAction)).toBe(initChessGame);
  });
});
