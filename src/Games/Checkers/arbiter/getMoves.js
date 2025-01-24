export const getCheckerMoves = ({ position, checker, axisY, axisX }) => {
  const moves = [];
  const moveY = checker.slice(0, 5) === 'white' ? axisY + 1 : axisY - 1;

  moves.push([moveY, axisX - 1]);
  moves.push([moveY, axisX + 1]);

  return moves;
}