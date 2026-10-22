import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '@/components/layout/AuthLayout';
import PasswordField from '@/components/form/PasswordField';
import { useLoginMutation } from '@/store/authApi';
import { authenticated } from '@/store/authSlice';
import { useAppDispatch } from '@/store';
import { toApiError } from '@/utils/errors';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/home';
  const [login, { isLoading }] = useLoginMutation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError('Enter your email or username and your password');
      return;
    }
    try {
      const result = await login({ identifier: identifier.trim(), password }).unwrap();
      dispatch(authenticated(result));
      navigate(from, { replace: true });
    } catch (err) {
      setError(toApiError(err as never)?.message ?? 'Could not log in');
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle={<>New here? <Link to="/signup" className="fw-semibold">Join us</Link></>}
    >
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <form onSubmit={onSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="identifier" className="form-label fw-medium">Email or username</label>
          <input id="identifier" className="form-control form-control-lg" value={identifier}
                 onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" autoFocus />
        </div>
        <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="current-password" name="password" />
        <div className="d-flex justify-content-end mb-4 mt-n2">
          <Link to="/forgot-password" className="small">Forgot password?</Link>
        </div>
        <button type="submit" className="btn btn-primary btn-lg w-100" disabled={isLoading}>
          {isLoading && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
          Log in
        </button>
      </form>
    </AuthLayout>
  );
}
