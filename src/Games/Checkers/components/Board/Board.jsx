import { useCheckersContext } from '../../reducer/Context';
import './Board.scss';

function Board() {
  const axisY = Array(8).fill(' ').map((_y, i) => 8 - i);
  const axisX = Array(8).fill(' ').map((_x, i) => i + 1)

  const { checkersState } = useCheckersContext();
  const position = checkersState.position[checkersState.position.length - 1];

  const getClassName = (y, x) => {
    let style = 'cell';
    style += (y + x) % 2 === 0 ? ' black' : ' white';

    if (checkersState.candidateMoves?.find(m => m[0] === y && m[1] === x)) {
      if (position[y][x]) style += ' attacking';
      else style += ' highlight';
    }

    return style;
  }

  return (
    <div className="checkersBoard">
      <div className="ranks">
        {axisY.map(y => (
          <span key={y} className={y % 2 === 0 ? 'black' : 'white'}>{y}</span>
        ))}
      </div>
      <div className="cells">
        {axisY.map((_y, y) =>
          axisX.map((_x, x) =>
            <div key={y + '-' + x} className={getClassName(7 - y, x)}></div>
          ))}
      </div>
      <div className="files">
        {axisX.map(x => (
          <span key={x} className={x % 2 === 0 ? 'white' : 'black'}>{String.fromCharCode(x + 96)}</span>
        ))}
      </div>
    </div>
  )
}

export default Board;