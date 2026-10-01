import { describe, expect, it } from 'vitest';
import { CheckersReducer } from './Reducer';
import {
  clearCandidates,
  continueCapture,
  gameOver,
  generateCandidateAttack,
  generateCandidateMoves,
  makeNewMove,
  setForcedCaptures,
  setupNewGame,
  startClock,
  surrender,
  takeBack,
  tickClock
} from './actions/move';
import { DEFAULT_TIME_CONTROL_MS, initCheckersGame } from './constant';
import { Status } from './types';
import { boardWith, sq } from '../../shared/test/boardTestUtils';

const reduce = (state, ...actions) => actions.reduce(CheckersReducer, state);

// Distinct boards standing for consecutive positions; the reducer treats them as opaque payloads.
const afterWhiteMove = boardWith({ d4: 'white-checker', e5: 'black-checker' });
const afterFirstLeg = boardWith({ c3: 'black-checker', g5: 'white-checker' });
const afterSecondLeg = boardWith({ e1: 'black-queen' });

const whiteMove = makeNewMove({ newPosition: afterWhiteMove, newMove: 'c3-d4' });
const blackFirstLeg = continueCapture({ newPosition: afterFirstLeg, chainCapturePiece: sq('c3'), newMove: 'e5xc3' });
const blackSecondLeg = makeNewMove({ newPosition: afterSecondLeg, newMove: 'c3xe1' });

describe('CheckersReducer', () => {
  describe('initial state', () => {
    it('starts an ongoing game with white to move and no pending captures', () => {
      expect(initCheckersGame.turn).toBe('white');
      expect(initCheckersGame.status).toBe(Status.ongoing);
      expect(initCheckersGame.position).toHaveLength(1);
      expect(initCheckersGame.forcedCapturePieces).toEqual([]);
      expect(initCheckersGame.chainCapturePiece).toBeNull();
      expect(initCheckersGame.whiteTime).toBe(DEFAULT_TIME_CONTROL_MS);
      expect(initCheckersGame.blackTime).toBe(DEFAULT_TIME_CONTROL_MS);
    });
  });

  describe('NEW_MOVE', () => {
    it('appends the position and notation and passes the turn', () => {
      const state = CheckersReducer(initCheckersGame, whiteMove);

      expect(state.turn).toBe('black');
      expect(state.position).toEqual([initCheckersGame.position[0], afterWhiteMove]);
      expect(state.movesList).toEqual(['c3-d4']);
      expect(state.chainCapturePiece).toBeNull();
    });

    it('stores the clock snapshot of the finished turn', () => {
      const ticking = reduce(initCheckersGame, startClock(), tickClock(3000));
      const state = CheckersReducer(ticking, whiteMove);

      expect(state.timeHistory).toEqual([{ whiteTime: DEFAULT_TIME_CONTROL_MS, blackTime: DEFAULT_TIME_CONTROL_MS }]);
      expect(state.turnStartTimes).toEqual({ whiteTime: DEFAULT_TIME_CONTROL_MS - 3000, blackTime: DEFAULT_TIME_CONTROL_MS });
    });

    it('does not mutate the previous state', () => {
      const snapshot = JSON.stringify(initCheckersGame);
      CheckersReducer(initCheckersGame, whiteMove);
      expect(JSON.stringify(initCheckersGame)).toBe(snapshot);
    });
  });

  describe('chain capture', () => {
    it('CONTINUE_CAPTURE records the leg but keeps the turn with the capturing piece', () => {
      const state = reduce(initCheckersGame, whiteMove, blackFirstLeg);

      expect(state.turn).toBe('black');
      expect(state.chainCapturePiece).toEqual(sq('c3'));
      expect(state.position).toHaveLength(3);
      expect(state.movesList).toEqual(['c3-d4', 'e5xc3']);
      expect(state.timeHistory).toHaveLength(1);
    });

    it('the final leg passes the turn and ends the chain', () => {
      const state = reduce(initCheckersGame, whiteMove, blackFirstLeg, blackSecondLeg);

      expect(state.turn).toBe('white');
      expect(state.chainCapturePiece).toBeNull();
      expect(state.position).toHaveLength(4);
      expect(state.movesList).toEqual(['c3-d4', 'e5xc3', 'c3xe1']);
      expect(state.timeHistory).toHaveLength(2);
    });
  });

  describe('forced captures and candidates', () => {
    it('SET_FORCED_CAPTURES stores the pieces that must capture', () => {
      const state = CheckersReducer(initCheckersGame, setForcedCaptures({ forcedCapturePieces: [sq('c3'), sq('e3')] }));
      expect(state.forcedCapturePieces).toEqual([sq('c3'), sq('e3')]);
    });

    it('stores candidate moves and attacks and clears both at once', () => {
      const withCandidates = reduce(
        initCheckersGame,
        generateCandidateMoves({ candidateMoves: [sq('e5')] }),
        generateCandidateAttack({ candidateAttack: [sq('d4')] })
      );

      expect(withCandidates.candidateMoves).toEqual([sq('e5')]);
      expect(withCandidates.candidateAttack).toEqual([sq('d4')]);

      const cleared = CheckersReducer(withCandidates, clearCandidates());
      expect(cleared.candidateMoves).toEqual([]);
      expect(cleared.candidateAttack).toEqual([]);
    });
  });

  describe('TAKE_BACK', () => {
    it('restores the previous position and turn and stops the clock at the start', () => {
      const moved = reduce(initCheckersGame, startClock(), whiteMove);
      const state = CheckersReducer(moved, takeBack());

      expect(state.turn).toBe('white');
      expect(state.position).toEqual(initCheckersGame.position);
      expect(state.movesList).toEqual([]);
      expect(state.clockStarted).toBe(false);
    });

    it('restores both clocks to the start of the undone turn', () => {
      const whiteThinking = reduce(initCheckersGame, startClock(), tickClock(2000));
      const blackThinking = reduce(whiteThinking, whiteMove, tickClock(4000));
      const blackMoved = CheckersReducer(blackThinking, makeNewMove({ newPosition: afterFirstLeg, newMove: 'e5-f4' }));

      const state = CheckersReducer(blackMoved, takeBack());

      expect(state.turn).toBe('black');
      expect(state.whiteTime).toBe(DEFAULT_TIME_CONTROL_MS - 2000);
      expect(state.blackTime).toBe(DEFAULT_TIME_CONTROL_MS);
      expect(state.clockStarted).toBe(true);
    });

    it("gives White back the time spent on the undone move", () => {
      const thinking = reduce(initCheckersGame, startClock(), tickClock(2000));
      const moved = CheckersReducer(thinking, whiteMove);

      const state = CheckersReducer(moved, takeBack());

      expect(state.turn).toBe('white');
      expect(state.whiteTime).toBe(DEFAULT_TIME_CONTROL_MS);
      expect(state.blackTime).toBe(DEFAULT_TIME_CONTROL_MS);
    });

    it('clears pending forced and chain captures', () => {
      const pending = reduce(initCheckersGame, whiteMove, blackFirstLeg, setForcedCaptures({ forcedCapturePieces: [sq('c3')] }));
      const state = CheckersReducer(pending, takeBack());

      expect(state.chainCapturePiece).toBeNull();
      expect(state.forcedCapturePieces).toEqual([]);
    });

    it('returns the same state in the initial position', () => {
      expect(CheckersReducer(initCheckersGame, takeBack())).toBe(initCheckersGame);
    });

    // KNOWN BUG (not fixed in this stage): a multi-leg capture is undone one leg at a time and
    // every TAKE_BACK flips the turn, so after undoing a whole chain the wrong side is to move.
    it('flips the turn for every undone capture leg (current behaviour, known bug)', () => {
      const afterChain = reduce(initCheckersGame, whiteMove, blackFirstLeg, blackSecondLeg);

      const oneBack = CheckersReducer(afterChain, takeBack());
      const twoBack = CheckersReducer(oneBack, takeBack());

      expect(oneBack.turn).toBe('black');
      expect(twoBack.position).toEqual([initCheckersGame.position[0], afterWhiteMove]);
      expect(twoBack.turn).toBe('white');
    });
  });

  describe('game over', () => {
    it('GAME_OVER stores the result', () => {
      expect(CheckersReducer(initCheckersGame, gameOver({ status: Status.blackWins })).status).toBe(Status.blackWins);
    });

    it('SURRENDER ends the game against the player to move', () => {
      expect(CheckersReducer(initCheckersGame, surrender()).status).toBe(Status.whiteSurrender);
      expect(CheckersReducer({ ...initCheckersGame, turn: 'black' }, surrender()).status).toBe(Status.blackSurrender);
    });

    it('SURRENDER is ignored once the game is already over', () => {
      // The Surrender button stays clickable next to the game-over overlay.
      const finished = CheckersReducer(initCheckersGame, gameOver({ status: Status.whiteWins }));
      expect(CheckersReducer(finished, surrender())).toBe(finished);
    });
  });

  describe('clock', () => {
    it('START_CLOCK marks the clock as started', () => {
      expect(CheckersReducer(initCheckersGame, startClock()).clockStarted).toBe(true);
    });

    it('TICK only consumes the time of the player to move', () => {
      const white = CheckersReducer(initCheckersGame, tickClock(1000));
      const black = CheckersReducer({ ...initCheckersGame, turn: 'black' }, tickClock(1000));

      expect(white.whiteTime).toBe(DEFAULT_TIME_CONTROL_MS - 1000);
      expect(white.blackTime).toBe(DEFAULT_TIME_CONTROL_MS);
      expect(black.blackTime).toBe(DEFAULT_TIME_CONTROL_MS - 1000);
    });

    it('TICK ends the game on time in favour of the opponent', () => {
      const whiteFlag = CheckersReducer({ ...initCheckersGame, whiteTime: 400 }, tickClock(1000));
      const blackFlag = CheckersReducer({ ...initCheckersGame, turn: 'black', blackTime: 1000 }, tickClock(1000));

      expect(whiteFlag.whiteTime).toBe(0);
      expect(whiteFlag.status).toBe(Status.blackOnTime);
      expect(blackFlag.blackTime).toBe(0);
      expect(blackFlag.status).toBe(Status.whiteOnTime);
    });

    it('TICK is ignored once the game is over', () => {
      const finished = CheckersReducer(initCheckersGame, gameOver({ status: Status.whiteWins }));
      expect(CheckersReducer(finished, tickClock(1000))).toBe(finished);
    });
  });

  describe('NEW_GAME', () => {
    it('resets a finished game to the given initial state', () => {
      const finished = reduce(initCheckersGame, startClock(), whiteMove, blackFirstLeg, surrender());
      expect(CheckersReducer(finished, setupNewGame(initCheckersGame))).toEqual(initCheckersGame);
    });
  });

  it('returns the same state for unknown actions', () => {
    expect(CheckersReducer(initCheckersGame, { type: 'UNKNOWN' })).toBe(initCheckersGame);
  });
});
