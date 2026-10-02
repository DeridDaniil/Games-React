function ChessInfo() {
  return (
    <div>
      <p><strong>Chess</strong> for two players on one screen. White moves first.</p>
      <ul>
        <li>Drag a piece to one of its highlighted squares; only legal moves are highlighted.</li>
        <li>To castle, drag the king two squares towards the rook. En passant is supported.</li>
        <li>A pawn that reaches the last rank asks which piece it becomes.</li>
        <li>The game ends with checkmate, stalemate, insufficient material or when a clock runs out. There is no draw by repetition or by the 50-move rule.</li>
        <li>Each player has 5 minutes; the clock starts when White picks up a piece.</li>
      </ul>
      <p><strong>Take Back</strong> undoes the last move. <strong>Surrender</strong> starts a new game without recording a result.</p>
      <p>Moves are listed in simplified notation, without check or mate signs.</p>
    </div>
  );
}

export default ChessInfo;
