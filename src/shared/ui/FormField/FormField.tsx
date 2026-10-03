import type { ComponentPropsWithoutRef } from 'react';
import './FormField.scss';

type FormFieldProps = ComponentPropsWithoutRef<'input'> & {
  id: string;
  label: string;
  hint?: string | undefined;
  invalid?: boolean | undefined;
  describedBy?: string | undefined;
};

// A labelled text input with an optional hint under it. `invalid` marks the value as wrong for
// assistive tech and for the eye; `describedBy` names an extra element (usually the error) that
// explains the field. Any other prop goes to <input>.
const FormField = ({ id, label, hint = '', type = 'text', invalid = false, describedBy, className = '', ...inputProps }: FormFieldProps) => {
  const hintId = hint ? `${id}-hint` : '';
  const descriptions = [hintId, describedBy].filter(Boolean).join(' ');

  return (
    <div className={className ? `form-field ${className}` : 'form-field'}>
      <label className="form-field__label" htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        className="form-field__input"
        aria-invalid={invalid ? 'true' : undefined}
        aria-describedby={descriptions || undefined}
        {...inputProps}
      />
      {hint && <p id={hintId} className="form-field__hint">{hint}</p>}
    </div>
  );
};

export default FormField;
