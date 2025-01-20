import './Board.scss';

function Board() {
  const axisY = Array(8).fill(' ').map((_y, i) => i + 1);
  const axisX = Array(8).fill(' ').map((_x, i) => i + 1);

  const getClassName = (y, x) => {
    let style = 'cell';
    style += (y + x) % 2 === 0 ? ' white' : ' black';
    return style;
  }

  return (
    <div className="board">
      <div className="ranks">
        {axisY.map(y => (
          <span key={y} className={y % 2 === 0 ? 'white' : 'black'}>{y}</span>
        ))}
      </div>
      <div className="cells">
        {axisY.map((_y, y) =>
          axisX.map((_x, x) =>
            <div key={y + '-' + x} className={getClassName(y, x)}></div>
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