import { useEffect, useRef } from 'react';
import type { DragEvent } from 'react';
import { clearCandidates, selectPiece } from '../../model/actions/move';
import { useChessContext } from '../../model/Context';
import type { ChessPiece } from '../../model/types';
import './Figure.scss';

interface FigureProps {
  axisY: number;
  axisX: number;
  figure: ChessPiece;
}

function Figure({ axisY, axisX, figure }: FigureProps) {

  const { chessState, dispatch } = useChessContext();
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(hideTimerRef.current), []);

  const onDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${figure}, ${axisY}, ${axisX}`);
    // The piece (it has no children, so it is the drag target) hides once the drag has its image.
    const dragged = e.currentTarget;
    hideTimerRef.current = setTimeout(() => {
      dragged.style.display = 'none';
    }, 0);
    selectPiece(chessState, [axisY, axisX]).forEach(dispatch);
  }

  // The piece shows again however the drag ended. A drag that was cancelled or ended off the board
  // moved nothing, so its highlights go too; a drop on the board has dealt with them already.
  const onDragEnd = (e: DragEvent<HTMLDivElement>) => {
    clearTimeout(hideTimerRef.current);
    e.currentTarget.style.display = 'block';
    if (e.dataTransfer.dropEffect === 'none') dispatch(clearCandidates());
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
