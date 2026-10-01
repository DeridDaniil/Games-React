// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createEvent, fireEvent, render } from '@testing-library/react';
import CheckerFigures from './CheckerFigures';
import CheckersContext from '../../model/Context';
import arbiter from '../../lib/arbiter/arbiter';
import { initCheckersGame } from '../../model/constant';
import { createPosition } from '../../lib/helper';
import { ActionTypes } from '../../model/types';
import { boardWith, pieceAt, sq } from '../../../shared/test/boardTestUtils';

const BOARD_PX = 800;
const CELL_PX = BOARD_PX / 8;

// Renders the pieces layer as it looks right after `from` was picked up, then drops it on a square.
const pickUp = ({ position, from, turn = 'white', clockStarted = true }) => {
  const [axisY, axisX] = sq(from);
  const checker = pieceAt(position, from);
  const dispatch = vi.fn();

  // Mirrors Checker.onDragStart: the engine provides the highlighted moves and attacked pieces.
  const checkersState = {
    ...initCheckersGame,
    position: [position],
    turn,
    clockStarted,
    candidateMoves: arbiter.getRegularMoves({ position, checker, axisY, axisX }),
    candidateAttack: arbiter.getAttackingMoves({ position, checker, axisY, axisX })
  };

  const { container } = render(
    <CheckersContext.Provider value={{ checkersState, dispatch }}>
      <CheckerFigures />
    </CheckersContext.Provider>
  );

  const layer = container.querySelector('.checker-figures');
  layer.getBoundingClientRect = () => ({ width: BOARD_PX, height: BOARD_PX, top: 0, left: 0, right: BOARD_PX, bottom: BOARD_PX });

  // Returns whether the drop event was left uncancelled (fireEvent's return value).
  const dropOn = (target) => {
    const [y, x] = sq(target);
    const event = createEvent.drop(layer, { dataTransfer: { getData: () => `${axisY}, ${axisX}, ${checker}` } });
    Object.defineProperty(event, 'clientX', { value: x * CELL_PX + CELL_PX / 2 });
    Object.defineProperty(event, 'clientY', { value: (7 - y) * CELL_PX + CELL_PX / 2 });
    return fireEvent(layer, event);
  };

  const actions = () => dispatch.mock.calls.map(([action]) => action);
  // Action order is incidental here, so compare the dispatched actions as a set.
  const types = () => actions().map(action => action.type).sort();
  const payloadOf = (type) => {
    const action = actions().find(a => a.type === type);
    if (!action) throw new Error(`Expected a ${type} action, got: ${types().join(', ') || 'none'}`);
    return action.payload;
  };

  return { dropOn, types, payloadOf };
};

const sorted = (...types) => [...types].sort();

describe('CheckerFigures drop handling', () => {
  it('moves a checker diagonally and starts the clock on the first move', () => {
    const { dropOn, types, payloadOf } = pickUp({ position: createPosition(), from: 'c3', clockStarted: false });

    expect(dropOn('d4')).toBe(false);

    expect(types()).toEqual(sorted(ActionTypes.START_CLOCK, ActionTypes.NEW_MOVE, ActionTypes.CLEAR_CANDIDATE));
    const { newPosition, newMove } = payloadOf(ActionTypes.NEW_MOVE);
    expect(newMove).toBe('c3-d4');
    expect(pieceAt(newPosition, 'c3')).toBe('');
    expect(pieceAt(newPosition, 'd4')).toBe('white-checker');
  });

  it.each([
    ['white', 'e5', 'f6', 'g7'],
    ['white', 'e5', 'd6', 'c7'],
    ['white', 'e5', 'f4', 'g3'],
    ['white', 'e5', 'd4', 'c3'],
    ['black', 'd4', 'c3', 'b2'],
    ['black', 'd4', 'e3', 'f2'],
    ['black', 'd4', 'c5', 'b6'],
    ['black', 'd4', 'e5', 'f6']
  ])('a %s checker on %s captures %s and lands on %s', (colour, from, captured, landing) => {
    const enemy = colour === 'white' ? 'black' : 'white';
    const position = boardWith({ [from]: `${colour}-checker`, [captured]: `${enemy}-checker`, a1: `${enemy}-checker` });
    const { dropOn, types, payloadOf } = pickUp({ position, from, turn: colour });

    dropOn(landing);

    expect(types()).toEqual(sorted(ActionTypes.NEW_MOVE, ActionTypes.CLEAR_CANDIDATE));
    const { newPosition, newMove } = payloadOf(ActionTypes.NEW_MOVE);
    expect(newMove).toBe(`${from}x${landing}`);
    expect(pieceAt(newPosition, from)).toBe('');
    expect(pieceAt(newPosition, captured)).toBe('');
    expect(pieceAt(newPosition, landing)).toBe(`${colour}-checker`);
    expect(pieceAt(newPosition, 'a1')).toBe(`${enemy}-checker`);
  });

  it('removes the piece a queen captures from a distance', () => {
    const position = boardWith({ a1: 'white-queen', d4: 'black-checker', h8: 'black-checker' });
    const { dropOn, payloadOf } = pickUp({ position, from: 'a1' });

    dropOn('e5');

    const { newPosition, newMove } = payloadOf(ActionTypes.NEW_MOVE);
    expect(newMove).toBe('a1xe5');
    expect(pieceAt(newPosition, 'd4')).toBe('');
    expect(pieceAt(newPosition, 'e5')).toBe('white-queen');
  });

  it('keeps the turn with the capturing checker when another capture follows', () => {
    const position = boardWith({ c3: 'white-checker', d4: 'black-checker', f6: 'black-checker' });
    const { dropOn, types, payloadOf } = pickUp({ position, from: 'c3' });

    dropOn('e5');

    expect(types()).toEqual(sorted(ActionTypes.CONTINUE_CAPTURE, ActionTypes.CLEAR_CANDIDATE));
    const { newPosition, chainCapturePiece, newMove } = payloadOf(ActionTypes.CONTINUE_CAPTURE);
    expect(chainCapturePiece).toEqual(sq('e5'));
    expect(newMove).toBe('c3xe5');
    expect(pieceAt(newPosition, 'd4')).toBe('');
    expect(pieceAt(newPosition, 'f6')).toBe('black-checker');
  });

  it('promotes a white checker that reaches the last row', () => {
    const position = boardWith({ f7: 'white-checker', a1: 'black-checker' });
    const { dropOn, payloadOf } = pickUp({ position, from: 'f7' });

    dropOn('g8');

    const { newPosition, newMove } = payloadOf(ActionTypes.NEW_MOVE);
    expect(newMove).toBe('f7-g8');
    expect(pieceAt(newPosition, 'g8')).toBe('white-queen');
    expect(pieceAt(newPosition, 'f7')).toBe('');
  });

  it('promotes a black checker that reaches row 1', () => {
    const position = boardWith({ c2: 'black-checker', h8: 'white-checker' });
    const { dropOn, payloadOf } = pickUp({ position, from: 'c2', turn: 'black' });

    dropOn('b1');

    expect(pieceAt(payloadOf(ActionTypes.NEW_MOVE).newPosition, 'b1')).toBe('black-queen');
  });

  it('promotes in the middle of a capture and keeps capturing as a queen', () => {
    // After d6xf8 the new queen can take c5 along the long diagonal; a plain checker could not.
    const position = boardWith({ d6: 'white-checker', e7: 'black-checker', c5: 'black-checker' });
    const { dropOn, types, payloadOf } = pickUp({ position, from: 'd6' });

    dropOn('f8');

    expect(types()).toEqual(sorted(ActionTypes.CONTINUE_CAPTURE, ActionTypes.CLEAR_CANDIDATE));
    const { newPosition, chainCapturePiece } = payloadOf(ActionTypes.CONTINUE_CAPTURE);
    expect(pieceAt(newPosition, 'f8')).toBe('white-queen');
    expect(pieceAt(newPosition, 'e7')).toBe('');
    expect(pieceAt(newPosition, 'c5')).toBe('black-checker');
    expect(chainCapturePiece).toEqual(sq('f8'));
  });

  it('ignores a drop outside the highlighted squares', () => {
    const { dropOn, types } = pickUp({ position: createPosition(), from: 'c3' });

    expect(dropOn('e5')).toBe(false);

    expect(types()).toEqual([ActionTypes.CLEAR_CANDIDATE]);
  });
});
