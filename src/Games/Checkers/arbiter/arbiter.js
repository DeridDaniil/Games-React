import { getCheckerAttack, getCheckerMoves, getQueenMAttack, getQueenMoves } from "./getMoves"

const arbiter = {
  getRegularMoves: function ({ position, checker, axisY, axisX }) {
    if (position[axisY][axisX].slice(6) === 'checker') return getCheckerMoves({ position, checker, axisY, axisX });
    else return getQueenMoves({ position, checker, axisY, axisX });
  },
  getAttackingMoves: function ({ position, checker, axisY, axisX }) {
    if (position[axisY][axisX].slice(6) === 'checker') return getCheckerAttack({ position, checker, axisY, axisX });
    else return getQueenMAttack({ position, checker, axisY, axisX });
  }
}

export default arbiter;