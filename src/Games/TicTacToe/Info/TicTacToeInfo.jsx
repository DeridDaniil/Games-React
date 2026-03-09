function TicTacToeInfo() {
  return (
    <div>
      <p><strong>Tic Tac Toe</strong> — a classic strategy game.</p>
      <ul>
        <li>Players take turns placing X or O on the grid.</li>
        <li><strong>3×3:</strong> get 3 marks in a row to win.</li>
        <li><strong>5×5:</strong> get 4 marks in a row to win.</li>
        <li><strong>7×7:</strong> get 4 marks in a row to win.</li>
        <li>Rows, columns, and diagonals all count.</li>
        <li>If the board fills up with no winner — it's a draw.</li>
      </ul>
      <p><strong>Modes:</strong></p>
      <ul>
        <li><strong>vs Friend</strong> — two players take turns on the same device.</li>
        <li><strong>vs Computer</strong> — play against AI with 3 difficulty levels.</li>
      </ul>
      <p><strong>Controls:</strong> Click on an empty cell to place your mark. Open Settings to change board size, game mode, difficulty, and starting side.</p>
    </div>
  );
}

export default TicTacToeInfo;
