import { getCheckerAttack, getCheckerMoves, getQueenMAttack, getQueenMoves } from "./getMoves"
import type { PieceAt } from "./getMoves";
import type { CheckersPosition, CheckersStatus } from "../../model/types";
import type { PlayerColor, Square } from "../../../shared/model/types";

interface PlayerOnBoard {
  position: CheckersPosition;
  player: PlayerColor;
}

const arbiter = {
  getRegularMoves: function ({ position, checker, axisY, axisX }: PieceAt): Square[] {
    if (position[axisY][axisX].slice(6) === 'checker') return getCheckerMoves({ position, checker, axisY, axisX });
    else return getQueenMoves({ position, checker, axisY, axisX });
  },
  getAttackingMoves: function ({ position, checker, axisY, axisX }: PieceAt): Square[] {
    if (position[axisY][axisX].slice(6) === 'checker') return getCheckerAttack({ position, checker, axisY, axisX });
    else return getQueenMAttack({ position, checker, axisY, axisX });
  },
  playerHasPieces: function ({ position, player }: PlayerOnBoard): boolean {
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        if (position[y][x] && position[y][x].slice(0, 5) === player) {
          return true;
        }
      }
    }
    return false;
  },
  playerHasMoves: function ({ position, player }: PlayerOnBoard): boolean {
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const checker = position[y][x];
        if (checker && checker.slice(0, 5) === player) {
          const moves = this.getRegularMoves({ position, checker, axisY: y, axisX: x });
          if (moves.length > 0) return true;
        }
      }
    }
    return false;
  },
  getGameResult: function ({ position, currentTurn }: { position: CheckersPosition; currentTurn: PlayerColor }): CheckersStatus | null {
    const opponent = currentTurn === 'white' ? 'black' : 'white';
    const currentHasPieces = this.playerHasPieces({ position, player: currentTurn });
    const opponentHasPieces = this.playerHasPieces({ position, player: opponent });

    if (!currentHasPieces) return opponent === 'white' ? 'White wins' : 'Black wins';
    if (!opponentHasPieces) return currentTurn === 'white' ? 'White wins' : 'Black wins';

    const currentHasMoves = this.playerHasMoves({ position, player: currentTurn });
    if (!currentHasMoves) return opponent === 'white' ? 'White wins' : 'Black wins';

    return null;
  },
  getPiecesWithCaptures: function ({ position, player }: PlayerOnBoard): Square[] {
    const pieces: Square[] = [];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const checker = position[y][x];
        if (checker && checker.slice(0, 5) === player) {
          const attacks = checker.slice(6) === 'checker'
            ? getCheckerAttack({ position, checker, axisY: y, axisX: x })
            : getQueenMAttack({ position, checker, axisY: y, axisX: x });
          if (attacks.length > 0) {
            pieces.push([y, x]);
          }
        }
      }
    }
    return pieces;
  }
}

export default arbiter;
