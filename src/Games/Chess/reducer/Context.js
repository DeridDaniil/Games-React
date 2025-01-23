import { createContext, useContext } from "react";

const СhessContext = createContext();

export const useChessContext = () => {
  return useContext(СhessContext);
};

export default СhessContext;