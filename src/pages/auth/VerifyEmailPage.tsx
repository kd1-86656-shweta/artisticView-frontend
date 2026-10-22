import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '@/components/layout/AuthLayout';
import { useVerifyEmailMutation } from '@/store/authApi';
import { useAppSelector } from '@/store';
import { toApiError } from '@/utils/errors';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [verify] = useVerifyEmailMutation();
  const loggedIn = useAppSelector((s) => Boolean(s.auth.session));
  const [state, setState] = useState<'working' | 'done' | 'failed'>('working');
  const [message, setMessage] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // StrictMode runs effects twice in dev; tokens are single-use.
    started.current = true;
    verify(params.get('token') ?? '')
      .unwrap()
      .then(() => setState('done'))
      .catch((err) => {
        setState('failed');
        setMessage(toApiError(err)?.message ?? 'Could not verify your email');
      });
  }, [params, verify]);

  return (
    <AuthLayout title="Email verification">
      {state === 'working' && <div className="spinner-border text-primary" role="status" />}
      {state === 'done' && <div className="alert alert-success">Your email is confirmed. Thank you!</div>}
      {state === 'failed' && <div className="alert alert-danger">{message}</div>}
      <Link to={loggedIn ? '/home' : '/login'} className="btn btn-primary">{loggedIn ? 'Go home' : 'Log in'}</Link>
    </AuthLayout>
  );
}
