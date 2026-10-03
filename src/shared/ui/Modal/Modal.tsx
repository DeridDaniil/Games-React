import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import IconButton from '../IconButton/IconButton';
import './Modal.scss';

// React 18 passes `inert` through as a plain attribute (React 19 types and handles it as a
// boolean), so the closing dialog sets it to an empty string; @types/react 18 does not list it.
// (The base it already has is restated so the merged declaration keeps using its parameter.)
declare module 'react' {
  interface HTMLAttributes<T> extends DOMAttributes<T> {
    inert?: '';
  }
}

// How long the dialog stays on screen while it fades out; also drives the CSS animation.
export const MODAL_EXIT_MS = 180;

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(', ');

// The fade-out length handed to the stylesheet as a custom property.
type ModalStyle = CSSProperties & { '--modal-duration': string };
const modalStyle: ModalStyle = { '--modal-duration': `${MODAL_EXIT_MS}ms` };

// The elements Tab moves between inside the dialog, in document order.
const focusableIn = (panel: HTMLElement) =>
  [...panel.querySelectorAll(FOCUSABLE)].filter((element) => element instanceof HTMLElement);

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  describedBy?: string;
  className?: string;
  children?: ReactNode;
}

// Accessible dialog rendered in a portal. It is labelled by its title (and described by the element
// with the `describedBy` id, if any) and closes on Escape, on the backdrop and on the close button.
// Focus moves into it, Tab stays inside it, and focus goes back to whatever had it before the
// dialog opened. The content stays mounted while it fades out.
function Modal({ isOpen, onClose, title, describedBy, className = '', children }: ModalProps) {
  const [isRendered, setIsRendered] = useState(isOpen);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();

  if (isOpen && !isRendered) setIsRendered(true);

  useEffect(() => {
    if (isOpen || !isRendered) return undefined;
    const timer = setTimeout(() => setIsRendered(false), MODAL_EXIT_MS);
    return () => clearTimeout(timer);
  }, [isOpen, isRendered]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!isOpen || !panel) return undefined;
    const opener = document.activeElement;
    const first = panel.querySelector(FOCUSABLE);
    (first instanceof HTMLElement ? first : panel).focus();
    return () => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [isOpen]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;

    // The handler sits on the panel, so currentTarget is the panel itself.
    const panel = event.currentTarget;
    const focusable = focusableIn(panel);
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (active === panel) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    } else if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  // A double click on the button that opened the dialog lands its second click on the backdrop,
  // which must not close the dialog again; a click's `detail` counts the clicks in a row.
  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.detail > 1) return;
    onClose();
  };

  if (!isRendered) return null;

  return createPortal(
    <div className={isOpen ? 'modal' : 'modal modal--closing'} style={modalStyle}>
      {/* Pressing the backdrop must not pull focus out of the dialog (it may stay open, see above). */}
      <div className="modal__backdrop" onMouseDown={(event) => event.preventDefault()} onClick={handleBackdropClick} />
      <div
        ref={panelRef}
        className={className ? `modal__panel ${className}` : 'modal__panel'}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        tabIndex={-1}
        inert={isOpen ? undefined : ''}
        onKeyDown={handleKeyDown}
      >
        <div className="modal__header">
          <h2 id={titleId} className="modal__title">{title}</h2>
          <IconButton label="Close" className="modal__close" onClick={onClose}>
            <X aria-hidden="true" />
          </IconButton>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export default Modal;
