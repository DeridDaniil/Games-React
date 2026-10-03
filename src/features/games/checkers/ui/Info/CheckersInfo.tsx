function CheckersInfo() {
  return (
    <div>
      <p><strong>Checkers</strong> for two players on one screen. White moves first.</p>
      <ul>
        <li>Drag a checker, or select it and choose a highlighted square. On a touch screen, tap the checker and then the square; during a capture series the same checker stays selected for the next jump. Checkers move diagonally forward on the dark squares.</li>
        <li>Capturing is mandatory: while a capture is possible, only the checkers that can capture (marked with a ring) can move.</li>
        <li>Checkers capture by jumping over an opposing piece, backwards as well as forwards. If the same checker can capture again, it must go on with the next jump in the same turn; the whole series counts as one move.</li>
        <li>A checker that reaches the far row becomes a queen, even in the middle of a series. Queens move any distance along a diagonal and land on the square right behind the piece they capture.</li>
        <li>You win by capturing all opposing pieces or leaving the opponent without a move, or when the opponent runs out of time or surrenders.</li>
      </ul>
      <p><strong>Take Back</strong> undoes the last whole turn, a capture series included. Each player has 5 minutes; the clock starts with the first move.</p>
    </div>
  );
}

export default CheckersInfo;
