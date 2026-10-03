// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import MoveHistory from './MoveHistory';

const rows = (container: HTMLElement) => [...container.querySelectorAll('.game-move-history__row')]
  .map(row => [...row.children].map(cell => cell.textContent));

describe('MoveHistory', () => {
  it('lays the moves out as numbered pairs in the order they were played', () => {
    const { container } = render(<MoveHistory moves={['e4', 'e5', 'Nf3']} />);

    expect(rows(container)).toEqual([['1', 'e4', 'e5'], ['2', 'Nf3']]);
  });

  it('pairs moves by position, whoever made them (current behaviour)', () => {
    const { container } = render(<MoveHistory moves={['c3-d4', 'b6-a5', 'd4-c5', 'a5xc3', 'b2xd4']} />);

    expect(rows(container).map(row => row[0])).toEqual(['1', '2', '3']);
  });

  it('marks the latest move', () => {
    const { container } = render(<MoveHistory moves={['e4', 'e5', 'Nf3']} />);

    const latest = container.querySelectorAll('.game-move-history__move--latest');
    expect([...latest].map(move => move.textContent)).toEqual(['Nf3']);
  });

  it('shows an empty state before the first move', () => {
    render(<MoveHistory moves={[]} />);

    expect(screen.getByRole('region', { name: 'Moves' })).toBeTruthy();
    expect(screen.getByText('No moves yet')).toBeTruthy();
  });
});
