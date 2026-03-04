export const ActionTypes = {
  'NEW_MOVE': 'NEW_MOVE',
  'GENERATE_CANDIDATE_MOVES': 'GENERATE_CANDIDATE_MOVES',
  'CLEAR_CANDIDATE_MOVES': 'CLEAR_CANDIDATE_MOVES',
  'PROMOTION_OPEN': 'PROMOTION_OPEN',
  'PROMOTION_CLOSE': 'PROMOTION_CLOSE',
  'CAN_CASTLE': 'CAN_CASTLE',
  'START_CLOCK': 'START_CLOCK',
  'STALEMATE': 'STALEMATE',
  'INSUFFICIENT_MATERIAL': 'INSUFFICIENT_MATERIAL',
  'WIN': 'WIN',
  'NEW_GAME': 'NEW_GAME',
  'TAKE_BACK': 'TAKE_BACK',
  'TICK': 'TICK',
  'TIMEOUT': 'TIMEOUT'
};

export const Status = {
  'ongoing': 'Ongoing',
  'promoting': 'Promoting',
  'white': 'White wins',
  'black': 'Black wins',
  'stalemate': 'Game draws due to stalemate',
  'insufficient': 'Game draws due to insuffucient material',
  'whiteOnTime': 'White wins on time',
  'blackOnTime': 'Black wins on time'
};