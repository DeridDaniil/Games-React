import { createContext, useContext } from "react";

const ChessContext = createContext();

export const useChessContext = () => {
  return useContext(ChessContext);
};

export default ChessContext;