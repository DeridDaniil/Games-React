export const ActionTypes = {
  'NEW_MOVE': 'NEW_MOVE',
  'GENERATE_CANDIDATE_MOVES': 'GENERATE_CANDIDATE_MOVES',
  'GENERATE_CANDIDATE_ATTACK': 'GENERATE_CANDIDATE_ATTACK',
  'CLEAR_CANDIDATE': 'CLEAR_CANDIDATE',
  'SET_FORCED_CAPTURES': 'SET_FORCED_CAPTURES',
  'CONTINUE_CAPTURE': 'CONTINUE_CAPTURE',
  'GAME_OVER': 'GAME_OVER',
  'NEW_GAME': 'NEW_GAME',
  'TAKE_BACK': 'TAKE_BACK',
  'START_CLOCK': 'START_CLOCK',
  'TICK': 'TICK',
  'TIMEOUT': 'TIMEOUT',
  'SURRENDER': 'SURRENDER'
}

export const Status = {
  ongoing: 'Ongoing',
  whiteWins: 'White wins',
  blackWins: 'Black wins',
  draw: 'Draw',
  whiteOnTime: 'White wins on time',
  blackOnTime: 'Black wins on time',
  whiteSurrender: 'White surrendered',
  blackSurrender: 'Black surrendered'
}