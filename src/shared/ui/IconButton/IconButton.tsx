import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import './IconButton.scss';

type IconButtonProps = Omit<ComponentPropsWithoutRef<'button'>, 'children'> & {
  label: string;
  children: ReactNode;
};

// Square button that shows only an icon; `label` is its accessible name and its tooltip.
const IconButton = ({ label, className = '', children, ...rest }: IconButtonProps) => (
  <button
    type="button"
    className={className ? `icon-button ${className}` : 'icon-button'}
    aria-label={label}
    title={label}
    {...rest}
  >
    {children}
  </button>
);

export default IconButton;
