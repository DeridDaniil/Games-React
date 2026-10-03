// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import Modal, { MODAL_EXIT_MS } from './Modal';
import { getElement } from '../../test/dom';

// A trigger that opens the dialog the way the game header does.
const renderWithTrigger = () => {
  const onClose = vi.fn();
  function Harness() {
    const [isOpen, setIsOpen] = useState(false);
    const close = () => {
      onClose();
      setIsOpen(false);
    };
    return (
      <>
        <button type="button" onClick={() => setIsOpen(true)}>Open rules</button>
        <Modal isOpen={isOpen} onClose={close} title="Chess — Info">
          <p>Body text</p>
          <a href="#rules">Read more</a>
        </Modal>
      </>
    );
  }
  render(<Harness />);
  const trigger = screen.getByRole('button', { name: 'Open rules' });
  const open = () => {
    trigger.focus();
    fireEvent.click(trigger);
  };
  return { onClose, trigger, open };
};

afterEach(() => {
  vi.useRealTimers();
});

describe('Modal', () => {
  it('renders nothing while closed', () => {
    render(<Modal isOpen={false} onClose={() => {}} title="Hidden">Body</Modal>);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('is a modal dialog labelled by its title', () => {
    const { open } = renderWithTrigger();
    open();

    const dialog = screen.getByRole('dialog', { name: 'Chess — Info' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByText('Body text')).toBeTruthy();
  });

  it('moves focus into the dialog and gives it back to the opener when it closes', () => {
    const { open, trigger } = renderWithTrigger();
    open();

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' }));

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(document.activeElement).toBe(trigger);
  });

  it('closes on Escape, on the close button and on the backdrop', () => {
    const { open, onClose } = renderWithTrigger();

    open();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    open();
    fireEvent.click(getElement(document, '.modal__backdrop'));

    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('stays open when a double click on its opener lands the second click on the backdrop', () => {
    const { open, onClose } = renderWithTrigger();
    open();

    const backdrop = getElement(document, '.modal__backdrop');
    // The press must not move focus out of the dialog that stays open.
    expect(fireEvent.mouseDown(backdrop)).toBe(false);
    fireEvent.click(backdrop, { detail: 2 });

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('is described by the element named in describedBy', () => {
    render(
      <Modal isOpen onClose={() => {}} title="Confirm" describedBy="modal-details">
        <p id="modal-details">This cannot be undone.</p>
      </Modal>
    );

    expect(screen.getByRole('dialog', { name: 'Confirm', description: 'This cannot be undone.' })).toBeTruthy();
  });

  it('stays open when something inside the dialog is clicked', () => {
    const { open, onClose } = renderWithTrigger();
    open();

    fireEvent.click(screen.getByText('Body text'));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('keeps Tab and Shift+Tab inside the dialog', () => {
    const { open } = renderWithTrigger();
    open();
    const dialog = screen.getByRole('dialog');
    const close = screen.getByRole('button', { name: 'Close' });
    const link = screen.getByRole('link', { name: 'Read more' });

    link.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(close);

    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(link);
  });

  it('stays on screen, inert, while it fades out, then unmounts', () => {
    vi.useFakeTimers();
    const { open } = renderWithTrigger();
    open();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(document.querySelector('.modal--closing')).not.toBeNull();
    expect(getElement(document, '.modal__panel').hasAttribute('inert')).toBe(true);

    act(() => { vi.advanceTimersByTime(MODAL_EXIT_MS); });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
