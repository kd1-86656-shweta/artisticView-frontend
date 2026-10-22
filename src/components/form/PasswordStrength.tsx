/** Rough strength guide; the server only enforces length 8-100. */
export function scorePassword(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

const LABELS = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'];
const COLORS = ['bg-danger', 'bg-danger', 'bg-warning', 'bg-info', 'bg-success'];

export default function PasswordStrength({ password }: { password: string }) {
  if (!password) {
    return null;
  }
  const score = password.length < 8 ? 0 : scorePassword(password);
  return (
    <div className="mt-n2 mb-3" aria-live="polite">
      <div className="d-flex gap-1 mb-1">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className={`flex-fill rounded-pill strength-bar ${step <= score ? COLORS[score] : 'bg-body-secondary'}`} />
        ))}
      </div>
      <small className="text-body-secondary">{LABELS[score]}</small>
    </div>
  );
}
