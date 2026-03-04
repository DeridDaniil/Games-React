import { ActionTypes, Status } from "../data/types";

export const ChessReducer = (state, action) => {
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
        timeHistory,
        turnStartTimes: { whiteTime: state.whiteTime, blackTime: state.blackTime }
      };
    }

    case ActionTypes.GENERATE_CANDIDATE_MOVES: {
      return {
        ...state,
        candidateMoves: action.payload.candidateMoves
      }
    }

    case ActionTypes.CLEAR_CANDIDATE_MOVES: {
      return {
        ...state,
        candidateMoves: []
      }
    }

    case ActionTypes.PROMOTION_OPEN: {
      return {
        ...state,
        status: Status.promoting,
        promotionSquare: { ...action.payload }
      }
    }

    case ActionTypes.PROMOTION_CLOSE: {
      return {
        ...state,
        status: Status.ongoing,
        promotionSquare: null
      }
    }

    case ActionTypes.CAN_CASTLE: {
      let { turn, castleDirection } = state;
      castleDirection[turn] = action.payload;

      return {
        ...state,
        castleDirection
      }
    }

    case ActionTypes.START_CLOCK: {
      return {
        ...state,
        clockStarted: true
      }
    }

    case ActionTypes.STALEMATE: {
      return {
        ...state,
        status: Status.stalemate
      }
    }

    case ActionTypes.NEW_GAME: {
      return {
        ...action.payload
      }
    }

    case ActionTypes.INSUFFICIENT_MATERIAL: {
      return {
        ...state,
        status: Status.insufficient
      }
    }

    case ActionTypes.WIN: {
      return {
        ...state,
        status: action.payload === 'white' ? Status.white : Status.black
      }
    }

    case ActionTypes.TIMEOUT: {
      const loser = action.payload;
      const winner = loser === 'white' ? 'black' : 'white';

      return {
        ...state,
        whiteTime: loser === 'white' ? 0 : state.whiteTime,
        blackTime: loser === 'black' ? 0 : state.blackTime,
        status: winner === 'white' ? Status.whiteOnTime : Status.blackOnTime
      };
    }

    case ActionTypes.TICK: {
      // Do not update time if game is already finished
      if (
        state.status !== Status.ongoing &&
        state.status !== Status.promoting
      ) {
        return state;
      }

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

    case ActionTypes.TAKE_BACK: {
      let { position, movesList, turn, timeHistory } = state;
      if (position.length > 1) {
        position = position.slice(0, position.length - 1);
        movesList = movesList.slice(0, movesList.length - 1);
        turn = turn === 'white' ? 'black' : 'white';

        const previousTurnStart = timeHistory[timeHistory.length - 1];
        timeHistory = timeHistory.slice(0, timeHistory.length - 1);

        return {
          ...state,
          position,
          movesList,
          turn,
          timeHistory,
          turnStartTimes: previousTurnStart,
          whiteTime: previousTurnStart.whiteTime,
          blackTime: previousTurnStart.blackTime
        }
      }
      return {
        ...state,
        position,
        movesList,
        turn
      }
    }
  }

  return state;
};