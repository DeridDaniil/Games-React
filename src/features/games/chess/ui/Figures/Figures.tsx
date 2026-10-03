import type { DragEvent, MouseEvent } from 'react';
import { useChessContext } from '../../model/Context';
import { clearCandidates, movePiece, selectPiece } from '../../model/actions/move';
import Figure from '../Figure/Figure';
import { pieceColor, readDraggedFigure } from '../../lib/helper';
import type { Square } from '../../../shared/model/types';
import './Figures.scss';

// The pieces layer covers the board, so drops and taps anywhere on the board land here. Dragging and
// tapping share selectPiece and movePiece, so both move pieces by the same rules.
function Figures() {
  const { chessState, dispatch } = useChessContext();
  const position = chessState.position[chessState.position.length - 1];

  // The square under the pointer or finger, or null off the board.
  const squareAt = (e: DragEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>): Square | null => {
    const { width, left, top } = e.currentTarget.getBoundingClientRect();
    const size = width / 8;
    const y = 7 - Math.floor((e.clientY - top) / size);
    const x = Math.floor((e.clientX - left) / size);
    return y >= 0 && y <= 7 && x >= 0 && x <= 7 ? [y, x] : null;
  }

  // Highlights can outlive a drag that ended off the board, so the dropped data must describe a
  // piece of the side to move on its own square, and that piece must be the one picked up. A piece
  // put back where it was stays selected, as after a click (a click that moves a little is a drag).
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dragged = readDraggedFigure(e.dataTransfer.getData('text'), position, chessState.turn);
    const target = squareAt(e);
    if (!dragged || !target) {
      dispatch(clearCandidates());
      return;
    }
    if (target[0] === dragged.axisY && target[1] === dragged.axisX) return;
    movePiece(chessState, [dragged.axisY, dragged.axisX], target).forEach(dispatch);
  }

  const onDragOver = (e: DragEvent<HTMLDivElement>) => e.preventDefault();

  // Tap (or click) a piece of the side to move to select it, then one of its highlighted squares to
  // move it there. Tapping the selected piece again puts it down; tapping another square of one's
  // own switches to that piece; tapping any other square drops the selection.
  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const square = squareAt(e);
    if (!square) return;
    const { selected, turn } = chessState;
    const piece = position[square[0]][square[1]];

    if (selected && selected[0] === square[0] && selected[1] === square[1]) {
      dispatch(clearCandidates());
    } else if (piece && pieceColor(piece) === turn) {
      selectPiece(chessState, square).forEach(dispatch);
    } else if (selected) {
      movePiece(chessState, selected, square).forEach(dispatch);
    }
  }

  return (
    <div className="figures" onDrop={onDrop} onDragOver={onDragOver} onClick={onClick}>
      {position.map((axixY, y) =>
        axixY.map((cell, x) =>
          cell ?
            <Figure
              key={y + '-' + x}
              axisY={y}
              axisX={x}
              figure={cell}
            />
            : null
        )
      )}
    </div>
  )
}

export default Figures;
