import './Popup.scss';
import { useChessContext } from "../../model/Context";
import { Status } from "../../model/types";
import { closePopup } from "../../model/actions/popup";
import { Children, cloneElement } from "react";

const Popup = ({ children }) => {
  const { chessState, dispatch } = useChessContext();
  if (chessState.status === Status.ongoing) return null;

  const onClosePopup = () => {
    dispatch(closePopup());
  }

  return (
    <div className="popup">
      {Children.toArray(children).map(child => cloneElement(child, { onClosePopup }))}
    </div>
  )
}

export default Popup;