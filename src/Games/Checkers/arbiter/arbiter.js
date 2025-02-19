import { getCheckerAttack, getCheckerMoves } from "./getMoves"

const arbiter = {
  getRegularMoves: function ({ position, checker, axisY, axisX }) {
    return getCheckerMoves({ position, checker, axisY, axisX });
  },
  getAttackingMoves: function ({ position, checker, axisY, axisX }) {
    return getCheckerAttack({ position, checker, axisY, axisX });
  }
}

export default arbiter;