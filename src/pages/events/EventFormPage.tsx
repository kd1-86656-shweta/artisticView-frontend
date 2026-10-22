import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppSelector } from '@/store';
import { useLazyCheckUsernameQuery } from '@/store/authApi';
import { useCreateEventMutation, useEventQuery, useUpdateEventMutation } from '@/store/eventsApi';
import type { EventLocationType, EventRequest } from '@/types/api';
import { toApiError } from '@/utils/errors';
import { fromLocalInput, mapsUrl, toLocalInput } from './eventUtils';

const CATEGORIES = ['Music', 'Hip hop', 'Listening party', 'Workshop', 'Tarot & healing', 'Art', 'Poetry', 'Comedy', 'Meetup', 'Other'];
const PROMOTE_OPTIONS = [0, 3, 7, 14];

interface FormState {
  title: string;
  description: string;
  category: string;
  startsAt: string;
  endsAt: string;
  locationType: EventLocationType;
  location: string;
  meetingUrl: string;
  capacity: string;
  promoteDays: number;
}

const EMPTY: FormState = {
  title: '', description: '', category: '', startsAt: '', endsAt: '',
  locationType: 'IN_PERSON', location: '', meetingUrl: '', capacity: '', promoteDays: 0,
};

/** Create (/events/host) and edit (/events/:id/edit) share this form. */
export default function EventFormPage() {
  const { id } = useParams();
  const editId = id ? Number(id) : null;
  const navigate = useNavigate();
  const { data: existing, isLoading: loadingExisting } = useEventQuery(editId!, { skip: !editId });
  const [createEvent, creating] = useCreateEventMutation();
  const [updateEvent, updating] = useUpdateEventMutation();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [people, setPeople] = useState<string[]>([]);
  const [personInput, setPersonInput] = useState('');
  const [personError, setPersonError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const me = useAppSelector((s) => s.auth.session!.user);
  const [checkUsername, usernameCheck] = useLazyCheckUsernameQuery();

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title, description: existing.description ?? '', category: existing.category ?? '',
        startsAt: toLocalInput(existing.startsAt), endsAt: toLocalInput(existing.endsAt),
        locationType: existing.locationType, location: existing.location ?? '', meetingUrl: existing.meetingUrl ?? '',
        capacity: existing.capacity ? String(existing.capacity) : '', promoteDays: 0,
      });
    }
  }, [existing]);

  // The message sits above the form; bring it into view since Publish is at the bottom.
  useEffect(() => {
    if (error) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [error]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  /** Only adds usernames that belong to a real member, so publishing can't fail on a typo. */
  const addPerson = async () => {
    const name = personInput.trim().replace(/^@/, '').toLowerCase();
    setPersonError(null);
    if (!name) return;
    if (people.includes(name)) return setPersonInput('');
    if (name === me.username) return setPersonError("You're the host already");
    if (people.length >= 10) return setPersonError('Up to 10 co-hosts');
    try {
      const { available } = await checkUsername(name).unwrap();
      // "available" means nobody has that username yet, i.e. no such member.
      if (available) return setPersonError(`No member called @${name}`);
      setPeople([...people, name]);
      setPersonInput('');
    } catch {
      setPersonError('Could not check that username, try again');
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!form.title.trim()) return setError('Give your event a title');
    if (!form.startsAt) return setError('Choose when your event starts');
    if (new Date(form.startsAt).getTime() <= Date.now() && (!editId || form.startsAt !== toLocalInput(existing?.startsAt))) {
      return setError('The start time has already passed. Pick a time in the future.');
    }
    if (form.endsAt && form.endsAt <= form.startsAt) return setError('The end time must be after the start time');
    if (form.locationType === 'IN_PERSON' && !form.location.trim()) return setError('Add a venue or address');

    const body: EventRequest = {
      title: form.title.trim(),
      description: form.description,
      category: form.category,
      startsAt: fromLocalInput(form.startsAt),
      endsAt: fromLocalInput(form.endsAt) ?? null,
      locationType: form.locationType,
      location: form.locationType === 'IN_PERSON' ? form.location : '',
      meetingUrl: form.meetingUrl,
      capacity: form.capacity ? Number(form.capacity) : null,
    };
    try {
      const saved = editId
        ? await updateEvent({ id: editId, body }).unwrap()
        : await createEvent({ ...body, collaborators: people, promoteDays: form.promoteDays || undefined }).unwrap();
      navigate(`/events/${saved.id}`, { replace: true });
    } catch (err) {
      setError(toApiError(err as never)?.message ?? 'Could not save the event');
    }
  };

  if (editId && loadingExisting) return <div className="placeholder-glow"><span className="placeholder col-12 rounded-4" style={{ height: 400 }} /></div>;
  if (editId && existing && !existing.canManage) return <div className="alert alert-warning">Only the host and co-hosts can edit this event.</div>;

  const saving = creating.isLoading || updating.isLoading;

  return (
    <div className="row justify-content-center">
      <div className="col-lg-9 col-xl-8">
        <Link to={editId ? `/events/${editId}` : '/events'} className="small text-body-secondary"><i className="bi bi-arrow-left me-1" />Back</Link>
        <h1 className="display-6 page-title mt-2 mb-1">{editId ? 'Edit event' : 'Host an event'}</h1>
        <p className="text-body-secondary mb-4">{editId ? 'Changes show up for everyone right away.' : 'Tell people what is happening, when and where.'}</p>

        {error && <div className="alert alert-danger" role="alert">{error}</div>}

        <form onSubmit={onSubmit} noValidate className="d-grid gap-4">
          <section className="card border-0 shadow-sm"><div className="card-body p-4">
            <h2 className="h5 fw-bold mb-3"><i className="bi bi-info-circle me-2 text-primary" />About the event</h2>
            <div className="mb-3">
              <label htmlFor="title" className="form-label fw-medium">Title</label>
              <input id="title" className="form-control form-control-lg" maxLength={120} value={form.title}
                     onChange={(e) => set('title', e.target.value)} placeholder="e.g. Friday night cypher" autoFocus={!editId} />
            </div>
            <div className="mb-3">
              <label htmlFor="description" className="form-label fw-medium">Description</label>
              <textarea id="description" className="form-control" rows={5} maxLength={4000} value={form.description}
                        onChange={(e) => set('description', e.target.value)}
                        placeholder="What will happen, who it's for, what to bring..." />
              <div className="form-text text-end">{form.description.length}/4000</div>
            </div>
            <div>
              <label className="form-label fw-medium">Category</label>
              <div className="d-flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button type="button" key={c} className={`ev-chip ${form.category === c ? 'is-on' : ''}`}
                          onClick={() => set('category', form.category === c ? '' : c)}>{c}</button>
                ))}
              </div>
            </div>
          </div></section>

          <section className="card border-0 shadow-sm"><div className="card-body p-4">
            <h2 className="h5 fw-bold mb-3"><i className="bi bi-clock me-2 text-primary" />When</h2>
            <div className="row g-3">
              <div className="col-sm-6">
                <label htmlFor="startsAt" className="form-label fw-medium">Starts</label>
                <input id="startsAt" type="datetime-local" className="form-control" value={form.startsAt}
                       min={toLocalInput(new Date().toISOString())} onChange={(e) => set('startsAt', e.target.value)} />
              </div>
              <div className="col-sm-6">
                <label htmlFor="endsAt" className="form-label fw-medium">Ends <span className="text-body-secondary fw-normal">(optional)</span></label>
                <input id="endsAt" type="datetime-local" className="form-control" value={form.endsAt}
                       min={form.startsAt} onChange={(e) => set('endsAt', e.target.value)} />
              </div>
            </div>
          </div></section>

          <section className="card border-0 shadow-sm"><div className="card-body p-4">
            <h2 className="h5 fw-bold mb-3"><i className="bi bi-geo-alt me-2 text-primary" />Where</h2>
            <div className="ev-segmented mb-3" role="radiogroup">
              {([['IN_PERSON', 'geo-alt', 'In person'], ['ONLINE', 'camera-video', 'Online']] as const).map(([v, icon, label]) => (
                <button type="button" key={v} role="radio" aria-checked={form.locationType === v}
                        className={form.locationType === v ? 'is-on' : ''} onClick={() => set('locationType', v)}>
                  <i className={`bi bi-${icon} me-1`} />{label}
                </button>
              ))}
            </div>
            {form.locationType === 'IN_PERSON' && (
              <div className="mb-3">
                <label htmlFor="location" className="form-label fw-medium">Venue or address</label>
                <input id="location" className="form-control" maxLength={200} value={form.location}
                       onChange={(e) => set('location', e.target.value)} placeholder="e.g. Sailors Creek Resto Bar, Anjuna, Goa" />
                {form.location.trim() && (
                  <a className="small d-inline-block mt-1" href={mapsUrl(form.location)} target="_blank" rel="noreferrer">
                    <i className="bi bi-map me-1" />Check it on Google Maps
                  </a>
                )}
              </div>
            )}
            <div>
              <label htmlFor="meetingUrl" className="form-label fw-medium">
                {form.locationType === 'ONLINE' ? 'Meeting or stream link' : 'Livestream link'} <span className="text-body-secondary fw-normal">(optional)</span>
              </label>
              <input id="meetingUrl" type="url" className="form-control" maxLength={500} value={form.meetingUrl}
                     onChange={(e) => set('meetingUrl', e.target.value)} placeholder="https://..." />
            </div>
          </div></section>

          <section className="card border-0 shadow-sm"><div className="card-body p-4">
            <h2 className="h5 fw-bold mb-3"><i className="bi bi-people me-2 text-primary" />People</h2>
            <div className="mb-3" style={{ maxWidth: 240 }}>
              <label htmlFor="capacity" className="form-label fw-medium">Capacity <span className="text-body-secondary fw-normal">(optional)</span></label>
              <input id="capacity" type="number" min={1} max={100000} className="form-control" value={form.capacity}
                     onChange={(e) => set('capacity', e.target.value)} placeholder="Unlimited" />
            </div>
            {!editId ? (
              <div>
                <label htmlFor="person" className="form-label fw-medium">Invite co-hosts</label>
                <p className="form-text mt-0 mb-2">Collaborators help run the event and can edit it once they accept.</p>
                <div className="input-group" style={{ maxWidth: 420 }}>
                  <span className="input-group-text">@</span>
                  <input id="person" className={`form-control ${personError ? 'is-invalid' : ''}`} value={personInput} placeholder="username"
                         onChange={(e) => { setPersonInput(e.target.value.replace(/\s/g, '')); setPersonError(null); }}
                         onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPerson(); } }} />
                  <button type="button" className="btn btn-outline-secondary" onClick={addPerson} disabled={usernameCheck.isFetching}>
                    {usernameCheck.isFetching ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : 'Add'}
                  </button>
                </div>
                {personError && <div className="small text-danger mt-1">{personError}</div>}
                {people.length > 0 && (
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {people.map((p) => (
                      <span key={p} className="ev-chip is-on">@{p}
                        <button type="button" className="btn-close btn-close-white ms-2" style={{ fontSize: '0.55rem' }}
                                aria-label={`Remove ${p}`} onClick={() => setPeople(people.filter((x) => x !== p))} />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="small text-body-secondary mb-0"><i className="bi bi-info-circle me-1" />Manage co-hosts from the event page.</p>
            )}
          </div></section>

          {!editId && (
            <section className="card border-0 shadow-sm ev-promote-card"><div className="card-body p-4">
              <h2 className="h5 fw-bold mb-1"><i className="bi bi-stars me-2" />Promote</h2>
              <p className="text-body-secondary small mb-3">Feature your event on everyone's Home and at the top of Events.</p>
              <div className="ev-segmented">
                {PROMOTE_OPTIONS.map((d) => (
                  <button type="button" key={d} className={form.promoteDays === d ? 'is-on' : ''} onClick={() => set('promoteDays', d)}>
                    {d === 0 ? 'Not now' : `${d} days`}
                  </button>
                ))}
              </div>
            </div></section>
          )}

          <div className="d-flex gap-2 justify-content-end">
            <Link to={editId ? `/events/${editId}` : '/events'} className="btn btn-outline-secondary btn-lg">Cancel</Link>
            <button type="submit" className="btn btn-join btn-lg px-4" disabled={saving}>
              {saving && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
              {editId ? 'Save changes' : 'Publish event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
