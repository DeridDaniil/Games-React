import { createContext, useContext } from "react";

const CheckersContext = createContext();

export const useCheckersContext = () => {
  return useContext(CheckersContext);
}

export default CheckersContext;