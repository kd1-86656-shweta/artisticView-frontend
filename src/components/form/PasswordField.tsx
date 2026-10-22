import { useId, useState } from 'react';

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete: 'current-password' | 'new-password';
  name?: string;
}

export default function PasswordField({ label, value, onChange, error, autoComplete, name }: PasswordFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label fw-medium">{label}</label>
      <div className="input-group has-validation">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          className={`form-control form-control-lg ${error ? 'is-invalid' : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
        />
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          <i className={`bi ${visible ? 'bi-eye-slash' : 'bi-eye'}`} />
        </button>
        {error && <div className="invalid-feedback">{error}</div>}
      </div>
    </div>
  );
}
