import { getFigures, getKingPosition, getPawnCaptures, getRegularMoves } from './getMoves';
import type { ChessPosition } from '../../model/types';
import type { PlayerColor, Square } from '../../../shared/model/types';

interface CheckQuery {
  positionAfterMove: ChessPosition;
  // The position before that move, so enemy pawns can take en passant.
  position?: ChessPosition;
  player: PlayerColor;
}

// Whether an enemy piece could take `player`'s king in `positionAfterMove`.
export const isPlayerInCheck = ({ positionAfterMove, position, player }: CheckQuery): boolean => {
  const enemy = player === 'white' ? 'black' : 'white';
  const kingPosition = getKingPosition(positionAfterMove, player);
  // A position without that king (never one from a game) cannot hold it in check.
  if (!kingPosition) return false;
  const enemyFigures = getFigures(positionAfterMove, enemy);

  const enemyMoves = enemyFigures.reduce<Square[]>((acc, f) => acc = [
    ...acc,
    ...(f.figure.slice(6) === 'pawn')
      ? getPawnCaptures({
        position: positionAfterMove,
        prevPosition: position,
        ...f
      })
      : getRegularMoves({
        position: positionAfterMove,
        ...f
      })
  ], []);

  if (enemyMoves.some(([y, x]) => kingPosition[0] === y && kingPosition[1] === x)) return true;
  return false;
}
