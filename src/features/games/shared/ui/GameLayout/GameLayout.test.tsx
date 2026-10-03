// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import GameLayout from './GameLayout';
import { getElement, ofType } from '../../../../../shared/test/dom';

const renderLayout = (props: Partial<ComponentProps<typeof GameLayout>> = {}) => render(
  <GameLayout
    header={<h1>Some Game</h1>}
    board={<div>board</div>}
    controls={<div>controls</div>}
    {...props}
  />
);

describe('GameLayout', () => {
  it('puts the header above the board and the side panel', () => {
    const { container } = renderLayout();
    const root = ofType(container.firstElementChild, HTMLElement);

    expect(root.firstElementChild).toBe(screen.getByRole('heading', { name: 'Some Game' }));
    const body = getElement(root, '.game-layout__body');
    expect([...body.children].map(child => [child.className, child.textContent])).toEqual([
      ['game-layout__board', 'board'],
      ['game-layout__side', 'controls']
    ]);
  });

  it('adds the game class to the root element when given one', () => {
    const { container, rerender } = renderLayout({ className: 'some-game' });

    expect(container.firstElementChild?.className).toBe('game-layout some-game');

    rerender(<GameLayout header={<h1>Some Game</h1>} board={<div>board</div>} controls={<div>controls</div>} />);

    expect(container.firstElementChild?.className).toBe('game-layout');
  });
});
