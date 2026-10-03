function TicTacToeInfo() {
  return (
    <div>
      <p><strong>Tic Tac Toe</strong>: players take turns placing X and O; X always moves first.</p>
      <ul>
        <li><strong>3×3:</strong> get 3 marks in a row to win.</li>
        <li><strong>5×5:</strong> get 4 marks in a row to win.</li>
        <li><strong>7×7:</strong> get 4 marks in a row to win.</li>
        <li>Rows, columns and diagonals all count. A full board without a line is a draw.</li>
      </ul>
      <p><strong>Modes:</strong></p>
      <ul>
        <li><strong>vs Friend</strong>: two players take turns on the same device.</li>
        <li><strong>vs Computer</strong>: choose your side and a difficulty. Easy plays random moves. Medium takes a win when it has one and blocks yours, otherwise it plays at random. Unbeatable searches every possible game on 3×3, so it never loses there. On 5×5 and 7×7 it looks four marks ahead, always taking a win and blocking yours: the strongest play it can find, but it can be beaten.</li>
      </ul>
      <p><strong>Controls:</strong> click a cell, or move between cells with the arrow keys and press Enter or Space to place your mark. Settings change the mode, the board size and, against the computer, the difficulty and your side; choosing a different option starts a new game.</p>
    </div>
  );
}

export default TicTacToeInfo;
