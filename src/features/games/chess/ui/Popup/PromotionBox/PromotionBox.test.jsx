// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import PromotionBox from './PromotionBox';
import ChessContext from '../../../model/Context';
import arbiter from '../../../lib/arbiter/arbiter';
import { initChessGame } from '../../../model/constant';
import { ActionTypes, Status } from '../../../model/types';
import { boardWith, pieceAt } from '../../../../shared/test/boardTestUtils';

const renderPromotion = ({ position, promotionSquare, turn = 'white', status = Status.promoting }) => {
  const dispatch = vi.fn();
  const onClosePopup = vi.fn();
  const chessState = { ...initChessGame, position: [position], turn, status, promotionSquare };

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

  it('replaces the pawn with the chosen piece and records the move', () => {
    const { choose, types, payloadOf, onClosePopup } = renderPromotion(whitePromotion);

    choose('white-queen');

    expect(onClosePopup).toHaveBeenCalledTimes(1);
    expect(types()).toEqual([ActionTypes.CLEAR_CANDIDATE_MOVES, ActionTypes.NEW_MOVE]);
    const { newPosition, newMove } = payloadOf(ActionTypes.NEW_MOVE);
    expect(pieceAt(newPosition, 'a7')).toBe('');
    expect(pieceAt(newPosition, 'a8')).toBe('white-queen');
    expect(newMove).toBe('a8=Q');
  });

  it('writes each promotion piece with its own letter and no colour', () => {
    const black = { position: boardWith({ h2: 'black-pawn', e1: 'white-king', e8: 'black-king' }), promotionSquare: { axisY: 1, axisX: 7, y: 0, x: 7 }, turn: 'black' };
    const cases = [['white-rook', 'a8=R'], ['white-bishop', 'a8=B'], ['white-knight', 'a8=N']];

    cases.forEach(([figure, expected]) => {
      const { choose, payloadOf } = renderPromotion(whitePromotion);
      choose(figure);
      expect(payloadOf(ActionTypes.NEW_MOVE).newMove).toBe(expected);
      cleanup();
    });

    const { choose, payloadOf } = renderPromotion(black);
    choose('black-queen');
    expect(payloadOf(ActionTypes.NEW_MOVE).newMove).toBe('h1=Q');
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
    expect(newMove).toBe('bxa8=N');
  });

  it('ends the game when the promotion checkmates, like any other move', () => {
    const { choose, types, payloadOf } = renderPromotion({
      position: boardWith({ a7: 'white-pawn', g6: 'white-king', h8: 'black-king' }),
      promotionSquare: { axisY: 6, axisX: 0, y: 7, x: 0 }
    });

    choose('white-queen');

    const { newPosition } = payloadOf(ActionTypes.NEW_MOVE);
    expect(arbiter.isCheckmate(newPosition, 'black', 'none')).toBe(true);
    expect(types()).toEqual([ActionTypes.CLEAR_CANDIDATE_MOVES, ActionTypes.NEW_MOVE, ActionTypes.WIN]);
    expect(payloadOf(ActionTypes.WIN)).toBe('white');
  });

  it('ends the game in a draw when the promotion stalemates', () => {
    const { choose, types } = renderPromotion({
      position: boardWith({ g7: 'white-pawn', c1: 'white-king', a1: 'black-king' }),
      promotionSquare: { axisY: 6, axisX: 6, y: 7, x: 6 }
    });

    choose('white-queen');

    expect(types()).toEqual([ActionTypes.CLEAR_CANDIDATE_MOVES, ActionTypes.NEW_MOVE, ActionTypes.STALEMATE]);
  });

  it('ends the game in a draw when an under-promotion leaves insufficient material', () => {
    const { choose, types } = renderPromotion({
      position: boardWith({ c7: 'white-pawn', b6: 'white-king', a8: 'black-king' }),
      promotionSquare: { axisY: 6, axisX: 2, y: 7, x: 2 }
    });

    choose('white-knight');

    expect(types()).toEqual([ActionTypes.CLEAR_CANDIDATE_MOVES, ActionTypes.NEW_MOVE, ActionTypes.INSUFFICIENT_MATERIAL]);
  });

  it('shows nothing once the game is over, even with a promotion square left', () => {
    const { container } = renderPromotion({ ...whitePromotion, status: Status.blackOnTime });

    expect(container.querySelector('.promotion-choise')).toBeNull();
  });
});
