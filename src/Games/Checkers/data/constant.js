import { createPosition } from "./helper";

export const initCheckersGame = {
  position: [createPosition()],
  turn: 'white',
  candidateMoves: [],
  candidateAttack: []
}