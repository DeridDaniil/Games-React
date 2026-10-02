import { useRef } from 'react';
import { useChessContext } from '../../model/Context';
import { clearCandidates, playMove } from '../../model/actions/move';
import Figure from '../Figure/Figure';
import arbiter from '../../lib/arbiter/arbiter';
import { openPromotion } from '../../model/actions/popup';
import { getNewMoveNotation, readDraggedFigure } from '../../lib/helper';
import './Figures.scss';

function Figures() {
  const { chessState, dispatch } = useChessContext();
  const position = chessState.position[chessState.position.length - 1];
  const figuresRef = useRef(null);

  const calculateCoord = e => {
    const { width, left, top } = figuresRef.current.getBoundingClientRect();
    const size = width / 8;
    const y = 7 - Math.floor((e.clientY - top) / size);
    const x = Math.floor((e.clientX - left) / size);
    return { y, x };
  }

  const openPromotionBox = ({ axisY, axisX, y, x }) => {
    dispatch(openPromotion({ axisY, axisX, y, x }));
  }

  // Highlights can outlive a drag that ended off the board, so the dropped data must describe a
  // piece of the side to move on its own square before a highlighted square is accepted.
  const move = e => {
    const { y, x } = calculateCoord(e);
    const dragged = readDraggedFigure(e.dataTransfer.getData('text'), position, chessState.turn);
    if (dragged && chessState.candidateMoves?.find(m => m[0] === y && m[1] === x)) {
      const { figure, axisY, axisX } = dragged;

      if (figure === 'white-pawn' && y === 7 || figure === 'black-pawn' && y === 0) {
        openPromotionBox({ axisY, axisX, y, x });
        return;
      }

      const newPosition = arbiter.performMove({ position, figure, axisY, axisX, y, x });
      const newMove = getNewMoveNotation({ position, figure, axisY, axisX, y, x });
      playMove({ state: chessState, newPosition, newMove }).forEach(dispatch);
    }
    dispatch(clearCandidates());
  }

  const onDrop = e => {
    e.preventDefault();
    move(e);
  }

  const onDragOver = e => e.preventDefault();

  return (
    <div className="figures" onDrop={onDrop} onDragOver={onDragOver} ref={figuresRef}>
      {position.map((axixY, y) =>
        axixY.map((_axisX, x) =>
          position[y][x] ?
            <Figure
              key={y + '-' + x}
              axisY={y}
              axisX={x}
              figure={position[y][x]}
            />
            : null
        )
      )}
    </div>
  )
}

export default Figures;