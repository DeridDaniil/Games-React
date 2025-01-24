import { createPosition } from "./helper";

export const initChessGame = {
  position: [createPosition()],
  turn: 'white',
  candidateMoves: []
};