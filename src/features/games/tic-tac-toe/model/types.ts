// Tic Tac Toe: the marks on the board and the settings a game is played with.

export type Mark = 'X' | 'O';
export type EmptyCell = ' ';
export type Cell = Mark | EmptyCell;

export type GameMode = 'friend' | 'computer';
export type Difficulty = 'easy' | 'medium' | 'unbeatable';
export type BoardSize = 3 | 5 | 7;

export interface TicTacToeSettings {
  mode: GameMode;
  difficulty: Difficulty;
  boardSize: BoardSize;
  // The side the player takes against the computer; X always moves first.
  playerSide: Mark;
}
