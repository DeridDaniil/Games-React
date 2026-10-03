import { createContext, useContext } from "react";
import type { Dispatch } from "react";
import type { CheckersAction, CheckersState } from "./types";

interface CheckersContextValue {
  checkersState: CheckersState;
  dispatch: Dispatch<CheckersAction>;
}

// Provided by the Checkers page for its board and panels.
const CheckersContext = createContext<CheckersContextValue | null>(null);

export const useCheckersContext = (): CheckersContextValue => {
  const context = useContext(CheckersContext);
  if (!context) throw new Error('useCheckersContext must be used within the Checkers game');
  return context;
}

export default CheckersContext;
