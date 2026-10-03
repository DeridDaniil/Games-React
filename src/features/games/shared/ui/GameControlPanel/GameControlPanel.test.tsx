// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import GameControlPanel from './GameControlPanel';
import { getElement } from '../../../../../shared/test/dom';

describe('GameControlPanel', () => {
  it('stacks the game widgets above a separate row of actions', () => {
    const { container } = render(
      <GameControlPanel actions={<><span>Take Back</span><span>Surrender</span></>}>
        <div>clock</div>
        <div>history</div>
      </GameControlPanel>
    );

    const panel = getElement(container, '.game-control-panel');
    const actions = getElement(panel, '.game-control-panel__actions');

    expect([...panel.children].map(child => child.textContent)).toEqual(['clock', 'history', 'Take BackSurrender']);
    expect(actions).toBe(panel.lastElementChild);
    expect(actions.contains(screen.getByText('Surrender'))).toBe(true);
  });
});
