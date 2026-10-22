import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '@/components/layout/AuthLayout';
import { useForgotPasswordMutation } from '@/store/authApi';
import { toApiError } from '@/utils/errors';

export default function ForgotPasswordPage() {
  const [forgot, { isLoading }] = useForgotPasswordMutation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await forgot(email.trim()).unwrap();
      setSent(true);
    } catch (err) {
      setError(toApiError(err as never)?.message ?? 'Could not send the email');
    }
  };

  return (
    <AuthLayout title="Reset your password" subtitle="We will email you a link to choose a new one.">
      {sent ? (
        <div className="alert alert-success">
          If an account exists for <strong>{email}</strong>, a reset link is on its way. It expires in 30 minutes.
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          {error && <div className="alert alert-danger">{error}</div>}
          <div className="mb-4">
            <label htmlFor="email" className="form-label fw-medium">Email</label>
            <input id="email" type="email" className="form-control form-control-lg" value={email}
                   onChange={(e) => setEmail(e.target.value)} autoComplete="email" required autoFocus />
          </div>
          <button className="btn btn-primary btn-lg w-100" disabled={isLoading}>Send reset link</button>
        </form>
      )}
      <p className="mt-4 text-center"><Link to="/login">Back to log in</Link></p>
    </AuthLayout>
  );
}
