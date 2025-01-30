import { getBishopMoves, getCastlingMoves, getFigures, getKingMoves, getKingPosition, getKnightMoves, getPawnCaptures, getPawnMoves, getQueenMoves, getRookMoves } from "./getMoves"
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
  getValidMoves: function ({ position, prevPosition, castleDirection, figure, axisY, axisX }) {
    let moves = this.getRegularMoves({ position, prevPosition, figure, axisY, axisX });
    const notInCheckMoves = [];

    if (figure.slice(6) === 'pawn') {
      moves = [
        ...moves,
        ...getPawnCaptures({ position, prevPosition, figure, axisY, axisX })
      ];
    };

    if (figure.slice(6) === 'king') {
      moves = [
        ...moves,
        ...getCastlingMoves({ position, castleDirection, figure, axisY, axisX })
      ];
    };

    moves.forEach(([y, x]) => {
      const positionAfterMove = this.performMove({ position, figure, axisY, axisX, y, x });
      if (!this.isPlayerInCheck({ positionAfterMove, position, player: figure.slice(0, 5) })) {
        notInCheckMoves.push([y, x]);
      }
    })

    return notInCheckMoves;
  },
  performMove: function ({ position, figure, axisY, axisX, y, x }) {
    if (figure.slice(6) === 'pawn') return movePawns({ position, figure, axisY, axisX, y, x });
    else return moveFigures({ position, figure, axisY, axisX, y, x });
  },
  isPlayerInCheck: function ({ positionAfterMove, position, player }) {
    const enemy = player === 'white' ? 'black' : 'white';
    let kingPosition = getKingPosition(positionAfterMove, player);
    const enemyFigures = getFigures(positionAfterMove, enemy);

    const enemyMoves = enemyFigures.reduce((acc, f) => acc = [
      ...acc,
      ...(f.figure.slice(6) === 'pawn')
        ? getPawnCaptures({
          position: positionAfterMove,
          prevPosition: position,
          ...f
        })
        : this.getRegularMoves({
          position: positionAfterMove,
          ...f
        })
    ], []);

    if (enemyMoves.some(([y, x]) => kingPosition[0] === y && kingPosition[1] === x)) return true;
    return false;
  }
}

export default arbiter;