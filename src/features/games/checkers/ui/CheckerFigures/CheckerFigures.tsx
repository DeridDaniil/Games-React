import type { DragEvent } from 'react';
import Checker from '../Checker/Checker';
import { useCheckersContext } from '../../model/Context';
import { clearCandidates, makeNewMove, continueCapture, startClock } from '../../model/actions/move';
import arbiter from '../../lib/arbiter/arbiter';
import { colorOf, readDraggedChecker } from '../../lib/helper';
import type { CheckerPiece } from '../../model/types';
import './CheckerFigures.scss';

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

const getMoveNotation = (fromY: number, fromX: number, toY: number, toX: number, isCapture: boolean) => {
  const from = files[fromX] + (fromY + 1);
  const to = files[toX] + (toY + 1);
  return isCapture ? `${from}x${to}` : `${from}-${to}`;
};

function CheckerFigures() {
  const { checkersState, dispatch } = useCheckersContext();
  const position = checkersState.position[checkersState.position.length - 1];

  // The square under the pointer; the drop handler sits on the pieces layer, which covers the board.
  const calculateCoords = (e: DragEvent<HTMLDivElement>) => {
    const { width, top, left } = e.currentTarget.getBoundingClientRect();
    const size = width / 8;
    const y = 7 - Math.floor((e.clientY - top) / size);
    const x = Math.floor((e.clientX - left) / size);
    return { y, x };
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Highlights can outlive a drag that ended off the board, so whatever is dropped must name a
    // checker of the side to move that still stands on its square before anything is read from it.
    const dragged = readDraggedChecker(e.dataTransfer.getData('text'), position, checkersState.turn);
    if (!dragged) {
      dispatch(clearCandidates());
      return;
    }

    const { axisY, axisX, checker } = dragged;
    const newPosition = position.map(axisY => axisY.map(axisX => axisX));
    const { y, x } = calculateCoords(e);
    const player = colorOf(checker);

    if (checkersState.candidateMoves?.find(m => m[0] === y && m[1] === x)) {
      newPosition[axisY][axisX] = '';
      let landedPiece: CheckerPiece = checker;
      if ((player === 'white' && y === 7) || (player === 'black' && y === 0)) {
        landedPiece = `${player}-queen`;
      }
      newPosition[y][x] = landedPiece;

      let wasCapture = false;
      if (checkersState.candidateAttack && checkersState.candidateAttack.length > 0) {
        const direction = [[1, -1], [1, 1], [-1, 1], [-1, -1]];
        checkersState.candidateAttack.forEach(candidate => {
          direction.forEach(dir => {
            if (y + dir[0] === candidate[0] && x + dir[1] === candidate[1]) {
              newPosition[candidate[0]][candidate[1]] = '';
              wasCapture = true;
            }
          })
        });
      }

      const newMove = getMoveNotation(axisY, axisX, y, x, wasCapture);

      if (!checkersState.clockStarted) {
        dispatch(startClock());
      }

      if (wasCapture) {
        const furtherAttacks = arbiter.getAttackingMoves({ position: newPosition, checker: landedPiece, axisY: y, axisX: x });
        if (furtherAttacks.length > 0) {
          dispatch(continueCapture({ newPosition, chainCapturePiece: [y, x], newMove }));
          dispatch(clearCandidates());
          return;
        }
      }

      dispatch(makeNewMove({ newPosition, newMove }));
    }
    dispatch(clearCandidates());
  }

  const onDragOver = (e: DragEvent<HTMLDivElement>) => e.preventDefault();

  return (
    <div className="checker-figures" onDrop={onDrop} onDragOver={onDragOver}>
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
