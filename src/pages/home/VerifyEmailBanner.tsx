import { useResendVerificationMutation } from '@/store/authApi';
import { toApiError } from '@/utils/errors';

export default function VerifyEmailBanner({ email }: { email: string }) {
  const [resend, { isLoading, isSuccess, error }] = useResendVerificationMutation();
  return (
    <div className="alert alert-warning d-flex flex-wrap align-items-center justify-content-between gap-2 mb-0">
      <span><i className="bi bi-envelope-exclamation me-2" />Please confirm your email <strong>{email}</strong> to keep your account secure.</span>
      {isSuccess ? (
        <span className="small fw-medium">Sent. Check your inbox.</span>
      ) : (
        <button className="btn btn-sm btn-warning" disabled={isLoading} onClick={() => resend()}>
          Resend email
        </button>
      )}
      {error && <span className="small text-danger w-100">{toApiError(error)?.message}</span>}
    </div>
  );
}
