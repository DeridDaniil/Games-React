export const ActionTypes = {
  'NEW_MOVE': 'NEW_MOVE',
  'GENERATE_CANDIDATE_MOVES': 'GENERATE_CANDIDATE_MOVES',
  'CLEAR_CANDIDATE_MOVES': 'CLEAR_CANDIDATE_MOVES',
  'PROMOTION_OPEN': 'PROMOTION_OPEN',
  'PROMOTION_CLOSE': 'PROMOTION_CLOSE',
  'CAN_CASTLE': 'CAN_CASTLE',
  'STALEMATE': 'STALEMATE',
  'INSUFFICIENT_MATERIAL': 'INSUFFICIENT_MATERIAL',
  'WIN': 'WIN',
  'NEW_GAME': 'NEW_GAME',
  'TAKE_BACK': 'TAKE_BACK'
};

export const Status = {
  'ongoing': 'Ongoing',
  'promoting': 'Promoting',
  'white': 'White wins',
  'black': 'Black wins',
  'stalemate': 'Game draws due to stalemate',
  'insufficient': 'Game draws due to insuffucient material'
};