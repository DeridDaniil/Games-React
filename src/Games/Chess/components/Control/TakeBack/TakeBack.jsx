import { useChessContext } from '../../../reducer/Context';
import { takeBack } from '../../../reducer/actions/move';
import './TakeBack.scss';

const TakeBack = () => {
  const { dispatch } = useChessContext();

  return (
    <div className="take-back" onClick={() => dispatch(takeBack())}>
      <span>Take Back</span>
    </div>
  )
}

export default TakeBack;