import { pieceType } from '../helper';
import type { ChessPiece, ChessPosition } from '../../model/types';
import type { PlayerColor, Square } from '../../../shared/model/types';

// A piece and the square it stands on.
interface FigureAt {
  figure: ChessPiece;
  axisY: number;
  axisX: number;
}

// A piece on the board, as the move generators take it.
interface PieceAt extends FigureAt {
  position: ChessPosition;
}

export const getRookMoves = ({ position, figure, axisY, axisX }: PieceAt): Square[] => {
  const moves: Square[] = [];
  const us = figure.slice(0, 5);
  const enemy = us === 'white' ? 'black' : 'white';
  const directory = [
    [-1, 0],
    [1, 0],
    [0, 1],
    [0, -1]
  ];

  directory.forEach(dir => {
    for (let i = 1; i < 8; i++) {
      const y = axisY + (i * dir[0]);
      const x = axisX + (i * dir[1]);
      if (position?.[y]?.[x] === undefined) break;
      if (position[y][x].slice(0, 5) === us) break;
      if (position[y][x].slice(0, 5) === enemy) {
        moves.push([y, x]);
        break;
      };
      moves.push([y, x]);
    };
  });

  return moves;
}

export const getKnightMoves = ({ position, figure, axisY, axisX }: PieceAt): Square[] => {
  const moves: Square[] = [];
  const us = figure.slice(0, 5);
  const directions = [
    [2, -1],
    [2, 1],
    [-2, -1],
    [-2, 1],
    [1, -2],
    [1, 2],
    [-1, -2],
    [-1, 2]
  ];

  directions.forEach(dir => {
    const cell = position?.[axisY + dir[0]]?.[axisX + dir[1]];
    if (cell !== undefined && cell.slice(0, 5) !== us) {
      moves.push([axisY + dir[0], axisX + dir[1]]);
    }
  })

  return moves;
}

export const getBishopMoves = ({ position, figure, axisY, axisX }: PieceAt): Square[] => {
  const moves: Square[] = [];
  const us = figure.slice(0, 5);
  const enemy = us === 'white' ? 'black' : 'white';
  const directory = [
    [-1, 1],
    [-1, -1],
    [1, -1],
    [1, 1]
  ];

  directory.forEach(dir => {
    for (let i = 1; i < 8; i++) {
      const y = axisY + (i * dir[0]);
      const x = axisX + (i * dir[1]);
      if (position?.[y]?.[x] === undefined) break;
      if (position[y][x].slice(0, 5) === us) break;
      if (position[y][x].slice(0, 5) === enemy) {
        moves.push([y, x]);
        break;
      };
      moves.push([y, x]);
    };
  });

  return moves;
}

export const getQueenMoves = ({ position, figure, axisY, axisX }: PieceAt): Square[] => {
  const moves = [
    ...getRookMoves({ position, figure, axisY, axisX }),
    ...getBishopMoves({ position, figure, axisY, axisX })
  ];
  return moves;
}

export const getKingMoves = ({ position, figure, axisY, axisX }: PieceAt): Square[] => {
  const moves: Square[] = [];
  const us = figure.slice(0, 5);
  const directions = [
    [0, 1],
    [0, -1],
    [1, 0],
    [1, -1],
    [1, 1],
    [-1, 0],
    [-1, 1],
    [-1, -1],
  ];

  directions.forEach(dir => {
    const cell = position?.[axisY + dir[0]]?.[axisX + dir[1]];
    if (cell !== undefined && cell.slice(0, 5) !== us) {
      moves.push([axisY + dir[0], axisX + dir[1]]);
    }
  })

  return moves;
}

export const getPawnMoves = ({ position, figure, axisY, axisX }: PieceAt): Square[] => {
  const moves: Square[] = [];
  const moveY = figure.slice(0, 5) === 'white' ? 1 : -1;

  if (!position?.[axisY + moveY]?.[axisX]) {
    moves.push([axisY + moveY, axisX]);
  }

  if (axisY % 5 === 1) {
    if (position?.[axisY + moveY]?.[axisX] === '' && !position?.[axisY + moveY + moveY]?.[axisX] && position?.[axisY + moveY + moveY]?.[axisX] !== undefined) {
      moves.push([axisY + moveY + moveY, axisX]);
    }
  }

  return moves;
}

// `prevPosition` is the position before the last move; without it en passant is not seen.
export const getPawnCaptures = ({ position, prevPosition, figure, axisY, axisX }: PieceAt & { prevPosition?: ChessPosition | undefined }): Square[] => {
  const moves: Square[] = [];
  const isWhite = figure.slice(0, 5) === 'white';
  const moveY = isWhite ? 1 : -1;
  const moveX = [1, -1];
  const enemyPawn = moveY === 1 ? 'black-pawn' : 'white-pawn';
  const enemy = isWhite ? 'black' : 'white';

  moveX.forEach(x => {
    if (position?.[axisY + moveY]?.[axisX + x] !== undefined && position?.[axisY + moveY]?.[axisX + x].slice(0, 5) === enemy) {
      moves.push([axisY + moveY, axisX + x]);
    }
  });

  if (prevPosition) {
    if ((moveY === 1 && axisY === 4) || (moveY === -1 && axisY === 3)) {
      moveX.forEach(x => {
        if (position?.[axisY]?.[axisX + x] === enemyPawn &&
          position?.[axisY + moveY + moveY]?.[axisX + x] === '' &&
          prevPosition?.[axisY]?.[axisX + x] === '' &&
          prevPosition?.[axisY + moveY + moveY]?.[axisX + x] === enemyPawn
        ) {
          moves.push([axisY + moveY, axisX + x]);
        }
      })
    }
  }
  return moves;
}

// The moves of a piece by its own rules: no castling, no en passant and no care for its king.
export const getRegularMoves = (piece: PieceAt): Square[] => {
  switch (pieceType(piece.figure)) {
    case 'rook': return getRookMoves(piece);
    case 'knight': return getKnightMoves(piece);
    case 'bishop': return getBishopMoves(piece);
    case 'queen': return getQueenMoves(piece);
    case 'king': return getKingMoves(piece);
    case 'pawn': return getPawnMoves(piece);
  }
}

export const getKingPosition = (position: ChessPosition, player: PlayerColor): Square | undefined => {
  let kingPosition: Square | undefined;

  position.forEach((axisY, y) => {
    axisY.forEach((_axisX, x) => {
      if (position[y][x] === `${player}-king`) kingPosition = [y, x];
    })
  })

  return kingPosition;
}

export const getFigures = (position: ChessPosition, enemy: PlayerColor): FigureAt[] => {
  const enemyfigures: FigureAt[] = [];

  position.forEach((axisY, y) => {
    axisY.forEach((cell, x) => {
      if (cell && cell.slice(0, 5) === enemy) {
        enemyfigures.push({
          figure: cell,
          axisY: y,
          axisX: x
        })
      }
    })
  })

  return enemyfigures;
}
