// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import GameLayout from './GameLayout';

const renderLayout = (props) => render(
  <GameLayout title="Some Game" board={<div>board</div>} controls={<div>controls</div>} {...props} />
);

describe('GameLayout', () => {
  it('shows the title above the board area and the side controls', () => {
    const { container } = renderLayout();

    expect(screen.getByRole('heading', { level: 1, name: 'Some Game' })).toBeTruthy();
    const body = container.querySelector('.game-layout__body');
    expect([...body.children].map(child => child.textContent)).toEqual(['board', 'controls']);
    expect(screen.getByText('board').parentElement.className).toBe('game-layout__board');
  });

  it('adds the game class to the root element when given one', () => {
    const { container, rerender } = renderLayout({ className: 'some-game' });

    expect(container.firstElementChild.className).toBe('game-layout some-game');

    rerender(<GameLayout title="Some Game" board={<div>board</div>} controls={<div>controls</div>} />);

    expect(container.firstElementChild.className).toBe('game-layout');
  });
});
