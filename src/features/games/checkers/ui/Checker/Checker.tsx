import { useEffect, useRef } from 'react';
import type { DragEvent } from 'react';
import { canPickUpChecker, clearCandidates, selectChecker } from '../../model/actions/move';
import { useCheckersContext } from '../../model/Context';
import type { CheckerPiece } from '../../model/types';
import './Checker.scss';

interface CheckerProps {
  axisY: number;
  axisX: number;
  checker: CheckerPiece;
}

function Checker({ axisY, axisX, checker }: CheckerProps) {
  const { checkersState, dispatch } = useCheckersContext();
  const { turn, forcedCapturePieces } = checkersState;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(hideTimerRef.current), []);

  const isOurTurn = turn === checker.slice(0, 5);
  const hasForcedCaptures = forcedCapturePieces && forcedCapturePieces.length > 0;
  const isForcedPiece = hasForcedCaptures && forcedCapturePieces.some(p => p[0] === axisY && p[1] === axisX);
  const canDrag = canPickUpChecker(checkersState, [axisY, axisX]);

  const onDragStart = (e: DragEvent<HTMLDivElement>) => {
    if (!canDrag) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${axisY}, ${axisX}, ${checker}`);
    // The checker (it has no children, so it is the drag target) hides once the drag has its image.
    const dragged = e.currentTarget;
    hideTimerRef.current = setTimeout(() => {
      dragged.style.display = 'none';
    }, 0);
    selectChecker(checkersState, [axisY, axisX]).forEach(dispatch);
  }

  // The checker shows again however the drag ended. A drag that was cancelled or ended off the board
  // moved nothing, so its highlights (moves and captures) go too; a drop on the board has dealt with them.
  const onDragEnd = (e: DragEvent<HTMLDivElement>) => {
    clearTimeout(hideTimerRef.current);
    e.currentTarget.style.display = 'block';
    if (e.dataTransfer.dropEffect === 'none') dispatch(clearCandidates());
  };

  const classNames = [`checker`, checker, `p-${axisY}${axisX}`];
  if (isOurTurn && isForcedPiece) classNames.push('forced-capture');
  if (isOurTurn && hasForcedCaptures && !isForcedPiece) classNames.push('capture-blocked');

  return (
    <div
      className={classNames.join(' ')}
      draggable={canDrag}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    />
  )
}

export default Checker;
