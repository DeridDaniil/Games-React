import type { ReactNode } from 'react';
import './Popup.scss';
import { useChessContext } from "../../model/Context";
import { Status } from "../../model/types";

// The layer over the board for the promotion choice and the end of the game; empty while the
// game is on.
const Popup = ({ children }: { children: ReactNode }) => {
  const { chessState } = useChessContext();
  if (chessState.status === Status.ongoing) return null;

  return (
    <div className="popup">
      {children}
    </div>
  )
}

export default Popup;
