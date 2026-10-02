import PropTypes from 'prop-types';
import './Button.scss';

// Text button in the app's four looks. Any other prop (onClick, disabled, aria-*) goes to <button>.
const Button = ({ variant = 'secondary', icon = null, className = '', children, ...rest }) => (
  <button type="button" className={`button button--${variant}${className ? ` ${className}` : ''}`} {...rest}>
    {icon && <span className="button__icon" aria-hidden="true">{icon}</span>}
    <span className="button__label">{children}</span>
  </button>
);

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'danger']),
  icon: PropTypes.node,
  className: PropTypes.string,
  children: PropTypes.node.isRequired
};

export default Button;
