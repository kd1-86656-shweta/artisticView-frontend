import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { useSubFeature } from '@/features/auth/permissions';
import { useUpdateMyProfileMutation } from '@/store/homeApi';
import { toApiError } from '@/utils/errors';

const SUGGESTED = ['music', 'hip hop', 'production', 'art', 'writing', 'gaming', 'tech', 'photography', 'film', 'fitness'];

/** Nudges new members to add a bio and interests, which power people/community suggestions. */
export default function CompleteProfileCard() {
  const { canWrite } = useSubFeature('PROFILE_EDIT');
  const [update, { isLoading, error }] = useUpdateMyProfileMutation();
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [draft, setDraft] = useState('');

  if (!canWrite) {
    return null;
  }

  const addInterest = (value: string) => {
    const v = value.trim().toLowerCase();
    if (v && !interests.includes(v) && interests.length < 15) {
      setInterests([...interests, v]);
    }
    setDraft('');
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addInterest(draft);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    update({ bio: bio.trim(), interests });
  };

  return (
    <section className="card border-0 shadow-sm profile-nudge">
      <div className="card-body p-4">
        <div className="d-flex gap-3 align-items-start mb-3">
          <div className="feature-icon"><i className="bi bi-stars" /></div>
          <div>
            <h2 className="h5 fw-bold mb-1">Complete your profile</h2>
            <p className="text-body-secondary mb-0">A short bio and a few interests help the right people find you.</p>
          </div>
        </div>
        {error && <div className="alert alert-danger">{toApiError(error)?.message}</div>}
        <form onSubmit={onSubmit} className="row g-3">
          <div className="col-md-6">
            <label htmlFor="bio" className="form-label fw-medium">Bio</label>
            <textarea id="bio" className="form-control" rows={3} maxLength={1000} value={bio}
                      onChange={(e) => setBio(e.target.value)} placeholder="Rapper from Pune. Live sessions every Friday." />
          </div>
          <div className="col-md-6">
            <label htmlFor="interest" className="form-label fw-medium">Interests</label>
            <input id="interest" className="form-control" value={draft} onChange={(e) => setDraft(e.target.value)}
                   onKeyDown={onKey} onBlur={() => addInterest(draft)} placeholder="Type and press Enter" maxLength={40} />
            <div className="d-flex flex-wrap gap-1 mt-2">
              {interests.map((i) => (
                <button type="button" key={i} className="badge rounded-pill interest-chip border-0"
                        onClick={() => setInterests(interests.filter((x) => x !== i))} aria-label={`Remove ${i}`}>
                  {i} <i className="bi bi-x" />
                </button>
              ))}
              {SUGGESTED.filter((s) => !interests.includes(s)).slice(0, 6).map((s) => (
                <button type="button" key={s} className="badge rounded-pill text-bg-light border" onClick={() => addInterest(s)}>
                  + {s}
                </button>
              ))}
            </div>
          </div>
          <div className="col-12 d-flex justify-content-end">
            <button className="btn btn-primary" disabled={isLoading || (!bio.trim() && interests.length === 0)}>
              {isLoading && <span className="spinner-border spinner-border-sm me-2" />}Save
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
