import { createContext, useContext } from "react";
import type { Dispatch } from "react";
import type { ChessAction, ChessState } from "./types";

interface ChessContextValue {
  chessState: ChessState;
  dispatch: Dispatch<ChessAction>;
}

// Provided by the Chess page for its board and panels.
const ChessContext = createContext<ChessContextValue | null>(null);

export const useChessContext = (): ChessContextValue => {
  const context = useContext(ChessContext);
  if (!context) throw new Error('useChessContext must be used within the Chess game');
  return context;
};

export default ChessContext;
