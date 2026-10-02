import PropTypes from 'prop-types';
import './IconButton.scss';

// Square button that shows only an icon; `label` is its accessible name and its tooltip.
const IconButton = ({ label, className = '', children, ...rest }) => (
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

IconButton.propTypes = {
  label: PropTypes.string.isRequired,
  className: PropTypes.string,
  children: PropTypes.node.isRequired
};

export default IconButton;
