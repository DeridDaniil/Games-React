import { Status } from './types';
import type { ChessStatus } from './types';
import type { PlayerColor } from '../../shared/model/types';

// The side that won a game with this status, null for a draw, or undefined while the game goes on.
export const winnerOf = (status: ChessStatus): PlayerColor | null | undefined => {
  switch (status) {
    case Status.white:
    case Status.whiteOnTime:
    case Status.blackSurrender:
      return 'white';
    case Status.black:
    case Status.blackOnTime:
    case Status.whiteSurrender:
      return 'black';
    case Status.stalemate:
    case Status.insufficient:
      return null;
    case Status.ongoing:
    case Status.promoting:
      return undefined;
  }
};
