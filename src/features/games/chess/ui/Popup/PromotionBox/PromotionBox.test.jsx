// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import PromotionBox from './PromotionBox';
import ChessContext from '../../../model/Context';
import arbiter from '../../../lib/arbiter/arbiter';
import { initChessGame } from '../../../model/constant';
import { ActionTypes, Status } from '../../../model/types';
import { boardWith, pieceAt } from '../../../../shared/test/boardTestUtils';

const renderPromotion = ({ position, promotionSquare }) => {
  const dispatch = vi.fn();
  const onClosePopup = vi.fn();
  const chessState = { ...initChessGame, position: [position], status: Status.promoting, promotionSquare };

  const { container } = render(
    <ChessContext.Provider value={{ chessState, dispatch }}>
      <PromotionBox onClosePopup={onClosePopup} />
    </ChessContext.Provider>
  );

  const choose = (figure) => fireEvent.click(container.querySelector(`.${figure}`));
  const actions = () => dispatch.mock.calls.map(([action]) => action);
  const types = () => actions().map(action => action.type);
  const payloadOf = (type) => {
    const action = actions().find(a => a.type === type);
    if (!action) throw new Error(`Expected a ${type} action, got: ${types().join(', ') || 'none'}`);
    return action.payload;
  };

  return { container, choose, types, payloadOf, onClosePopup };
};

describe('PromotionBox', () => {
  const whitePromotion = {
    position: boardWith({ a7: 'white-pawn', e1: 'white-king', e8: 'black-king' }),
    promotionSquare: { axisY: 6, axisX: 0, y: 7, x: 0 }
  };

  it('offers queen, rook, bishop and knight in the colour of the promoting pawn', () => {
    const white = renderPromotion(whitePromotion);
    ['white-queen', 'white-rook', 'white-bishop', 'white-knight']
      .forEach(figure => expect(white.container.querySelector(`.${figure}`)).not.toBeNull());
    cleanup();

    const black = renderPromotion({
      position: boardWith({ h2: 'black-pawn', e1: 'white-king', e8: 'black-king' }),
      promotionSquare: { axisY: 1, axisX: 7, y: 0, x: 7 }
    });
    ['black-queen', 'black-rook', 'black-bishop', 'black-knight']
      .forEach(figure => expect(black.container.querySelector(`.${figure}`)).not.toBeNull());
  });

  // KNOWN QUIRK (not changed in this stage): the promotion suffix is colour initial + piece
  // letter(s) ("=WQ", "=WKN") instead of standard notation ("=Q", "=N"); it is shown in the moves list.
  it('replaces the pawn with the chosen piece and records the move', () => {
    const { choose, types, payloadOf, onClosePopup } = renderPromotion(whitePromotion);

    choose('white-queen');

    expect(onClosePopup).toHaveBeenCalledTimes(1);
    expect(types()).toEqual([ActionTypes.CLEAR_CANDIDATE_MOVES, ActionTypes.NEW_MOVE]);
    const { newPosition, newMove } = payloadOf(ActionTypes.NEW_MOVE);
    expect(pieceAt(newPosition, 'a7')).toBe('');
    expect(pieceAt(newPosition, 'a8')).toBe('white-queen');
    expect(newMove).toBe('a8=WQ');
  });

  it('supports under-promotion with a capture', () => {
    const { choose, payloadOf } = renderPromotion({
      position: boardWith({ b7: 'white-pawn', a8: 'black-rook', e1: 'white-king', e8: 'black-king' }),
      promotionSquare: { axisY: 6, axisX: 1, y: 7, x: 0 }
    });

    choose('white-knight');

    const { newPosition, newMove } = payloadOf(ActionTypes.NEW_MOVE);
    expect(pieceAt(newPosition, 'a8')).toBe('white-knight');
    expect(pieceAt(newPosition, 'b7')).toBe('');
    expect(newMove).toBe('bxa8=WKN');
  });

  // KNOWN BUG (not fixed in this stage): game-over detection only runs in Figures.jsx,
  // so a promotion that checkmates, stalemates or leaves insufficient material is not detected.
  it('does not check for game over after promoting (current behaviour, known bug)', () => {
    const { choose, types, payloadOf } = renderPromotion({
      position: boardWith({ a7: 'white-pawn', g6: 'white-king', h8: 'black-king' }),
      promotionSquare: { axisY: 6, axisX: 0, y: 7, x: 0 }
    });

    choose('white-queen');

    const { newPosition } = payloadOf(ActionTypes.NEW_MOVE);
    expect(arbiter.isCheckmate(newPosition, 'black', 'none')).toBe(true);
    expect(types()).not.toContain(ActionTypes.WIN);
    expect(types()).not.toContain(ActionTypes.STALEMATE);
    expect(types()).not.toContain(ActionTypes.INSUFFICIENT_MATERIAL);
  });
});
