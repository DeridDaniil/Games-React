// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import GameAction from './GameAction';

describe('GameAction', () => {
  it('is a real button that reports every click', () => {
    const onClick = vi.fn();
    render(<GameAction onClick={onClick}>Take Back</GameAction>);

    const button = screen.getByRole('button', { name: 'Take Back' });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(button.getAttribute('type')).toBe('button');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('looks quiet by default and dangerous for actions that end the game', () => {
    render(
      <>
        <GameAction onClick={() => {}}>Take Back</GameAction>
        <GameAction variant="danger" onClick={() => {}}>Surrender</GameAction>
      </>
    );

    expect(screen.getByRole('button', { name: 'Take Back' }).classList.contains('button--secondary')).toBe(true);
    expect(screen.getByRole('button', { name: 'Surrender' }).classList.contains('button--danger')).toBe(true);
  });

  it('keeps its icon out of the accessible name', () => {
    render(<GameAction icon={<svg data-testid="icon" />} onClick={() => {}}>Surrender</GameAction>);

    expect(screen.getByRole('button', { name: 'Surrender' })).toBeTruthy();
    expect(screen.getByTestId('icon').parentElement?.getAttribute('aria-hidden')).toBe('true');
  });
});
