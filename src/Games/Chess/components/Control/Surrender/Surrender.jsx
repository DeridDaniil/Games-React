import './Surrender.scss';

const Surrender = ({ onClick }) => {
  return (
    <div className="surrender" onClick={onClick}>
      <span>Surrender</span>
    </div>
  );
};

export default Surrender;

