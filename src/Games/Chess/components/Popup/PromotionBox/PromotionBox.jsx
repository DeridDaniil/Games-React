import { clearCandidates, makeNewMove } from '../../../reducer/actions/move';
import { useChessContext } from '../../../reducer/Context';
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
    dispatch(makeNewMove({ newPosition }));
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