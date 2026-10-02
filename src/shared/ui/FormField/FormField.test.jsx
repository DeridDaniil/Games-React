// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import FormField from './FormField';

describe('FormField', () => {
  it('labels its input and passes the other props on to it', () => {
    const onChange = vi.fn();
    render(<FormField id="login" label="Login" value="" autoComplete="username" maxLength={20} onChange={onChange} />);

    const input = screen.getByRole('textbox', { name: 'Login' });
    fireEvent.change(input, { target: { value: 'tester' } });

    expect(input.getAttribute('type')).toBe('text');
    expect(input.getAttribute('autocomplete')).toBe('username');
    expect(input.getAttribute('maxlength')).toBe('20');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('is not marked invalid or described by default', () => {
    render(<FormField id="name" label="Display name" defaultValue="" />);

    const input = screen.getByLabelText('Display name');
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(input.getAttribute('aria-describedby')).toBeNull();
  });

  it('marks an invalid value and points at the message that explains it', () => {
    render(
      <>
        <FormField id="password" label="Password" type="password" invalid describedBy="password-error" defaultValue="" />
        <p id="password-error">Password must be at least 4 characters</p>
      </>
    );

    const input = screen.getByLabelText('Password');
    expect(input.getAttribute('type')).toBe('password');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('password-error');
  });

  it('shows a hint under the input and reads it before the error', () => {
    render(<FormField id="login" label="Login" hint="At least 3 characters" describedBy="login-error" defaultValue="" />);

    const input = screen.getByLabelText('Login');
    expect(screen.getByText('At least 3 characters').id).toBe('login-hint');
    expect(input.getAttribute('aria-describedby')).toBe('login-hint login-error');
  });
});
