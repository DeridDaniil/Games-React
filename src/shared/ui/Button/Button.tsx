import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import './Button.scss';

type ButtonProps = Omit<ComponentPropsWithoutRef<'button'>, 'children'> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: ReactNode;
  children: ReactNode;
};

// Text button in the app's four looks. Any other prop (onClick, disabled, aria-*) goes to <button>.
const Button = ({ variant = 'secondary', icon = null, className = '', children, ...rest }: ButtonProps) => (
  <button type="button" className={`button button--${variant}${className ? ` ${className}` : ''}`} {...rest}>
    {icon && <span className="button__icon" aria-hidden="true">{icon}</span>}
    <span className="button__label">{children}</span>
  </button>
);

export default Button;
