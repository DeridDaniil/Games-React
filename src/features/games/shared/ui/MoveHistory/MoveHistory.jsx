import { useEffect, useId, useRef } from 'react';
import PropTypes from 'prop-types';
import './MoveHistory.scss';

// Notation panel. Moves are paired by position (1 = moves 0 and 1, 2 = moves 2 and 3, …), so each
// game must record exactly one entry per turn (a checkers chain capture is one entry). The list
// follows the latest move.
const MoveHistory = ({ moves }) => {
  const headingId = useId();
  const scrollRef = useRef(null);

  useEffect(() => {
    const list = scrollRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [moves.length]);

  const rows = Array.from({ length: Math.ceil(moves.length / 2) }, (_, row) => moves.slice(row * 2, row * 2 + 2));

  return (
    <section className="game-move-history">
      <h2 id={headingId} className="game-move-history__title">Moves</h2>
      <div ref={scrollRef} className="game-move-history__scroll" role="region" aria-labelledby={headingId} tabIndex={0}>
        {rows.length === 0 ? (
          <p className="game-move-history__empty">No moves yet</p>
        ) : (
          <ol className="game-move-history__list">
            {rows.map((pair, row) => (
              <li key={row} className="game-move-history__row">
                <span className="game-move-history__number">{row + 1}</span>
                {pair.map((move, i) => (
                  <span
                    key={i}
                    className={
                      row * 2 + i === moves.length - 1
                        ? 'game-move-history__move game-move-history__move--latest'
                        : 'game-move-history__move'
                    }
                  >
                    {move}
                  </span>
                ))}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
};

MoveHistory.propTypes = {
  moves: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default MoveHistory;
