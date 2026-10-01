// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import SurrenderControl from './SurrenderControl';
import SurrenderDialog from './SurrenderDialog';

const MESSAGE = 'This will end the current game.';

const renderControl = () => {
  const onConfirm = vi.fn();
  const { container } = render(<SurrenderControl message={MESSAGE} onConfirm={onConfirm} />);
  return { onConfirm, container };
};

// While the dialog is open "Surrender" is also the label of its confirm button.
const tile = () => screen.getByText('Surrender', { selector: '.game-action span' });
const dialogTitle = () => screen.queryByRole('heading', { name: 'Confirm Surrender' });
const confirmButton = () => screen.getByRole('button', { name: 'Surrender' });
const advance = (ms) => act(() => { vi.advanceTimersByTime(ms); });

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('SurrenderControl', () => {
  it('starts with only the danger Surrender tile and no dialog', () => {
    renderControl();

    expect(tile().parentElement.classList.contains('game-action--danger')).toBe(true);
    expect(dialogTitle()).toBeNull();
  });

  it('opens the dialog with the game message when the tile is clicked', () => {
    renderControl();

    fireEvent.click(tile());

    expect(dialogTitle()).not.toBeNull();
    expect(screen.getByText(`Are you sure you want to surrender? ${MESSAGE}`)).toBeTruthy();
    // Rendered in place, right after the tile, not in a portal (its CSS relies on that).
    expect(tile().parentElement.nextElementSibling.classList.contains('game-surrender-dialog')).toBe(true);
  });

  it('keeps Confirm disabled for the first two seconds', () => {
    const { onConfirm } = renderControl();
    fireEvent.click(tile());

    advance(1_999);
    expect(confirmButton().disabled).toBe(true);
    fireEvent.click(confirmButton());
    advance(1_000);

    expect(onConfirm).not.toHaveBeenCalled();
    expect(dialogTitle()).not.toBeNull();
  });

  it('enables Confirm after two seconds', () => {
    renderControl();
    fireEvent.click(tile());

    advance(2_000);

    expect(confirmButton().disabled).toBe(false);
    expect(confirmButton().classList.contains('game-surrender-dialog__button--active')).toBe(true);
  });

  it('reports the confirmation exactly once, after the close animation, and closes', () => {
    const { onConfirm } = renderControl();
    fireEvent.click(tile());
    advance(2_000);

    fireEvent.click(confirmButton());
    expect(onConfirm).not.toHaveBeenCalled();
    advance(250);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(dialogTitle()).toBeNull();
  });

  it('closes on Cancel once the close animation has played, without confirming', () => {
    const { onConfirm, container } = renderControl();
    fireEvent.click(tile());

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(container.querySelector('.game-surrender-dialog--closing')).not.toBeNull();
    advance(249);
    expect(dialogTitle()).not.toBeNull();
    advance(1);

    expect(dialogTitle()).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('cancels when the backdrop is clicked', () => {
    const { onConfirm, container } = renderControl();
    fireEvent.click(tile());

    fireEvent.click(container.querySelector('.game-surrender-dialog__backdrop'));
    advance(250);

    expect(dialogTitle()).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('starts the confirmation delay again when reopened', () => {
    renderControl();
    fireEvent.click(tile());
    advance(2_000);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    advance(250);

    fireEvent.click(tile());

    expect(confirmButton().disabled).toBe(true);
  });
});

describe('SurrenderDialog', () => {
  it('clears its confirmation timer when unmounted', () => {
    const { unmount } = render(<SurrenderDialog message={MESSAGE} onCancel={vi.fn()} onConfirm={vi.fn()} />);
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
