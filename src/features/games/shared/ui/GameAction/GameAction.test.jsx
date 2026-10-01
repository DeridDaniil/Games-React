// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import GameAction from './GameAction';

const tile = (label) => screen.getByText(label).closest('.game-action');

describe('GameAction', () => {
  it('shows its label and reports every click', () => {
    const onClick = vi.fn();
    render(<GameAction onClick={onClick}>Take Back</GameAction>);

    fireEvent.click(screen.getByText('Take Back'));
    fireEvent.click(tile('Take Back'));

    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('uses the plain look by default and the danger look on request', () => {
    render(
      <>
        <GameAction onClick={() => {}}>Take Back</GameAction>
        <GameAction variant="danger" onClick={() => {}}>Surrender</GameAction>
      </>
    );

    expect(tile('Take Back').className).toBe('game-action');
    expect(tile('Surrender').className).toBe('game-action game-action--danger');
  });
});
