// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import IconButton from './IconButton';

describe('IconButton', () => {
  it('takes its accessible name and tooltip from the label', () => {
    const onClick = vi.fn();
    render(<IconButton label="Info" onClick={onClick}><svg aria-hidden="true" /></IconButton>);

    const button = screen.getByRole('button', { name: 'Info' });
    fireEvent.click(button);

    expect(button.getAttribute('type')).toBe('button');
    expect(button.getAttribute('title')).toBe('Info');
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
