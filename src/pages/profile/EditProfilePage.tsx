import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ImageUpload from '@/components/form/ImageUpload';
import { useAppDispatch, useAppSelector } from '@/store';
import { useLazyMeQuery } from '@/store/authApi';
import { sessionUpdated } from '@/store/authSlice';
import { useProfileQuery, useUpdateProfileMutation } from '@/store/profileApi';
import type { Profile, UpdateProfileRequest } from '@/types/api';
import { toApiError } from '@/utils/errors';
import { LINK_TYPES, VISIBILITY } from './profileLinks';

const MAX_INTERESTS = 15;
const SUGGESTED = ['music', 'hip hop', 'painting', 'poetry', 'photography', 'tarot', 'healing', 'film', 'dance', 'comedy'];

export default function EditProfilePage() {
  const me = useAppSelector((s) => s.auth.session!.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfileQuery(me.username);
  const [save, saving] = useUpdateProfileMutation();
  const [loadSession] = useLazyMeQuery();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState('');
  const [links, setLinks] = useState<Record<string, string>>({});
  const [visibility, setVisibility] = useState<Profile['profileVisibility']>('PUBLIC');
  const [avatar, setAvatar] = useState<{ key?: string; url: string | null }>({ url: null });
  const [cover, setCover] = useState<{ key?: string; url: string | null }>({ url: null });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setBio(profile.bio ?? '');
    setInterests(profile.interests);
    setLinks(profile.links ?? {});
    setVisibility(profile.profileVisibility);
    setAvatar({ url: profile.avatarUrl });
    setCover({ url: profile.coverUrl });
  }, [profile]);

  useEffect(() => {
    if (error) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [error]);

  const addInterest = (raw: string) => {
    const value = raw.trim().toLowerCase();
    if (!value || interests.includes(value) || interests.length >= MAX_INTERESTS) return;
    setInterests([...interests, value]);
    setInterestInput('');
  };

  const onInterestKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addInterest(interestInput);
    } else if (e.key === 'Backspace' && !interestInput && interests.length) {
      setInterests(interests.slice(0, -1));
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!displayName.trim()) return setError('Tell people what to call you');
    const badLink = Object.entries(links).find(([, url]) => url.trim() && !/^https?:\/\/\S+\.\S+$/i.test(url.trim()));
    if (badLink) {
      const label = LINK_TYPES.find((t) => t.key === badLink[0])?.label ?? badLink[0];
      return setError(`${label}: enter a full web address starting with https://`);
    }

    const body: UpdateProfileRequest = {
      displayName: displayName.trim(),
      bio,
      interests,
      links: Object.fromEntries(Object.entries(links).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v)),
      profileVisibility: visibility,
    };
    // Only send image keys that changed: a new upload, or '' to remove.
    if (avatar.key !== undefined) body.avatarKey = avatar.key;
    if (cover.key !== undefined) body.coverKey = cover.key;

    try {
      await save(body).unwrap();
      const session = await loadSession().unwrap();
      dispatch(sessionUpdated(session));
      navigate('/profile', { replace: true });
    } catch (err) {
      setError(toApiError(err as never)?.message ?? 'Could not save your profile');
    }
  };

  if (isLoading) return <div className="placeholder-glow"><span className="placeholder col-12 rounded-4" style={{ height: 420 }} /></div>;

  return (
    <div className="row justify-content-center">
      <div className="col-lg-9 col-xl-8">
        <Link to="/profile" className="small text-body-secondary"><i className="bi bi-arrow-left me-1" />Back to profile</Link>
        <h1 className="display-6 page-title mt-2 mb-1">Edit profile</h1>
        <p className="text-body-secondary mb-4">This is how other members see you.</p>
        {error && <div className="alert alert-danger" role="alert">{error}</div>}

        <form onSubmit={onSubmit} noValidate className="d-grid gap-4">
          <section className="card border-0 shadow-sm"><div className="card-body p-4">
            <h2 className="h5 fw-bold mb-3"><i className="bi bi-image me-2 text-primary" />Photos</h2>
            <label className="form-label fw-medium">Cover image</label>
            <ImageUpload kind="COVER" shape="banner" label="Upload a cover image" url={cover.url}
                         onChange={(key, url) => setCover({ key, url })} />
            <div className="mt-3" style={{ maxWidth: 180 }}>
              <label className="form-label fw-medium">Profile photo</label>
              <ImageUpload kind="AVATAR" shape="circle" label="Add a photo" url={avatar.url}
                           onChange={(key, url) => setAvatar({ key, url })} />
            </div>
          </div></section>

          <section className="card border-0 shadow-sm"><div className="card-body p-4">
            <h2 className="h5 fw-bold mb-3"><i className="bi bi-person me-2 text-primary" />About you</h2>
            <div className="mb-3">
              <label htmlFor="displayName" className="form-label fw-medium">Display name</label>
              <input id="displayName" className="form-control form-control-lg" maxLength={80} value={displayName}
                     onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="mb-3">
              <label htmlFor="bio" className="form-label fw-medium">Bio</label>
              <textarea id="bio" className="form-control" rows={4} maxLength={1000} value={bio}
                        placeholder="Rapper. Live sessions every Friday." onChange={(e) => setBio(e.target.value)} />
              <div className="form-text text-end">{bio.length}/1000</div>
            </div>
            <div>
              <label htmlFor="interest" className="form-label fw-medium">Interests</label>
              <div className="form-control d-flex flex-wrap gap-2 align-items-center" style={{ minHeight: 48 }}>
                {interests.map((i) => (
                  <span key={i} className="badge rounded-pill interest-chip px-3 py-2">
                    {i}
                    <button type="button" className="btn-close ms-2" style={{ fontSize: '0.5rem' }} aria-label={`Remove ${i}`}
                            onClick={() => setInterests(interests.filter((x) => x !== i))} />
                  </span>
                ))}
                <input id="interest" className="border-0 flex-grow-1" style={{ outline: 'none', minWidth: 140 }} value={interestInput}
                       placeholder={interests.length ? '' : 'Type and press Enter'} maxLength={40}
                       onChange={(e) => setInterestInput(e.target.value)} onKeyDown={onInterestKey} onBlur={() => addInterest(interestInput)} />
              </div>
              <div className="d-flex flex-wrap gap-1 mt-2">
                {SUGGESTED.filter((s) => !interests.includes(s)).map((s) => (
                  <button type="button" key={s} className="btn btn-sm btn-light rounded-pill" onClick={() => addInterest(s)}>+ {s}</button>
                ))}
              </div>
            </div>
          </div></section>

          <section className="card border-0 shadow-sm"><div className="card-body p-4">
            <h2 className="h5 fw-bold mb-1"><i className="bi bi-link-45deg me-2 text-primary" />Portfolio & links</h2>
            <p className="text-body-secondary small mb-3">Your portfolio is shown as a button at the top of your profile.</p>
            <div className="d-grid gap-2">
              {LINK_TYPES.map((t) => (
                <div key={t.key} className={`input-group ${t.key === 'portfolio' ? 'input-group-lg' : ''}`}>
                  <span className="input-group-text" style={{ minWidth: 140 }}><i className={`bi bi-${t.icon} me-2`} />{t.label}</span>
                  <input type="url" className="form-control" placeholder={t.placeholder} value={links[t.key] ?? ''}
                         onChange={(e) => setLinks({ ...links, [t.key]: e.target.value })} />
                </div>
              ))}
            </div>
          </div></section>

          <section className="card border-0 shadow-sm"><div className="card-body p-4">
            <h2 className="h5 fw-bold mb-3"><i className="bi bi-shield-lock me-2 text-primary" />Who can see your profile</h2>
            <div className="d-grid gap-2">
              {VISIBILITY.map((v) => (
                <label key={v.value} className={`vis-option ${visibility === v.value ? 'is-on' : ''}`}>
                  <input type="radio" name="visibility" className="form-check-input mt-0" checked={visibility === v.value}
                         onChange={() => setVisibility(v.value)} />
                  <span><strong>{v.label}</strong><br /><small className="text-body-secondary">{v.hint}</small></span>
                </label>
              ))}
            </div>
          </div></section>

          <div className="d-flex gap-2 justify-content-end">
            <Link to="/profile" className="btn btn-outline-secondary btn-lg">Cancel</Link>
            <button type="submit" className="btn btn-join btn-lg px-4" disabled={saving.isLoading}>
              {saving.isLoading && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
              Save profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
