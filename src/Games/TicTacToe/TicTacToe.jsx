import { useState, useEffect } from 'react';
import './TicTacToe.scss';

function TicTacToe() {
  const [cells, setCells] = useState(Array(9).fill(' '));
  const [step, setStep] = useState(0);
  const player = step % 2 === 0 ? 'X' : 'O';
  const [isgameEnd, setIsGameEnd] = useState(false);
  const [gameEnd, setGameEnd] = useState('');
  const winnerCombination = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];

  useEffect(() => {
    gameEnding();
  }, [cells]);

  const gameEnding = () => {
    if (!cells.some(cell => cell === ' ')) {
      setIsGameEnd(true);
      setGameEnd('Ничья')
    };
    winnerCombination.forEach(combo => {
      if (cells[combo[0]] === cells[combo[1]] && cells[combo[1]] === cells[combo[2]] && cells[combo[0]] !== ' ') {
        setIsGameEnd(true);
        setGameEnd(`Победитель - ${cells[combo[0]]}`);
      }
    });
  }

  const getStep = (cellIndex) => {
    let newCells = cells.map(cell => cell);
    if (newCells[cellIndex] !== ' ') return;
    newCells[cellIndex] = player;
    setStep(step + 1);
    setCells(newCells);
  }

  const restartGame = () => {
    setCells(Array(9).fill(' '));
    setStep(0);
    setIsGameEnd(false);
  }

  return (
    <div id='tictactoe' className="tictactoe">
      <h1>Крестики нолики</h1>
      <div className="container">
        <h2>{isgameEnd ? 'Конец игры' : `Ход игрока - ${player}`}</h2>
        <div className="cells">
          {cells.map((value, i) => (
            <div
              key={i}
              className="cell"
              onClick={() => getStep(i)}
            >{value}
            </div>
          ))}
          {isgameEnd && (
            <div className="gameEnd">{gameEnd}</div>
          )}
        </div>
        <button onClick={restartGame}>Заново</button>
      </div>
    </div>
  )
};

export default TicTacToe;