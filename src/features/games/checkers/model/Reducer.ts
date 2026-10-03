import { ActionTypes, Status } from "./types";
import type { CheckersAction, CheckersState } from "./types";
import { DEFAULT_TIME_CONTROL_MS } from "./constant";

// "a3xc5" + "c5xe7" → "a3xc5xe7": the jumps of one chain capture written as a single move.
const joinJumps = (chainNotation: string, jump: string) => chainNotation + jump.slice(jump.indexOf('x'));

export const CheckersReducer = (state: CheckersState, action: CheckersAction): CheckersState => {
  switch (action.type) {
    case ActionTypes.NEW_MOVE: {
      const { chain, turnStartTimes } = state;
      let { turn, position, movesList, timeHistory } = state;
      turn = turn === 'white' ? 'black' : 'white';
      // The last jump of a chain capture ends the turn: the boards between its jumps make way
      // for the final one, and the jumps are recorded together as one move.
      position = [
        ...(chain ? position.slice(0, chain.start + 1) : position),
        action.payload.newPosition
      ];
      movesList = [
        ...movesList,
        chain ? joinJumps(chain.notation, action.payload.newMove) : action.payload.newMove
      ];
      timeHistory = [
        ...timeHistory,
        turnStartTimes
      ];
      return {
        ...state,
        turn,
        position,
        movesList,
        chainCapturePiece: null,
        chain: null,
        timeHistory,
        turnStartTimes: { whiteTime: state.whiteTime, blackTime: state.blackTime }
      }
    }

    // A jump that another capture must follow: the board shows it, but the turn, the moves list
    // and the clocks' history wait until the chain ends (NEW_MOVE).
    case ActionTypes.CONTINUE_CAPTURE: {
      const chain = state.chain
        ? { ...state.chain, notation: joinJumps(state.chain.notation, action.payload.newMove) }
        : { start: state.position.length - 1, notation: action.payload.newMove };
      return {
        ...state,
        position: [
          ...state.position,
          action.payload.newPosition
        ],
        chainCapturePiece: action.payload.chainCapturePiece,
        chain
      }
    }

    case ActionTypes.GENERATE_CANDIDATE_MOVES: {
      return {
        ...state,
        candidateMoves: action.payload.candidateMoves
      }
    }

    case ActionTypes.GENERATE_CANDIDATE_ATTACK: {
      return {
        ...state,
        candidateAttack: action.payload.candidateAttack
      }
    }

    case ActionTypes.CLEAR_CANDIDATE: {
      return {
        ...state,
        candidateMoves: [],
        candidateAttack: []
      }
    }

    case ActionTypes.SET_FORCED_CAPTURES: {
      return {
        ...state,
        forcedCapturePieces: action.payload.forcedCapturePieces
      }
    }

    case ActionTypes.GAME_OVER: {
      return {
        ...state,
        status: action.payload.status
      }
    }

    case ActionTypes.NEW_GAME: {
      return {
        ...action.payload
      }
    }

    case ActionTypes.TAKE_BACK: {
      // An unfinished chain capture goes back to the start of its turn: the same player is to move,
      // with the clocks as they were when the turn began.
      if (state.chain) {
        const position = state.position.slice(0, state.chain.start + 1);
        return {
          ...state,
          position,
          chain: null,
          chainCapturePiece: null,
          forcedCapturePieces: [],
          candidateMoves: [],
          candidateAttack: [],
          clockStarted: position.length > 1,
          whiteTime: state.turnStartTimes.whiteTime,
          blackTime: state.turnStartTimes.blackTime
        };
      }

      let { position, movesList, turn, timeHistory } = state;
      if (position.length > 1) {
        position = position.slice(0, position.length - 1);
        movesList = movesList.slice(0, movesList.length - 1);
        turn = turn === 'white' ? 'black' : 'white';

        const defaultTimes = { whiteTime: DEFAULT_TIME_CONTROL_MS, blackTime: DEFAULT_TIME_CONTROL_MS };
        const previousTurnStart = timeHistory.length > 0
          ? timeHistory[timeHistory.length - 1]
          : defaultTimes;
        timeHistory = timeHistory.slice(0, timeHistory.length - 1);

        // Undoing a turn, even the one that ended the game, leaves a game in play again (its
        // result stays recorded, see resultRecorded).
        return {
          ...state,
          position,
          movesList,
          turn,
          timeHistory,
          status: Status.ongoing,
          chainCapturePiece: null,
          forcedCapturePieces: [],
          candidateMoves: [],
          candidateAttack: [],
          clockStarted: position.length > 1,
          turnStartTimes: previousTurnStart,
          whiteTime: previousTurnStart.whiteTime,
          blackTime: previousTurnStart.blackTime
        }
      }
      return state;
    }

    case ActionTypes.START_CLOCK: {
      return {
        ...state,
        clockStarted: true
      }
    }

    case ActionTypes.RESULT_RECORDED: {
      return {
        ...state,
        resultRecorded: true
      }
    }

    case ActionTypes.TICK: {
      if (state.status !== Status.ongoing) return state;

      const activeKey = state.turn === 'white' ? 'whiteTime' : 'blackTime';
      const remaining = state[activeKey] - action.payload.delta;

      if (remaining <= 0) {
        const loser = state.turn;
        const winner = loser === 'white' ? 'black' : 'white';

        return {
          ...state,
          whiteTime: loser === 'white' ? 0 : state.whiteTime,
          blackTime: loser === 'black' ? 0 : state.blackTime,
          status: winner === 'white' ? Status.whiteOnTime : Status.blackOnTime
        };
      }

      return {
        ...state,
        [activeKey]: remaining
      };
    }

    case ActionTypes.SURRENDER: {
      if (state.status !== Status.ongoing) return state;

      const loser = state.turn;
      return {
        ...state,
        status: loser === 'white' ? Status.whiteSurrender : Status.blackSurrender
      };
    }
  }

  return state;
}
