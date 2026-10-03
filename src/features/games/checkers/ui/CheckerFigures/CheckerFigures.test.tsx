// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createEvent, fireEvent, render } from '@testing-library/react';
import CheckerFigures from './CheckerFigures';
import CheckersContext from '../../model/Context';
import arbiter from '../../lib/arbiter/arbiter';
import { initCheckersGame } from '../../model/constant';
import { createPosition } from '../../lib/helper';
import { ActionTypes } from '../../model/types';
import type { CheckersAction, CheckersPosition, CheckersState } from '../../model/types';
import type { PlayerColor } from '../../../shared/model/types';
import { boardRect, boardWith, pieceAt, sq } from '../../../shared/test/boardTestUtils';
import { getElement } from '../../../../../shared/test/dom';
import type { Dispatch } from 'react';

const BOARD_PX = 800;
const CELL_PX = BOARD_PX / 8;

// The actions that carry a payload, and the one with the given type.
type PayloadAction = Extract<CheckersAction, { payload: unknown }>;
type PayloadActionOf<T extends PayloadAction['type']> = Extract<PayloadAction, { type: T }>;

interface PickUp {
  position: CheckersPosition;
  from: string;
  turn?: PlayerColor;
  clockStarted?: boolean;
}

// Renders the pieces layer as it looks right after `from` was picked up, then drops it on a square.
const pickUp = ({ position, from, turn = 'white', clockStarted = true }: PickUp) => {
  const [axisY, axisX] = sq(from);
  const checker = pieceAt(position, from);
  if (!checker) throw new Error(`No checker on ${from}`);
  const dispatch = vi.fn<Dispatch<CheckersAction>>();

  // Mirrors Checker.onDragStart: the engine provides the highlighted moves and attacked pieces.
  const checkersState: CheckersState = {
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

  const layer = getElement(container, '.checker-figures');
  layer.getBoundingClientRect = () => boardRect(BOARD_PX);

  // Returns whether the drop event was left uncancelled (fireEvent's return value). `data` replaces
  // the drag data of the picked-up checker, e.g. with text dragged in from elsewhere.
  const dropOn = (target: string, data = `${axisY}, ${axisX}, ${checker}`) => {
    const [y, x] = sq(target);
    const event = createEvent.drop(layer, { dataTransfer: { getData: () => data } });
    Object.defineProperty(event, 'clientX', { value: x * CELL_PX + CELL_PX / 2 });
    Object.defineProperty(event, 'clientY', { value: (7 - y) * CELL_PX + CELL_PX / 2 });
    return fireEvent(layer, event);
  };

  const actions = () => dispatch.mock.calls.map(([action]) => action);
  // Action order is incidental here, so compare the dispatched actions as a set.
  const types = () => actions().map(action => action.type).sort();
  const payloadOf = <T extends PayloadAction['type']>(type: T) => {
    const action = actions().find((a): a is PayloadActionOf<T> => a.type === type);
    if (!action) throw new Error(`Expected a ${type} action, got: ${types().join(', ') || 'none'}`);
    // TypeScript cannot tie `payload` back to T (a correlated union); the find above did.
    return action.payload as PayloadActionOf<T>['payload'];
  };

  return { dropOn, types, payloadOf };
};

const sorted = (...types: string[]) => [...types].sort();

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

  it.each<[PlayerColor, string, string, string]>([
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

  // Highlights stay after a drag that ended off the board; whatever is dropped next is checked
  // before it is read, and only clears the highlights when it is not a checker of the side to move.
  it.each([
    ['nothing', ''],
    ['arbitrary text', 'd4'],
    ['coordinates off the board', '9, 2, white-checker'],
    ['an unknown checker name', '2, 2, white-dragon'],
    ['a checker that is no longer on its square', '3, 3, white-checker'],
    ["a checker of the side that is not to move", '5, 1, black-checker']
  ])('ignores dropped drag data with %s without throwing', (_case, data) => {
    const { dropOn, types } = pickUp({ position: createPosition(), from: 'c3' });

    expect(() => dropOn('d4', data)).not.toThrow();

    expect(types()).toEqual([ActionTypes.CLEAR_CANDIDATE]);
  });
});
