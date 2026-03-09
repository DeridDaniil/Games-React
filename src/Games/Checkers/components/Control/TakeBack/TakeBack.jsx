import { useCheckersContext } from '../../../reducer/Context';
import { takeBack } from '../../../reducer/actions/move';
import './TakeBack.scss';

const TakeBack = () => {
  const { dispatch } = useCheckersContext();

  return (
    <div className="checkers-take-back" onClick={() => dispatch(takeBack())}>
      <span>Take Back</span>
    </div>
  )
}

export default TakeBack;
