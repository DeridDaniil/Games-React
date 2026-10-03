function ChessInfo() {
  return (
    <div>
      <p><strong>Chess</strong> for two players on one screen. White moves first.</p>
      <ul>
        <li>Drag a piece, or select it and choose a highlighted square; only legal moves are highlighted. On a touch screen, tap the piece and then the square. Select the piece again to put it down.</li>
        <li>To castle, move the king two squares towards the rook. En passant is supported.</li>
        <li>A pawn that reaches the last rank asks which piece it becomes.</li>
        <li>The game ends with checkmate, stalemate, insufficient material, a surrender or when a clock runs out. There is no draw by repetition or by the 50-move rule.</li>
        <li>Each player has 5 minutes; the clock starts when White picks up a piece.</li>
      </ul>
      <p><strong>Take Back</strong> undoes the last move. <strong>Surrender</strong> ends the game: the side to move loses.</p>
      <p>Your profile counts each game from White’s side: a White win is your win.</p>
      <p>Moves are listed in simplified notation, without check or mate signs.</p>
    </div>
  );
}

export default ChessInfo;
