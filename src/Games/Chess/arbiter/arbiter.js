import { getKnightMoves, getRookMoves } from "./getMoves"

const arbiter = {
  getRegularMoves: function ({ position, figure, axisY, axisX }) {
    if (figure.slice(6) === 'rook') return getRookMoves({ position, figure, axisY, axisX });
    if (figure.slice(6) === 'knight') return getKnightMoves({ position, figure, axisY, axisX });
  }
}

export default arbiter;