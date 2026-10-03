// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it('is a plain button with its label, look and extra props', () => {
    const onClick = vi.fn();
    render(<Button variant="danger" onClick={onClick} aria-describedby="hint">Surrender</Button>);

    const button = screen.getByRole('button', { name: 'Surrender' });
    fireEvent.click(button);

    expect(button.getAttribute('type')).toBe('button');
    expect(button.classList.contains('button--danger')).toBe(true);
    expect(button.getAttribute('aria-describedby')).toBe('hint');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('defaults to the secondary look and keeps its icon out of the accessible name', () => {
    render(<Button icon={<svg data-testid="icon" />}>Restart</Button>);

    const button = screen.getByRole('button', { name: 'Restart' });
    expect(button.classList.contains('button--secondary')).toBe(true);
    expect(screen.getByTestId('icon').parentElement?.getAttribute('aria-hidden')).toBe('true');
  });

  it('does not react while disabled', () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Take Back</Button>);

    fireEvent.click(screen.getByRole('button', { name: 'Take Back' }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
