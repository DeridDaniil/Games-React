import PromotionBox from "./PromotionBox/PromotionBox";
import './Popup.scss';
import { useChessContext } from "../../reducer/Context";
import { Status } from "../../data/types";
import { closePopup } from "../../reducer/actions/popup";

const Popup = () => {
  const { chessState, dispatch } = useChessContext();
  if (chessState.status === Status.ongoing) return null;

  const onClosePopup = () => {
    dispatch(closePopup());
  }

  return (
    <div className="popup">
      <PromotionBox onClosePopup={onClosePopup} />
    </div>
  )
}

export default Popup;