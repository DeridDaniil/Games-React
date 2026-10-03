import { describe, expect, it } from 'vitest';
import { areSameColorTiles, createPosition, findFiguresCoords, getNewMoveNotation } from './helper';
import { boardWith, pieceAt, sq } from '../../shared/test/boardTestUtils';
import type { ChessPiece, ChessPosition, PromotionPiece } from '../model/types';

interface NotationCase {
  position: ChessPosition;
  figure: ChessPiece;
  from: string;
  to: string;
  promotesTo?: PromotionPiece;
}

const notation = ({ position, figure, from, to, promotesTo }: NotationCase) => {
  const [axisY, axisX] = sq(from);
  const [y, x] = sq(to);
  return getNewMoveNotation({ position, figure, axisY, axisX, y, x, promotesTo });
};

describe('createPosition', () => {
  it('sets up the standard initial position', () => {
    const position = createPosition();
    const backRank = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

    expect(position[0]).toEqual(backRank.map(piece => `white-${piece}`));
    expect(position[1]).toEqual(Array(8).fill('white-pawn'));
    expect(position[6]).toEqual(Array(8).fill('black-pawn'));
    expect(position[7]).toEqual(backRank.map(piece => `black-${piece}`));
    position.slice(2, 6).forEach(rank => expect(rank).toEqual(Array(8).fill('')));
  });

  it('puts the queens on their own colour and the kings on the e-file', () => {
    const position = createPosition();
    expect(pieceAt(position, 'd1')).toBe('white-queen');
    expect(pieceAt(position, 'd8')).toBe('black-queen');
    expect(pieceAt(position, 'e1')).toBe('white-king');
    expect(pieceAt(position, 'e8')).toBe('black-king');
  });

  it('returns an independent board on every call', () => {
    const first = createPosition();
    const second = createPosition();

    first[0][0] = '';

    expect(second[0][0]).toBe('white-rook');
    expect(first[2]).not.toBe(first[3]);
  });
});

describe('areSameColorTiles', () => {
  it('compares square colours by coordinate parity', () => {
    expect(areSameColorTiles({ y: 0, x: 0 }, { y: 7, x: 7 })).toBe(true);
    expect(areSameColorTiles({ y: 0, x: 2 }, { y: 7, x: 5 })).toBe(true);
    expect(areSameColorTiles({ y: 0, x: 0 }, { y: 0, x: 1 })).toBe(false);
  });
});

describe('findFiguresCoords', () => {
  it('finds every square holding the given figure', () => {
    expect(findFiguresCoords(createPosition(), 'white-rook')).toEqual([{ y: 0, x: 0 }, { y: 0, x: 7 }]);
    expect(findFiguresCoords(createPosition(), 'black-king')).toEqual([{ y: 7, x: 4 }]);
    expect(findFiguresCoords(boardWith({}), 'white-queen')).toEqual([]);
  });
});

describe('getNewMoveNotation', () => {
  // The UI passes the position from BEFORE the move, so captures can be detected.
  it('writes a pawn move as the destination square', () => {
    expect(notation({ position: createPosition(), figure: 'white-pawn', from: 'e2', to: 'e4' })).toBe('e4');
    expect(notation({ position: createPosition(), figure: 'black-pawn', from: 'c7', to: 'c5' })).toBe('c5');
  });

  it('writes a pawn capture with the starting file', () => {
    const position = boardWith({ e4: 'white-pawn', d5: 'black-pawn' });
    expect(notation({ position, figure: 'white-pawn', from: 'e4', to: 'd5' })).toBe('exd5');
  });

  it('writes an en passant capture like a normal pawn capture', () => {
    const position = boardWith({ e5: 'white-pawn', d5: 'black-pawn' });
    expect(notation({ position, figure: 'white-pawn', from: 'e5', to: 'd6' })).toBe('exd6');
  });

  it('prefixes piece moves with the piece letter', () => {
    const position = boardWith({ a1: 'white-rook', c1: 'white-bishop', d1: 'white-queen', e1: 'white-king' });

    expect(notation({ position, figure: 'white-rook', from: 'a1', to: 'a5' })).toBe('Ra5');
    expect(notation({ position, figure: 'white-bishop', from: 'c1', to: 'g5' })).toBe('Bg5');
    expect(notation({ position, figure: 'white-queen', from: 'd1', to: 'd4' })).toBe('Qd4');
    expect(notation({ position, figure: 'white-king', from: 'e1', to: 'e2' })).toBe('Ke2');
  });

  it('marks piece captures with "x"', () => {
    const position = boardWith({ a1: 'white-rook', a7: 'black-pawn' });
    expect(notation({ position, figure: 'white-rook', from: 'a1', to: 'a7' })).toBe('Rxa7');
  });

  it('accepts string coordinates coming from drag-and-drop data', () => {
    expect(getNewMoveNotation({ position: createPosition(), figure: 'white-pawn', axisY: '1', axisX: '4', y: 3, x: 4 })).toBe('e4');
  });

  it('writes knight moves with "N", unlike the king', () => {
    const position = boardWith({ g1: 'white-knight', c6: 'black-knight', e5: 'white-pawn' });

    expect(notation({ position: createPosition(), figure: 'white-knight', from: 'g1', to: 'f3' })).toBe('Nf3');
    expect(notation({ position: createPosition(), figure: 'black-knight', from: 'b8', to: 'c6' })).toBe('Nc6');
    expect(notation({ position, figure: 'black-knight', from: 'c6', to: 'e5' })).toBe('Nxe5');
  });

  it('writes kingside castling as "0-0" and queenside castling as "0-0-0" for both colours', () => {
    const position = boardWith({ e1: 'white-king', a1: 'white-rook', h1: 'white-rook', e8: 'black-king', a8: 'black-rook', h8: 'black-rook' });

    expect(notation({ position, figure: 'white-king', from: 'e1', to: 'g1' })).toBe('0-0');
    expect(notation({ position, figure: 'white-king', from: 'e1', to: 'c1' })).toBe('0-0-0');
    expect(notation({ position, figure: 'black-king', from: 'e8', to: 'g8' })).toBe('0-0');
    expect(notation({ position, figure: 'black-king', from: 'e8', to: 'c8' })).toBe('0-0-0');
  });

  it('writes a promotion with the letter of the new piece and no colour', () => {
    const position = boardWith({ e7: 'white-pawn', b2: 'black-pawn' });

    expect(notation({ position, figure: 'white-pawn', from: 'e7', to: 'e8', promotesTo: 'queen' })).toBe('e8=Q');
    expect(notation({ position, figure: 'white-pawn', from: 'e7', to: 'e8', promotesTo: 'rook' })).toBe('e8=R');
    expect(notation({ position, figure: 'white-pawn', from: 'e7', to: 'e8', promotesTo: 'bishop' })).toBe('e8=B');
    expect(notation({ position, figure: 'white-pawn', from: 'e7', to: 'e8', promotesTo: 'knight' })).toBe('e8=N');
    expect(notation({ position, figure: 'black-pawn', from: 'b2', to: 'b1', promotesTo: 'queen' })).toBe('b1=Q');
  });

  it('writes a capturing promotion with the starting file', () => {
    const position = boardWith({ e7: 'white-pawn', d8: 'black-rook', b2: 'black-pawn', a1: 'white-rook' });

    expect(notation({ position, figure: 'white-pawn', from: 'e7', to: 'd8', promotesTo: 'queen' })).toBe('exd8=Q');
    expect(notation({ position, figure: 'black-pawn', from: 'b2', to: 'a1', promotesTo: 'knight' })).toBe('bxa1=N');
  });
});
