import { useChessContext } from '../../../reducer/Context';
import './MovesList.scss'

const MovesList = () => {
  const { chessState: { movesList } } = useChessContext();

  return (
    <div className="moves-list">
      {movesList.map((move, i) => (
        <div key={i} data-number={Math.floor((i / 2) + 1)}>{move}</div>
      ))}
    </div>
  )
}

export default MovesList;