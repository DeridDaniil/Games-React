import type { DragEvent, MouseEvent } from 'react';
import Checker from '../Checker/Checker';
import { useCheckersContext } from '../../model/Context';
import { clearCandidates, moveChecker, selectChecker } from '../../model/actions/move';
import { colorOf, readDraggedChecker } from '../../lib/helper';
import type { Square } from '../../../shared/model/types';
import './CheckerFigures.scss';

// The pieces layer covers the board, so drops and taps anywhere on the board land here. Dragging and
// tapping share selectChecker and moveChecker, so both move checkers by the same rules.
function CheckerFigures() {
  const { checkersState, dispatch } = useCheckersContext();
  const position = checkersState.position[checkersState.position.length - 1];

  // The square under the pointer or finger, or null off the board.
  const squareAt = (e: DragEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>): Square | null => {
    const { width, top, left } = e.currentTarget.getBoundingClientRect();
    const size = width / 8;
    const y = 7 - Math.floor((e.clientY - top) / size);
    const x = Math.floor((e.clientX - left) / size);
    return y >= 0 && y <= 7 && x >= 0 && x <= 7 ? [y, x] : null;
  }

  // Highlights can outlive a drag that ended off the board, so whatever is dropped must name a
  // checker of the side to move that still stands on its square, and the one that was picked up. A
  // checker put back where it was stays selected, as after a click (a click that moves a little is a
  // drag).
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dragged = readDraggedChecker(e.dataTransfer.getData('text'), position, checkersState.turn);
    const target = squareAt(e);
    if (!dragged || !target) {
      dispatch(clearCandidates());
      return;
    }
    if (target[0] === dragged.axisY && target[1] === dragged.axisX) return;
    moveChecker(checkersState, [dragged.axisY, dragged.axisX], target).forEach(dispatch);
  }

  const onDragOver = (e: DragEvent<HTMLDivElement>) => e.preventDefault();

  // Tap (or click) a checker that may move to select it, then one of its highlighted squares to move
  // it there. Tapping the selected checker again puts it down; tapping another checker of the side to
  // move tries to select that one; tapping any other square drops the selection.
  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const square = squareAt(e);
    if (!square) return;
    const { selected, turn } = checkersState;
    const checker = position[square[0]][square[1]];

    if (selected && selected[0] === square[0] && selected[1] === square[1]) {
      dispatch(clearCandidates());
    } else if (checker && colorOf(checker) === turn) {
      selectChecker(checkersState, square).forEach(dispatch);
    } else if (selected) {
      moveChecker(checkersState, selected, square).forEach(dispatch);
    }
  }

  return (
    <div className="checker-figures" onDrop={onDrop} onDragOver={onDragOver} onClick={onClick}>
      {position.map((axisY, y) =>
        axisY.map((cell, x) =>
          cell ?
            <Checker
              key={y + '-' + x}
              axisY={y}
              axisX={x}
              checker={cell}
            /> : null
        )
      )}
    </div>
  )
}

export default CheckerFigures;
