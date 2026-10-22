import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '@/components/layout/AuthLayout';
import PasswordField from '@/components/form/PasswordField';
import PasswordStrength from '@/components/form/PasswordStrength';
import { useLazyCheckUsernameQuery, useSignUpMutation } from '@/store/authApi';
import { authenticated } from '@/store/authSlice';
import { useAppDispatch } from '@/store';
import { toApiError } from '@/utils/errors';

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,30}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Field = 'displayName' | 'username' | 'email' | 'password' | 'confirmPassword' | 'terms';
type Errors = Partial<Record<Field, string>>;

export default function SignupPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [signUp, { isLoading }] = useSignUpMutation();
  const [checkUsername, usernameCheck] = useLazyCheckUsernameQuery();

  const [form, setForm] = useState({ displayName: '', username: '', email: '', password: '', confirmPassword: '' });
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const set = (field: keyof typeof form) => (value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  // Live username availability, debounced so we do not call the API on every keystroke.
  useEffect(() => {
    if (!USERNAME_PATTERN.test(form.username)) {
      return;
    }
    const timer = setTimeout(() => checkUsername(form.username), 400);
    return () => clearTimeout(timer);
  }, [form.username, checkUsername]);

  const usernameTaken =
    usernameCheck.data && usernameCheck.data.username === form.username && !usernameCheck.data.available;
  const usernameFree =
    usernameCheck.data && usernameCheck.data.username === form.username && usernameCheck.data.available;

  const validate = (): Errors => {
    const e: Errors = {};
    if (!form.displayName.trim()) e.displayName = 'Tell people what to call you';
    if (!USERNAME_PATTERN.test(form.username)) e.username = '3-30 letters, numbers or underscores';
    else if (usernameTaken) e.username = 'This username is taken';
    if (!EMAIL_PATTERN.test(form.email)) e.email = 'Enter a valid email address';
    if (form.password.length < 8) e.password = 'Use at least 8 characters';
    if (form.confirmPassword !== form.password) e.confirmPassword = 'Passwords do not match';
    if (!terms) e.terms = 'Please accept the community guidelines';
    return e;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const clientErrors = validate();
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) {
      return;
    }
    try {
      const result = await signUp({
        displayName: form.displayName.trim(),
        username: form.username,
        email: form.email.trim(),
        password: form.password,
      }).unwrap();
      dispatch(authenticated(result));
      navigate('/home', { replace: true, state: { welcome: true } });
    } catch (err) {
      const apiError = toApiError(err as never);
      if (apiError?.details) {
        setErrors(apiError.details as Errors);
      }
      if (apiError?.code === 'CONFLICT' && apiError.message.toLowerCase().includes('username')) {
        setErrors((e) => ({ ...e, username: apiError.message }));
      } else if (apiError?.code === 'CONFLICT' && apiError.message.toLowerCase().includes('email')) {
        setErrors((e) => ({ ...e, email: apiError.message }));
      } else {
        setFormError(apiError?.message ?? 'Could not create your account');
      }
    }
  };

  return (
    <AuthLayout
      title="Join us"
      subtitle={<>Create your free profile and find your people. Already a member? <Link to="/login" className="fw-semibold">Log in</Link></>}
    >
      {formError && <div className="alert alert-danger" role="alert">{formError}</div>}

      <form onSubmit={onSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="displayName" className="form-label fw-medium">Display name</label>
          <input id="displayName" className={`form-control form-control-lg ${errors.displayName ? 'is-invalid' : ''}`}
                 value={form.displayName} onChange={(e) => set('displayName')(e.target.value)}
                 autoComplete="name" maxLength={80} placeholder="e.g. Budnix" autoFocus />
          {errors.displayName && <div className="invalid-feedback">{errors.displayName}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="username" className="form-label fw-medium">Username</label>
          <div className="input-group input-group-lg has-validation">
            <span className="input-group-text">@</span>
            <input id="username"
                   className={`form-control ${errors.username || usernameTaken ? 'is-invalid' : usernameFree ? 'is-valid' : ''}`}
                   value={form.username} onChange={(e) => set('username')(e.target.value.replace(/\s/g, ''))}
                   autoComplete="username" maxLength={30} placeholder="yourname" />
            {(errors.username || usernameTaken) && (
              <div className="invalid-feedback">{errors.username ?? 'This username is taken'}</div>
            )}
            {!errors.username && usernameFree && <div className="valid-feedback">Nice, it is available</div>}
          </div>
          <div className="form-text">Your profile will live at /users/{form.username || 'yourname'}</div>
        </div>

        <div className="mb-3">
          <label htmlFor="email" className="form-label fw-medium">Email</label>
          <input id="email" type="email" className={`form-control form-control-lg ${errors.email ? 'is-invalid' : ''}`}
                 value={form.email} onChange={(e) => set('email')(e.target.value)} autoComplete="email"
                 placeholder="you@example.com" />
          {errors.email && <div className="invalid-feedback">{errors.email}</div>}
        </div>

        <PasswordField label="Password" value={form.password} onChange={set('password')}
                       error={errors.password} autoComplete="new-password" name="password" />
        <PasswordStrength password={form.password} />

        <PasswordField label="Confirm password" value={form.confirmPassword} onChange={set('confirmPassword')}
                       error={errors.confirmPassword} autoComplete="new-password" name="confirmPassword" />

        <div className="form-check mb-4">
          <input id="terms" type="checkbox" className={`form-check-input ${errors.terms ? 'is-invalid' : ''}`}
                 checked={terms} onChange={(e) => { setTerms(e.target.checked); setErrors((er) => ({ ...er, terms: undefined })); }} />
          <label htmlFor="terms" className="form-check-label">
            I agree to be kind and follow the community guidelines
          </label>
          {errors.terms && <div className="invalid-feedback">{errors.terms}</div>}
        </div>

        <button type="submit" className="btn btn-join btn-lg w-100" disabled={isLoading}>
          {isLoading && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
          Join us
        </button>
      </form>
    </AuthLayout>
  );
}
