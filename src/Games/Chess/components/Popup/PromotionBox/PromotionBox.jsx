import { clearCandidates, makeNewMove } from '../../../reducer/actions/move';
import { useChessContext } from '../../../reducer/Context';
import { getNewMoveNotation } from '../../../data/helper';
import './PromotionBox.scss';

const PromotionBox = ({ onClosePopup }) => {
  const { chessState, dispatch } = useChessContext();
  const { promotionSquare, position } = chessState;
  if (!promotionSquare) return null;

  const options = ['queen', 'rook', 'bishop', 'knight'];
  const color = promotionSquare.y === 7 ? 'white' : 'black';

  const onClick = (option) => {
    onClosePopup();
    const newPosition = position[position.length - 1].map(axisY => axisY.map(axisX => axisX));

    newPosition[promotionSquare.axisY][promotionSquare.axisX] = '';
    newPosition[promotionSquare.y][promotionSquare.x] = color + '-' + option;

    dispatch(clearCandidates());
    const newMove = getNewMoveNotation({
      ...promotionSquare,
      figure: color + '-pawn',
      promotesTo: option === 'knight' ? color.slice(0, 1) + option.slice(0, 2) : color.slice(0, 1) + option.slice(0, 1),
      position: chessState.position[chessState.position.length - 1]
    });
    dispatch(makeNewMove({ newPosition, newMove }));
  }

  return (
    <div className="popup__inner promotion-choise">
      {options.map(option => (
        <div
          key={option}
          className={`figure ${color}-${option}`}
          onClick={() => onClick(option)}
        />
      ))}
    </div>
  )
}

export default PromotionBox;