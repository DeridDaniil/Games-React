import { ActionTypes, Status } from "./types";
import type { ChessAction, ChessState } from "./types";
import { keepCastlingRights } from "../lib/arbiter/castling";

export const ChessReducer = (state: ChessState, action: ChessAction): ChessState => {
  switch (action.type) {
    case ActionTypes.NEW_MOVE: {
      const { turnStartTimes } = state;
      let { turn, position, movesList, timeHistory } = state;
      const { newPosition } = action.payload;
      turn = turn === 'white' ? 'black' : 'white';
      position = [
        ...position,
        newPosition
      ];
      movesList = [
        ...movesList,
        action.payload.newMove
      ];
      timeHistory = [
        ...timeHistory,
        turnStartTimes
      ];
      // Castling rights follow from the new position; the old ones are kept for Take Back.
      return {
        ...state,
        turn,
        position,
        movesList,
        timeHistory,
        castleDirection: {
          white: keepCastlingRights(state.castleDirection.white, newPosition, 'white'),
          black: keepCastlingRights(state.castleDirection.black, newPosition, 'black')
        },
        castlingHistory: [...state.castlingHistory, state.castleDirection],
        turnStartTimes: { whiteTime: state.whiteTime, blackTime: state.blackTime }
      };
    }

    case ActionTypes.GENERATE_CANDIDATE_MOVES: {
      return {
        ...state,
        selected: action.payload.from,
        candidateMoves: action.payload.candidateMoves
      }
    }

    case ActionTypes.CLEAR_CANDIDATE_MOVES: {
      return {
        ...state,
        selected: null,
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
        status: winner === 'white' ? Status.whiteOnTime : Status.blackOnTime,
        promotionSquare: null,
        selected: null,
        candidateMoves: []
      };
    }

    // The side to move gives up a game in play (a pending promotion choice goes with it); the
    // result screen then shows the other side as the winner.
    case ActionTypes.SURRENDER: {
      if (state.status !== Status.ongoing && state.status !== Status.promoting) return state;

      return {
        ...state,
        status: state.turn === 'white' ? Status.whiteSurrender : Status.blackSurrender,
        promotionSquare: null,
        selected: null,
        candidateMoves: []
      };
    }

    case ActionTypes.RESULT_RECORDED: {
      return {
        ...state,
        resultRecorded: true
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

      // Running out of time also abandons a promotion that was still being chosen.
      if (remaining <= 0) {
        const loser = state.turn;
        const winner = loser === 'white' ? 'black' : 'white';

        return {
          ...state,
          whiteTime: loser === 'white' ? 0 : state.whiteTime,
          blackTime: loser === 'black' ? 0 : state.blackTime,
          status: winner === 'white' ? Status.whiteOnTime : Status.blackOnTime,
          promotionSquare: null,
          selected: null,
          candidateMoves: []
        };
      }

      return {
        ...state,
        [activeKey]: remaining
      };
    }

    case ActionTypes.TAKE_BACK: {
      // A pawn waiting for its promotion has not moved yet, so only the pending choice is cancelled.
      if (state.status === Status.promoting) {
        return {
          ...state,
          status: Status.ongoing,
          promotionSquare: null,
          selected: null,
          candidateMoves: []
        };
      }

      let { position, movesList, turn, timeHistory, castlingHistory } = state;
      if (position.length > 1) {
        position = position.slice(0, position.length - 1);
        movesList = movesList.slice(0, movesList.length - 1);
        turn = turn === 'white' ? 'black' : 'white';

        const previousTurnStart = timeHistory[timeHistory.length - 1];
        timeHistory = timeHistory.slice(0, timeHistory.length - 1);
        const previousCastling = castlingHistory[castlingHistory.length - 1];
        castlingHistory = castlingHistory.slice(0, castlingHistory.length - 1);

        // Moves are only played in an ongoing game, so undoing one, even the one that ended
        // the game, always leaves an ongoing game (its result stays recorded, see resultRecorded).
        // Back at the initial position the clock waits for White to pick up a piece again.
        return {
          ...state,
          position,
          movesList,
          turn,
          timeHistory,
          castlingHistory,
          castleDirection: previousCastling,
          status: Status.ongoing,
          selected: null,
          candidateMoves: [],
          clockStarted: position.length > 1,
          turnStartTimes: previousTurnStart,
          whiteTime: previousTurnStart.whiteTime,
          blackTime: previousTurnStart.blackTime
        }
      }
      return state;
    }
  }

  return state;
};
