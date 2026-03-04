import './Resign.scss';

const Resign = ({ onClick }) => {
  return (
    <div className="resign" onClick={onClick}>
      <span>Resign</span>
    </div>
  );
};

export default Resign;

