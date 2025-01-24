import { getBishopMoves, getKingMoves, getKnightMoves, getPawnMoves, getQueenMoves, getRookMoves } from "./getMoves"

const arbiter = {
  getRegularMoves: function ({ position, figure, axisY, axisX }) {
    if (figure.slice(6) === 'rook') return getRookMoves({ position, figure, axisY, axisX });
    if (figure.slice(6) === 'knight') return getKnightMoves({ position, figure, axisY, axisX });
    if (figure.slice(6) === 'bishop') return getBishopMoves({ position, figure, axisY, axisX });
    if (figure.slice(6) === 'queen') return getQueenMoves({ position, figure, axisY, axisX });
    if (figure.slice(6) === 'king') return getKingMoves({ position, figure, axisY, axisX });
    if (figure.slice(6) === 'pawn') return getPawnMoves({ position, figure, axisY, axisX });
  }
}

export default arbiter;