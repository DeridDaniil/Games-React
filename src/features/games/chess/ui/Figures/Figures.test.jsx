// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createEvent, fireEvent, render } from '@testing-library/react';
import Figures from './Figures';
import ChessContext from '../../model/Context';
import arbiter from '../../lib/arbiter/arbiter';
import { initChessGame } from '../../model/constant';
import { createPosition } from '../../lib/helper';
import { ActionTypes } from '../../model/types';
import { at, boardWith, pieceAt, sq } from '../../../shared/test/boardTestUtils';

const BOARD_PX = 800;
const CELL_PX = BOARD_PX / 8;
const fullCastling = { white: 'both', black: 'both' };

const play = (position, moves) => moves.reduce((current, [from, target]) => {
  const [y, x] = sq(target);
  return arbiter.performMove({ position: current, figure: pieceAt(current, from), ...at(from), y, x });
}, position);

// Renders the pieces layer as it looks right after `from` was picked up, then drops it on a square.
const pickUp = ({ position, from, turn = 'white', castleDirection = fullCastling }) => {
  const [axisY, axisX] = sq(from);
  const figure = pieceAt(position, from);
  const dispatch = vi.fn();

  // Mirrors Figure.onDragStart: the engine provides the highlighted legal moves.
  const chessState = {
    ...initChessGame,
    position: [position],
    turn,
    castleDirection,
    candidateMoves: arbiter.getValidMoves({ position, castleDirection: castleDirection[turn], figure, axisY, axisX })
  };

  const { container } = render(
    <ChessContext.Provider value={{ chessState, dispatch }}>
      <Figures />
    </ChessContext.Provider>
  );

  const layer = container.querySelector('.figures');
  layer.getBoundingClientRect = () => ({ width: BOARD_PX, height: BOARD_PX, top: 0, left: 0, right: BOARD_PX, bottom: BOARD_PX });

  // Returns whether the drop event was left uncancelled (fireEvent's return value).
  const dropOn = (target) => {
    const [y, x] = sq(target);
    const event = createEvent.drop(layer, { dataTransfer: { getData: () => `${figure}, ${axisY}, ${axisX}` } });
    Object.defineProperty(event, 'clientX', { value: x * CELL_PX + CELL_PX / 2 });
    Object.defineProperty(event, 'clientY', { value: (7 - y) * CELL_PX + CELL_PX / 2 });
    return fireEvent(layer, event);
  };

  const actions = () => dispatch.mock.calls.map(([action]) => action);
  const orderedTypes = () => actions().map(action => action.type);
  // Most action order is incidental, so compare the dispatched actions as a set.
  const types = () => [...orderedTypes()].sort();
  const payloadOf = (type) => {
    const action = actions().find(a => a.type === type);
    if (!action) throw new Error(`Expected a ${type} action, got: ${types().join(', ') || 'none'}`);
    return action.payload;
  };

  return { dropOn, types, orderedTypes, payloadOf };
};

const sorted = (...types) => [...types].sort();

describe('Chess Figures drop handling', () => {
  it('records a normal move with its notation', () => {
    const { dropOn, types, payloadOf } = pickUp({ position: createPosition(), from: 'e2' });

    expect(dropOn('e4')).toBe(false);

    expect(types()).toEqual(sorted(ActionTypes.NEW_MOVE, ActionTypes.CLEAR_CANDIDATE_MOVES));
    const { newPosition, newMove } = payloadOf(ActionTypes.NEW_MOVE);
    expect(newMove).toBe('e4');
    expect(pieceAt(newPosition, 'e4')).toBe('white-pawn');
    expect(pieceAt(newPosition, 'e2')).toBe('');
  });

  it('opens the promotion choice instead of moving when a pawn reaches the last rank', () => {
    const position = boardWith({ a7: 'white-pawn', e1: 'white-king', h8: 'black-king' });
    const { dropOn, types, payloadOf } = pickUp({ position, from: 'a7' });

    dropOn('a8');

    expect(types()).toEqual([ActionTypes.PROMOTION_OPEN]);
    expect(payloadOf(ActionTypes.PROMOTION_OPEN)).toEqual({ axisY: 6, axisX: 0, y: 7, x: 0 });
  });

  it('opens the promotion choice for a black pawn reaching rank 1', () => {
    const position = boardWith({ h2: 'black-pawn', e1: 'white-king', e8: 'black-king' });
    const { dropOn, payloadOf } = pickUp({ position, from: 'h2', turn: 'black' });

    dropOn('h1');

    expect(payloadOf(ActionTypes.PROMOTION_OPEN)).toEqual({ axisY: 1, axisX: 7, y: 0, x: 7 });
  });

  it('updates castling rights before recording a rook move', () => {
    const position = boardWith({ e1: 'white-king', a1: 'white-rook', h1: 'white-rook', e8: 'black-king' });
    const { dropOn, types, orderedTypes, payloadOf } = pickUp({ position, from: 'h1' });

    dropOn('g1');

    expect(types()).toEqual(sorted(ActionTypes.CAN_CASTLE, ActionTypes.NEW_MOVE, ActionTypes.CLEAR_CANDIDATE_MOVES));
    // The reducer applies CAN_CASTLE to `state.turn`, so it must run while the mover is still to move.
    expect(orderedTypes().indexOf(ActionTypes.CAN_CASTLE)).toBeLessThan(orderedTypes().indexOf(ActionTypes.NEW_MOVE));
    expect(payloadOf(ActionTypes.CAN_CASTLE)).toBe('left');
  });

  it('moves the rook as well when the king castles', () => {
    const position = boardWith({ e1: 'white-king', a1: 'white-rook', h1: 'white-rook', e8: 'black-king' });
    const { dropOn, payloadOf } = pickUp({ position, from: 'e1' });

    dropOn('g1');

    expect(payloadOf(ActionTypes.CAN_CASTLE)).toBe('none');
    const { newPosition } = payloadOf(ActionTypes.NEW_MOVE);
    expect(pieceAt(newPosition, 'g1')).toBe('white-king');
    expect(pieceAt(newPosition, 'f1')).toBe('white-rook');
  });

  it('declares the mover the winner after a checkmating move', () => {
    const position = play(createPosition(), [['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4']]);
    const { dropOn, types, payloadOf } = pickUp({ position, from: 'd8', turn: 'black' });

    dropOn('h4');

    expect(types()).toEqual(sorted(ActionTypes.NEW_MOVE, ActionTypes.WIN, ActionTypes.CLEAR_CANDIDATE_MOVES));
    expect(payloadOf(ActionTypes.NEW_MOVE).newMove).toBe('Qh4');
    expect(payloadOf(ActionTypes.WIN)).toBe('black');
  });

  it('detects a stalemate after the move', () => {
    const position = boardWith({ a8: 'black-king', b1: 'white-queen', h1: 'white-king' });
    const { dropOn, types } = pickUp({ position, from: 'b1' });

    dropOn('b6');

    expect(types()).toEqual(sorted(ActionTypes.NEW_MOVE, ActionTypes.STALEMATE, ActionTypes.CLEAR_CANDIDATE_MOVES));
  });

  it('detects insufficient material after the last piece is captured', () => {
    const position = boardWith({ e1: 'white-king', e2: 'black-knight', e8: 'black-king' });
    const { dropOn, types } = pickUp({ position, from: 'e1' });

    dropOn('e2');

    expect(types()).toEqual(sorted(
      ActionTypes.CAN_CASTLE,
      ActionTypes.NEW_MOVE,
      ActionTypes.INSUFFICIENT_MATERIAL,
      ActionTypes.CLEAR_CANDIDATE_MOVES
    ));
  });

  it('ignores a drop outside the highlighted squares', () => {
    const { dropOn, types } = pickUp({ position: createPosition(), from: 'e2' });

    expect(dropOn('e5')).toBe(false);

    expect(types()).toEqual([ActionTypes.CLEAR_CANDIDATE_MOVES]);
  });
});
