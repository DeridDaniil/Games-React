import type { DragEvent } from 'react';
import arbiter from '../../lib/arbiter/arbiter';
import { generateCandidateMoves } from '../../model/actions/move';
import { useChessContext } from '../../model/Context';
import { startClock } from '../../model/actions/game';
import type { ChessPiece } from '../../model/types';
import './Figure.scss';

interface FigureProps {
  axisY: number;
  axisX: number;
  figure: ChessPiece;
}

function Figure({ axisY, axisX, figure }: FigureProps) {

  const { chessState, dispatch } = useChessContext();
  const { turn, position, castleDirection, clockStarted } = chessState;
  const currentPosition = position[position.length - 1];
  // Undefined before the first move.
  const prevPosition = position.at(-2);

  const onDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${figure}, ${axisY}, ${axisX}`);
    // The piece (it has no children, so it is the drag target) hides once the drag has its image.
    const dragged = e.currentTarget;
    setTimeout(() => {
      dragged.style.display = 'none';
    }, 0);
    if (turn === figure.slice(0, 5)) {
      if (!clockStarted) {
        dispatch(startClock());
      }
      const candidateMoves = arbiter.getValidMoves({
        position: currentPosition,
        prevPosition,
        castleDirection: castleDirection[turn],
        figure,
        axisY,
        axisX
      });
      dispatch(generateCandidateMoves({ candidateMoves }));
    }
  }

  const onDragEnd = (e: DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.display = 'block';
  };

  return (
    <div
      className={`figure ${figure} p-${axisY}${axisX}`}
      draggable={true}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    />
  )
}

export default Figure;
