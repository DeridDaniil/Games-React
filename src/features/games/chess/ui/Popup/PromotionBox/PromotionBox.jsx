import { clearCandidates, playMove } from '../../../model/actions/move';
import { useChessContext } from '../../../model/Context';
import { Status } from '../../../model/types';
import { getNewMoveNotation } from '../../../lib/helper';
import './PromotionBox.scss';

// The choice of the piece a pawn becomes; it finishes the move like any other (see playMove).
const PromotionBox = ({ onClosePopup }) => {
  const { chessState, dispatch } = useChessContext();
  const { promotionSquare, position, status } = chessState;
  if (!promotionSquare || status !== Status.promoting) return null;

  const options = ['queen', 'rook', 'bishop', 'knight'];
  const color = promotionSquare.y === 7 ? 'white' : 'black';

  const onClick = (option) => {
    onClosePopup();
    const currentPosition = position[position.length - 1];
    const newPosition = currentPosition.map(axisY => axisY.map(axisX => axisX));

    newPosition[promotionSquare.axisY][promotionSquare.axisX] = '';
    newPosition[promotionSquare.y][promotionSquare.x] = color + '-' + option;

    dispatch(clearCandidates());
    const newMove = getNewMoveNotation({
      ...promotionSquare,
      figure: color + '-pawn',
      promotesTo: option,
      position: currentPosition
    });
    playMove({ state: chessState, newPosition, newMove }).forEach(dispatch);
  }

  return (
    <div className="popup__inner promotion-choise" role="group" aria-label="Promote the pawn">
      {options.map(option => (
        <button
          key={option}
          type="button"
          className={`figure ${color}-${option}`}
          aria-label={`Promote to ${option}`}
          onClick={() => onClick(option)}
        />
      ))}
    </div>
  )
}

export default PromotionBox;