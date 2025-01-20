import './Figure.scss';

function Figure({ axisY, axisX, figure }) {
  const onDragStart = e => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${figure}, ${axisY}, ${axisX}`);
    setTimeout(() => {
      e.target.style.display = 'none';
    }, 0);
  }

  return (
    <div
      className={`figure ${figure} p-${axisY}${axisX}`}
      draggable={true}
      onDragStart={onDragStart}
    />
  )
}

export default Figure;