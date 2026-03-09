import { ActionTypes, Status } from "../data/types";
import { DEFAULT_TIME_CONTROL_MS } from "../data/constant";

export const CheckersReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.NEW_MOVE: {
      let { turn, position, movesList, turnStartTimes, timeHistory } = state;
      turn = turn === 'white' ? 'black' : 'white';
      position = [
        ...position,
        action.payload.newPosition
      ];
      movesList = [
        ...movesList,
        action.payload.newMove
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
        timeHistory,
        turnStartTimes: { whiteTime: state.whiteTime, blackTime: state.blackTime }
      }
    }

    case ActionTypes.CONTINUE_CAPTURE: {
      const position = [
        ...state.position,
        action.payload.newPosition
      ];
      const movesList = [
        ...state.movesList,
        action.payload.newMove
      ];
      return {
        ...state,
        position,
        movesList,
        chainCapturePiece: action.payload.chainCapturePiece
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

        return {
          ...state,
          position,
          movesList,
          turn,
          timeHistory,
          chainCapturePiece: null,
          forcedCapturePieces: [],
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
      const loser = state.turn;
      return {
        ...state,
        status: loser === 'white' ? Status.whiteSurrender : Status.blackSurrender
      };
    }
  }

  return state;
}