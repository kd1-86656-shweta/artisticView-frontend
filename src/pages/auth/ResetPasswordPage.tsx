import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '@/components/layout/AuthLayout';
import PasswordField from '@/components/form/PasswordField';
import PasswordStrength from '@/components/form/PasswordStrength';
import { useResetPasswordMutation } from '@/store/authApi';
import { toApiError } from '@/utils/errors';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [reset, { isLoading }] = useResetPasswordMutation();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Use at least 8 characters');
    if (password !== confirm) return setError('Passwords do not match');
    try {
      await reset({ token, newPassword: password }).unwrap();
      setDone(true);
    } catch (err) {
      setError(toApiError(err as never)?.message ?? 'Could not reset your password');
    }
  };

  return (
    <AuthLayout title="Choose a new password">
      {!token && <div className="alert alert-warning">This link is missing its token. Request a new one.</div>}
      {done ? (
        <div className="alert alert-success">
          Your password has been changed and you have been logged out everywhere. <Link to="/login">Log in</Link>
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          {error && <div className="alert alert-danger">{error}</div>}
          <PasswordField label="New password" value={password} onChange={setPassword} autoComplete="new-password" />
          <PasswordStrength password={password} />
          <PasswordField label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
          <button className="btn btn-primary btn-lg w-100" disabled={isLoading || !token}>Save new password</button>
        </form>
      )}
    </AuthLayout>
  );
}
