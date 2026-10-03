import { describe, expect, it } from 'vitest';
import { CheckersReducer } from './Reducer';
import {
  clearCandidates,
  continueCapture,
  gameOver,
  generateCandidateAttack,
  generateCandidateMoves,
  makeNewMove,
  markResultRecorded,
  setForcedCaptures,
  setupNewGame,
  startClock,
  surrender,
  takeBack,
  tickClock
} from './actions/move';
import { DEFAULT_TIME_CONTROL_MS, initCheckersGame } from './constant';
import { Status } from './types';
import type { CheckersAction, CheckersState } from './types';
import { boardWith, sq } from '../../shared/test/boardTestUtils';

const reduce = (state: CheckersState, ...actions: CheckersAction[]) => actions.reduce(CheckersReducer, state);

// Distinct boards standing for consecutive positions; the reducer treats them as opaque payloads.
const afterWhiteMove = boardWith({ d4: 'white-checker', e5: 'black-checker' });
const afterFirstLeg = boardWith({ c3: 'black-checker', g5: 'white-checker' });
const afterSecondLeg = boardWith({ e1: 'black-queen' });

const whiteMove = makeNewMove({ newPosition: afterWhiteMove, newMove: 'c3-d4' });
const blackFirstLeg = continueCapture({ newPosition: afterFirstLeg, chainCapturePiece: sq('c3'), newMove: 'e5xc3' });
const blackSecondLeg = makeNewMove({ newPosition: afterSecondLeg, newMove: 'c3xe1' });

// The same chain going on for a third jump.
const afterThirdLeg = boardWith({ g3: 'black-queen' });
const blackSecondLegContinues = continueCapture({ newPosition: afterSecondLeg, chainCapturePiece: sq('e1'), newMove: 'c3xe1' });
const blackThirdLeg = makeNewMove({ newPosition: afterThirdLeg, newMove: 'e1xg3' });

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
    it('CONTINUE_CAPTURE shows the jump but keeps the turn and the moves list as they were', () => {
      const state = reduce(initCheckersGame, whiteMove, blackFirstLeg);

      expect(state.turn).toBe('black');
      expect(state.chainCapturePiece).toEqual(sq('c3'));
      expect(state.position.at(-1)).toBe(afterFirstLeg);
      expect(state.movesList).toEqual(['c3-d4']);
      expect(state.timeHistory).toHaveLength(1);
    });

    it('records a finished double capture as one move and one position', () => {
      const state = reduce(initCheckersGame, whiteMove, blackFirstLeg, blackSecondLeg);

      expect(state.turn).toBe('white');
      expect(state.chainCapturePiece).toBeNull();
      expect(state.movesList).toEqual(['c3-d4', 'e5xc3xe1']);
      expect(state.position).toEqual([initCheckersGame.position[0], afterWhiteMove, afterSecondLeg]);
      expect(state.timeHistory).toHaveLength(2);
    });

    it('records a finished triple capture as one move and one position', () => {
      const state = reduce(initCheckersGame, whiteMove, blackFirstLeg, blackSecondLegContinues, blackThirdLeg);

      expect(state.turn).toBe('white');
      expect(state.movesList).toEqual(['c3-d4', 'e5xc3xe1xg3']);
      expect(state.position).toEqual([initCheckersGame.position[0], afterWhiteMove, afterThirdLeg]);
    });

    it('adds exactly one entry per turn, so moves pair up by turn again', () => {
      const whiteReply = makeNewMove({ newPosition: afterWhiteMove, newMove: 'a3-b4' });
      const state = reduce(initCheckersGame, whiteMove, blackFirstLeg, blackSecondLeg, whiteReply);

      expect(state.movesList).toEqual(['c3-d4', 'e5xc3xe1', 'a3-b4']);
      expect(state.turn).toBe('black');
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
        generateCandidateMoves({ candidateMoves: [sq('e5')], from: sq('c3') }),
        generateCandidateAttack({ candidateAttack: [sq('d4')] })
      );

      expect(withCandidates.candidateMoves).toEqual([sq('e5')]);
      expect(withCandidates.candidateAttack).toEqual([sq('d4')]);
      expect(withCandidates.selected).toEqual(sq('c3'));

      const cleared = CheckersReducer(withCandidates, clearCandidates());
      expect(cleared.candidateMoves).toEqual([]);
      expect(cleared.candidateAttack).toEqual([]);
      expect(cleared.selected).toBeNull();
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

    // White plays after 1 s, Black thinks 3 s, jumps once, thinks 2 s more.
    const blackThinking = reduce(initCheckersGame, startClock(), tickClock(1000), whiteMove, tickClock(3000));
    const midChain = reduce(blackThinking, blackFirstLeg, tickClock(2000));

    it('takes back a finished chain capture as one whole turn', () => {
      const afterChain = CheckersReducer(midChain, blackSecondLeg);

      const state = CheckersReducer(afterChain, takeBack());

      expect(state.position).toEqual([initCheckersGame.position[0], afterWhiteMove]);
      expect(state.movesList).toEqual(['c3-d4']);
      expect(state.turn).toBe('black');
      expect(state.whiteTime).toBe(DEFAULT_TIME_CONTROL_MS - 1000);
      expect(state.blackTime).toBe(DEFAULT_TIME_CONTROL_MS);
      expect(state.timeHistory).toHaveLength(1);
    });

    it('takes back a finished triple capture as one whole turn', () => {
      const afterChain = reduce(initCheckersGame, whiteMove, blackFirstLeg, blackSecondLegContinues, blackThirdLeg);

      const state = CheckersReducer(afterChain, takeBack());

      expect(state.position).toEqual([initCheckersGame.position[0], afterWhiteMove]);
      expect(state.movesList).toEqual(['c3-d4']);
      expect(state.turn).toBe('black');
    });

    it('takes back an unfinished chain to the start of the turn and keeps the same player to move', () => {
      const state = CheckersReducer(midChain, takeBack());

      expect(state.position).toEqual([initCheckersGame.position[0], afterWhiteMove]);
      expect(state.movesList).toEqual(['c3-d4']);
      expect(state.turn).toBe('black');
      expect(state.chainCapturePiece).toBeNull();
      expect(state.whiteTime).toBe(DEFAULT_TIME_CONTROL_MS - 1000);
      expect(state.blackTime).toBe(DEFAULT_TIME_CONTROL_MS);
      expect(state.turnStartTimes).toEqual(midChain.turnStartTimes);
      expect(state.timeHistory).toEqual(midChain.timeHistory);
      expect(state.clockStarted).toBe(true);
    });

    it('puts a finished game back in play and keeps the mark that its result was recorded', () => {
      const finished = reduce(initCheckersGame, whiteMove, gameOver({ status: Status.whiteWins }), markResultRecorded());

      const state = CheckersReducer(finished, takeBack());

      expect(state.status).toBe(Status.ongoing);
      expect(state.turn).toBe('white');
      expect(state.position).toEqual(initCheckersGame.position);
      expect(state.resultRecorded).toBe(true);
    });

    it('clears the highlighted moves of the turn it takes back', () => {
      const highlighted = reduce(
        initCheckersGame,
        whiteMove,
        generateCandidateMoves({ candidateMoves: [sq('a5')], from: sq('b6') }),
        generateCandidateAttack({ candidateAttack: [sq('b4')] })
      );

      const state = CheckersReducer(highlighted, takeBack());

      expect(state.candidateMoves).toEqual([]);
      expect(state.candidateAttack).toEqual([]);
      expect(state.selected).toBeNull();
    });

    it('lets the chain be played again after it was taken back', () => {
      const replayed = reduce(midChain, takeBack(), blackFirstLeg, blackSecondLeg);

      expect(replayed.movesList).toEqual(['c3-d4', 'e5xc3xe1']);
      expect(replayed.position).toEqual([initCheckersGame.position[0], afterWhiteMove, afterSecondLeg]);
      expect(replayed.turn).toBe('white');
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

    it('RESULT_RECORDED marks the result of the game as recorded until a new game starts', () => {
      const recorded = reduce(initCheckersGame, gameOver({ status: Status.blackWins }), markResultRecorded());

      expect(initCheckersGame.resultRecorded).toBe(false);
      expect(recorded.resultRecorded).toBe(true);
      expect(CheckersReducer(recorded, setupNewGame(initCheckersGame)).resultRecorded).toBe(false);
    });

    // A checker selected by a tap stays selected until something drops it; the end of the game does.
    it.each([
      ['a surrender', (state: CheckersState) => CheckersReducer(state, surrender())],
      ['running out of time', (state: CheckersState) => CheckersReducer({ ...state, whiteTime: 400 }, tickClock(1000))],
    ])('%s drops the selected checker and its highlights', (_, end) => {
      const selected = reduce(
        initCheckersGame,
        generateCandidateMoves({ candidateMoves: [sq('d4')], from: sq('c3') }),
        generateCandidateAttack({ candidateAttack: [sq('e5')] })
      );

      const ended = end(selected);

      expect(ended.status).not.toBe(Status.ongoing);
      expect(ended).toMatchObject({ selected: null, candidateMoves: [], candidateAttack: [] });
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
    // An action from outside the typed set, as only untyped code could send it.
    const unknownAction: { type: string } = { type: 'UNKNOWN' };
    expect(CheckersReducer(initCheckersGame, unknownAction as CheckersAction)).toBe(initCheckersGame);
  });
});
