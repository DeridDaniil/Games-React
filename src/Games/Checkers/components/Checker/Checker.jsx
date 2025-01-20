import './Checker.scss';

function Checker({ axisY, axisX, checker }) {
  return <div className={`checker ${checker} p-${axisY}${axisX}`} draggable={true}></div>
}

export default Checker;