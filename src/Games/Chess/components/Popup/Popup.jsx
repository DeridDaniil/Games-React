import PromotionBox from "./PromotionBox/PromotionBox";
import './Popup.scss';
import { useChessContext } from "../../reducer/Context";
import { Status } from "../../data/types";
import { closePopup } from "../../reducer/actions/popup";
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