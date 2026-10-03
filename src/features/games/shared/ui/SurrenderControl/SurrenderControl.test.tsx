// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import SurrenderControl from './SurrenderControl';
import { SURRENDER_DELAY_MS } from './SurrenderDialog';
import { MODAL_EXIT_MS } from '../../../../../shared/ui/Modal/Modal';
import { getElement, ofType } from '../../../../../shared/test/dom';

const MESSAGE = 'This will end the current game.';

const renderControl = () => {
  const onConfirm = vi.fn();
  const { unmount } = render(<SurrenderControl message={MESSAGE} onConfirm={onConfirm} />);
  return { onConfirm, unmount };
};

// While the dialog is open its confirm button is called "Surrender" too.
const surrenderAction = () => ofType(
  screen.getAllByRole('button', { name: 'Surrender' }).find(button => !button.closest('[role="dialog"]')),
  HTMLButtonElement
);
const dialog = () => screen.queryByRole('dialog', { name: 'Confirm Surrender' });
const inDialog = (name: string) => ofType(within(screen.getByRole('dialog')).getByRole('button', { name }), HTMLButtonElement);
const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });
const openDialog = () => fireEvent.click(surrenderAction());

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('SurrenderControl', () => {
  it('starts with the danger Surrender action and no dialog', () => {
    renderControl();

    expect(surrenderAction().classList.contains('button--danger')).toBe(true);
    expect(dialog()).toBeNull();
  });

  it('opens a labelled modal dialog with the game message', () => {
    renderControl();

    openDialog();

    expect(dialog()?.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByRole('dialog', { description: `Are you sure you want to surrender? ${MESSAGE}` })).toBe(dialog());
  });

  it('keeps Confirm disabled for the first two seconds', () => {
    const { onConfirm } = renderControl();
    openDialog();

    advance(SURRENDER_DELAY_MS - 1);
    expect(inDialog('Surrender').disabled).toBe(true);
    fireEvent.click(inDialog('Surrender'));
    advance(MODAL_EXIT_MS);

    expect(onConfirm).not.toHaveBeenCalled();
    expect(dialog()).not.toBeNull();
  });

  it('reports the confirmation exactly once, after the dialog has closed', () => {
    const { onConfirm } = renderControl();
    openDialog();
    advance(SURRENDER_DELAY_MS);

    fireEvent.click(inDialog('Surrender'));
    expect(onConfirm).not.toHaveBeenCalled();
    advance(MODAL_EXIT_MS);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(dialog()).toBeNull();
  });

  it('ignores a second Confirm while the dialog is closing', () => {
    const { onConfirm } = renderControl();
    openDialog();
    advance(SURRENDER_DELAY_MS);

    const confirm = inDialog('Surrender');
    fireEvent.click(confirm);
    expect(confirm.disabled).toBe(true);
    fireEvent.click(confirm);
    advance(MODAL_EXIT_MS * 2);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('closes on Cancel once, without confirming, even when Cancel is pressed twice', () => {
    const { onConfirm } = renderControl();
    openDialog();
    advance(SURRENDER_DELAY_MS);

    const cancel = inDialog('Cancel');
    fireEvent.click(cancel);
    expect(cancel.disabled).toBe(true);
    fireEvent.click(cancel);
    fireEvent.click(inDialog('Surrender'));
    advance(MODAL_EXIT_MS);

    expect(dialog()).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('treats Escape and the backdrop as Cancel', () => {
    const { onConfirm } = renderControl();

    openDialog();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    advance(MODAL_EXIT_MS);
    expect(dialog()).toBeNull();

    openDialog();
    fireEvent.click(getElement(document, '.modal__backdrop'));
    advance(MODAL_EXIT_MS);
    expect(dialog()).toBeNull();

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('starts the confirmation delay again when reopened', () => {
    renderControl();
    openDialog();
    advance(SURRENDER_DELAY_MS);
    fireEvent.click(inDialog('Cancel'));
    advance(MODAL_EXIT_MS);

    openDialog();

    expect(inDialog('Surrender').disabled).toBe(true);
  });

  it('moves focus into the dialog and back to the Surrender action', () => {
    renderControl();
    const action = surrenderAction();
    action.focus();

    fireEvent.click(action);
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(document.activeElement).toBe(action);
  });

  // The backdrop is never disabled, so only the closing guard stops it from starting a second close
  // whose timer would replace the pending confirmation and outlive an unmount.
  it('ignores the backdrop after Confirm, so unmounting while closing still confirms nothing', () => {
    const { onConfirm, unmount } = renderControl();
    openDialog();
    advance(SURRENDER_DELAY_MS);

    fireEvent.click(inDialog('Surrender'));
    fireEvent.click(getElement(document, '.modal__backdrop'));
    unmount();
    advance(MODAL_EXIT_MS * 2);

    expect(onConfirm).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('confirms nothing and leaves no timers behind when unmounted while closing', () => {
    const { onConfirm, unmount } = renderControl();
    openDialog();
    advance(SURRENDER_DELAY_MS);
    fireEvent.click(inDialog('Surrender'));

    unmount();
    advance(MODAL_EXIT_MS * 2);

    expect(onConfirm).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
