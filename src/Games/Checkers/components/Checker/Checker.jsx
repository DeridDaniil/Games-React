import './Checker.scss';

function Checker({ axisY, axisX, checker }) {
  const onDragStart = e => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${axisY}, ${axisX}, ${checker}`);
    setTimeout(() => {
      e.target.style.display = 'none';
    }, 0);
  }

  const onDragEnd = e => e.target.style.display = 'block';

  return (
    <div
      className={`checker ${checker} p-${axisY}${axisX}`}
      draggable={true}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    />
  )
}

export default Checker;