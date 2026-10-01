// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import MoveHistory from './MoveHistory';

const rows = (container) => [...container.querySelector('.game-move-history').children];

describe('MoveHistory', () => {
  it('lists the moves in the order they were played', () => {
    const { container } = render(<MoveHistory moves={['e4', 'e5', 'Nf3']} />);

    expect(rows(container).map(row => row.textContent)).toEqual(['e4', 'e5', 'Nf3']);
  });

  it('gives both moves of a pair the same move number', () => {
    const { container } = render(<MoveHistory moves={['c3-d4', 'b6-a5', 'd4-c5', 'a5xc3', 'b2xd4']} />);

    expect(rows(container).map(row => row.dataset.number)).toEqual(['1', '1', '2', '2', '3']);
  });

  it('renders an empty history before the first move', () => {
    const { container } = render(<MoveHistory moves={[]} />);

    expect(rows(container)).toEqual([]);
  });
});
