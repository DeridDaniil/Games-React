import { getBishopMoves, getKingMoves, getKnightMoves, getPawnCaptures, getPawnMoves, getQueenMoves, getRookMoves } from "./getMoves"
import { moveFigures, movePawns } from "./move";

const arbiter = {
  getRegularMoves: function ({ position, figure, axisY, axisX }) {
    if (figure.slice(6) === 'rook') return getRookMoves({ position, figure, axisY, axisX });
    if (figure.slice(6) === 'knight') return getKnightMoves({ position, figure, axisY, axisX });
    if (figure.slice(6) === 'bishop') return getBishopMoves({ position, figure, axisY, axisX });
    if (figure.slice(6) === 'queen') return getQueenMoves({ position, figure, axisY, axisX });
    if (figure.slice(6) === 'king') return getKingMoves({ position, figure, axisY, axisX });
    if (figure.slice(6) === 'pawn') return getPawnMoves({ position, figure, axisY, axisX });
  },
  getValidMoves: function ({ position, prevPosition, figure, axisY, axisX }) {
    let moves = this.getRegularMoves({ position, prevPosition, figure, axisY, axisX });
    if (figure.slice(6) === 'pawn') {
      moves = [
        ...moves,
        ...getPawnCaptures({ position, prevPosition, figure, axisY, axisX })
      ];
    };
    return moves;
  },
  performMove: function ({ position, figure, axisY, axisX, y, x }) {
    if (figure.slice(6) === 'pawn') return movePawns({ position, figure, axisY, axisX, y, x });
    else return moveFigures({ position, figure, axisY, axisX, y, x });
  }
}

export default arbiter;