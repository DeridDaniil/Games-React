import { useRef } from 'react';
import { useChessContext } from '../../reducer/Context';
import { clearCandidates, makeNewMove } from '../../reducer/actions/move';
import Figure from '../Figure/Figure';
import arbiter from '../../arbiter/arbiter';
import './Figures.scss';
import { openPromotion } from '../../reducer/actions/popup';
import { getCastleDirection } from '../../arbiter/getMoves';
import { detectCheckmate, detectInsufficientMaterial, detectStalemate, updateCastling } from '../../reducer/actions/game';

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
    dispatch(openPromotion({ axisY: Number(axisY), axisX: Number(axisX), y, x }));
  }

  const updateCastlingState = ({ figure, axisY, axisX }) => {
    const direction = getCastleDirection({
      castleDirection: chessState.castleDirection,
      figure, axisY, axisX
    });

    if (direction) dispatch(updateCastling(direction));
  }

  const move = e => {
    const { y, x } = calculateCoord(e);
    const [figure, axisY, axisX] = e.dataTransfer.getData('text').split(', ');
    if (chessState.candidateMoves?.find(m => m[0] === y && m[1] === x)) {
      const opponent = figure.slice(0, 5) == 'white' ? 'black' : 'white';
      const castleDirection = chessState.castleDirection[opponent];

      if (figure === 'white-pawn' && y === 7 || figure === 'black-pawn' && y === 0) {
        openPromotionBox({ axisY, axisX, y, x });
        return;
      }

      if (figure.slice(6) === 'rook' || figure.slice(6) === 'king') {
        updateCastlingState({ figure, axisY, axisX });
      }

      const newPosition = arbiter.performMove({ position, figure, axisY, axisX, y, x });
      dispatch(makeNewMove({ newPosition }));

      if (arbiter.insufficientMaterial(newPosition)) dispatch(detectInsufficientMaterial());
      else if (arbiter.isStalemate(newPosition, opponent, castleDirection)) dispatch(detectStalemate());
      else if (arbiter.isCheckmate(newPosition, opponent, castleDirection)) dispatch(detectCheckmate(figure.slice(0, 5)));
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