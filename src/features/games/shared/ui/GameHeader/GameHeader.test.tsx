// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import GameHeader from './GameHeader';

describe('GameHeader', () => {
  it('shows the game title as the page heading with its context line', () => {
    render(<GameHeader title="Some Game" context="Two players" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Some Game' })).toBeTruthy();
    expect(screen.getByText('Two players')).toBeTruthy();
  });

  it('offers no buttons when the game has neither info nor settings', () => {
    render(<GameHeader title="Some Game" />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('opens the game info in a dialog, and offers settings only when there are some', () => {
    render(<GameHeader title="Some Game" info={<p>How to play</p>} />);

    expect(screen.queryByRole('button', { name: 'Settings' })).toBeNull();
    expect(screen.queryByText('How to play')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Info' }));

    expect(screen.getByRole('dialog', { name: 'Some Game — Info' })).toBeTruthy();
    expect(screen.getByText('How to play')).toBeTruthy();
  });

  it('opens the settings in their own dialog', () => {
    render(<GameHeader title="Some Game" info={<p>How to play</p>} settings={<p>Board size</p>} />);

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

    expect(screen.getByRole('dialog', { name: 'Some Game — Settings' })).toBeTruthy();
    expect(screen.getByText('Board size')).toBeTruthy();
    expect(screen.queryByText('How to play')).toBeNull();
  });
});
