import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Avatar from '@/components/common/Avatar';
import { useAppSelector } from '@/store';
import {
  useDeleteEventMutation,
  useEventQuery,
  useInviteCollaboratorMutation,
  usePromoteEventMutation,
  useRemoveCollaboratorMutation,
  useRespondToInviteMutation,
  useRsvpMutation,
} from '@/store/eventsApi';
import { toApiError } from '@/utils/errors';
import { emailShareUrl, eventUrl, formatLong, formatTime, mapsUrl, relativeStart, whatsappShareUrl } from './eventUtils';

const STATUS_LABEL = { INVITED: 'Invited', ACCEPTED: 'Co-host', DECLINED: 'Declined' } as const;

export default function EventDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const me = useAppSelector((s) => s.auth.session!.user);
  const { data: e, isLoading, error } = useEventQuery(id);
  const [rsvp, rsvpState] = useRsvpMutation();
  const [invite, inviteState] = useInviteCollaboratorMutation();
  const [removeCollaborator] = useRemoveCollaboratorMutation();
  const [respond] = useRespondToInviteMutation();
  const [promote, promoteState] = usePromoteEventMutation();
  const [deleteEvent, deleteState] = useDeleteEventMutation();
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState<{ kind: 'danger' | 'success'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (isLoading) return <div className="placeholder-glow"><span className="placeholder col-12 rounded-4" style={{ height: 420 }} /></div>;
  if (error || !e) {
    return (
      <div className="empty-state rounded-4 p-5 text-center">
        <i className="bi bi-calendar-x fs-1 text-body-tertiary" />
        <h1 className="h4 mt-2">{toApiError(error)?.message ?? 'Event not found'}</h1>
        <Link to="/events" className="btn btn-outline-primary mt-2">Back to events</Link>
      </div>
    );
  }

  const run = async (action: () => Promise<unknown>, success?: string) => {
    setMessage(null);
    try {
      await action();
      if (success) setMessage({ kind: 'success', text: success });
    } catch (err) {
      setMessage({ kind: 'danger', text: toApiError(err as never)?.message ?? 'Something went wrong' });
    }
  };

  const full = e.capacity != null && e.rsvpCount >= e.capacity && !e.going;
  const ended = relativeStart(e) === 'Ended';
  const start = new Date(e.startsAt);

  const onDelete = () => {
    if (!window.confirm(`Delete "${e.title}"? Everyone's RSVPs will be removed. This cannot be undone.`)) return;
    run(async () => {
      await deleteEvent(e.id).unwrap();
      navigate('/events', { replace: true });
    });
  };

  const copyLink = async () => {
    await navigator.clipboard?.writeText(eventUrl(e.id));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="d-grid gap-4">
      <Link to="/events" className="small text-body-secondary"><i className="bi bi-arrow-left me-1" />All events</Link>

      {e.myCollaboration === 'INVITED' && (
        <div className="alert alert-info d-flex flex-wrap gap-2 justify-content-between align-items-center mb-0">
          <span><strong>{e.host.displayName}</strong> invited you to co-host this event.</span>
          <span className="d-flex gap-2">
            <button className="btn btn-join btn-sm px-3" onClick={() => run(() => respond({ id: e.id, accept: true }).unwrap(), 'You are now a co-host')}>Accept</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => run(() => respond({ id: e.id, accept: false }).unwrap())}>Decline</button>
          </span>
        </div>
      )}
      {message && <div className={`alert alert-${message.kind} mb-0`}>{message.text}</div>}

      <section className="ev-hero rounded-4 p-4 p-md-5">
        <div className="d-flex gap-4 align-items-start flex-wrap flex-md-nowrap">
          <div className="ev-hero__date">
            <span>{start.toLocaleString(undefined, { month: 'short' })}</span>
            <b>{start.getDate()}</b>
            <span>{start.toLocaleString(undefined, { weekday: 'short' })}</span>
          </div>
          <div className="flex-grow-1">
            <div className="d-flex flex-wrap gap-2 mb-2">
              {e.promoted && <span className="ev-badge ev-badge--featured"><i className="bi bi-stars" /> Featured</span>}
              <span className="ev-badge">{relativeStart(e)}</span>
              {e.category && <span className="ev-badge ev-badge--soft">{e.category}</span>}
            </div>
            <h1 className="display-6 page-title mb-2">{e.title}</h1>
            <p className="mb-1"><i className="bi bi-clock me-2" />{formatLong(e.startsAt)}{e.endsAt && ` – ${formatTime(e.endsAt)}`}</p>
            <p className="mb-0">
              <i className={`bi bi-${e.locationType === 'ONLINE' ? 'camera-video' : 'geo-alt'} me-2`} />
              {e.locationType === 'ONLINE' ? 'Online' : e.location}
              {e.locationType === 'IN_PERSON' && e.location && (
                <a className="ms-2 small" href={mapsUrl(e.location)} target="_blank" rel="noreferrer">Open in Maps <i className="bi bi-box-arrow-up-right" /></a>
              )}
            </p>
          </div>
        </div>
      </section>

      <div className="row g-4">
        <div className="col-lg-8 d-grid gap-4 align-content-start">
          <section className="card border-0 shadow-sm"><div className="card-body p-4">
            <h2 className="h5 fw-bold mb-3">About</h2>
            {e.description
              ? <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>{e.description}</p>
              : <p className="text-body-secondary mb-0">The host hasn't added a description yet.</p>}
            {e.meetingUrl && (e.going || e.canManage) && (
              <a className="btn btn-outline-primary mt-3" href={e.meetingUrl} target="_blank" rel="noreferrer">
                <i className="bi bi-camera-video me-2" />{e.locationType === 'ONLINE' ? 'Join the session' : 'Watch the livestream'}
              </a>
            )}
            {e.meetingUrl && !e.going && !e.canManage && (
              <p className="small text-body-secondary mt-3 mb-0"><i className="bi bi-lock me-1" />RSVP to get the session link.</p>
            )}
          </div></section>

          <section className="card border-0 shadow-sm"><div className="card-body p-4">
            <h2 className="h5 fw-bold mb-3">Hosts</h2>
            <div className="d-grid gap-3">
              <div className="d-flex align-items-center gap-3">
                <Avatar name={e.host.displayName} url={e.host.avatarUrl} size={44} />
                <div className="flex-grow-1"><div className="fw-semibold">{e.host.displayName}</div><small className="text-body-secondary">@{e.host.username} · Host</small></div>
              </div>
              {e.collaborators.map((c) => (
                <div key={c.user.id} className="d-flex align-items-center gap-3">
                  <Avatar name={c.user.displayName} url={c.user.avatarUrl} size={44} />
                  <div className="flex-grow-1">
                    <div className="fw-semibold">{c.user.displayName}</div>
                    <small className="text-body-secondary">@{c.user.username} · {STATUS_LABEL[c.status]}</small>
                  </div>
                  {(e.isHost || c.user.id === me.id) && (
                    <button className="btn btn-sm btn-outline-secondary"
                            onClick={() => run(() => removeCollaborator({ id: e.id, userId: c.user.id }).unwrap())}>
                      {c.user.id === me.id ? 'Leave' : 'Remove'}
                    </button>
                  )}
                </div>
              ))}
            </div>
            {e.isHost && (
              <form className="input-group mt-4" style={{ maxWidth: 440 }}
                    onSubmit={(ev) => { ev.preventDefault(); if (username.trim()) run(async () => { await invite({ id: e.id, username: username.trim() }).unwrap(); setUsername(''); }, 'Invite sent'); }}>
                <span className="input-group-text">@</span>
                <input className="form-control" placeholder="Invite a co-host by username" value={username}
                       onChange={(ev) => setUsername(ev.target.value.replace(/\s/g, ''))} />
                <button className="btn btn-outline-primary" disabled={inviteState.isLoading}>Invite</button>
              </form>
            )}
          </div></section>
        </div>

        <aside className="col-lg-4 d-grid gap-4 align-content-start">
          <section className="card border-0 shadow-sm"><div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-baseline mb-3">
              <span className="fs-3 fw-bold">{e.rsvpCount}</span>
              <span className="text-body-secondary">{e.capacity ? `of ${e.capacity} spots taken` : 'going'}</span>
            </div>
            {e.capacity && (
              <div className="progress mb-3" style={{ height: 6 }}>
                <div className="progress-bar bg-success" style={{ width: `${Math.min(100, (e.rsvpCount / e.capacity) * 100)}%` }} />
              </div>
            )}
            {!ended && (e.going ? (
              <button className="btn btn-outline-secondary w-100" disabled={rsvpState.isLoading}
                      onClick={() => run(() => rsvp({ id: e.id, going: false }).unwrap())}>
                <i className="bi bi-check-circle-fill text-success me-2" />You're going · Cancel
              </button>
            ) : (
              <button className="btn btn-join btn-lg w-100" disabled={rsvpState.isLoading || full}
                      onClick={() => run(() => rsvp({ id: e.id, going: true }).unwrap(), "You're in! See you there.")}>
                {full ? 'Event is full' : "I'm going"}
              </button>
            ))}
          </div></section>

          <section className="card border-0 shadow-sm"><div className="card-body p-4">
            <h2 className="h6 fw-bold mb-3">Share this event</h2>
            <div className="d-grid gap-2">
              <a className="btn ev-share ev-share--whatsapp" href={whatsappShareUrl(e)} target="_blank" rel="noreferrer"><i className="bi bi-whatsapp me-2" />Share on WhatsApp</a>
              <a className="btn ev-share ev-share--email" href={emailShareUrl(e)}><i className="bi bi-envelope me-2" />Send by email</a>
              <button className="btn btn-outline-secondary" onClick={copyLink}><i className={`bi bi-${copied ? 'check2' : 'link-45deg'} me-2`} />{copied ? 'Link copied' : 'Copy link'}</button>
            </div>
          </div></section>

          {e.isHost && (
            <section className="card border-0 shadow-sm ev-promote-card"><div className="card-body p-4">
              <h2 className="h6 fw-bold mb-1"><i className="bi bi-stars me-2" />Promotion</h2>
              <p className="small text-body-secondary mb-3">
                {e.promoted && e.promotedUntil
                  ? <>Featured until <strong>{formatLong(e.promotedUntil)}</strong>.</>
                  : 'Feature this event on Home and at the top of Events.'}
              </p>
              <div className="d-flex flex-wrap gap-2">
                {[3, 7, 14].map((d) => (
                  <button key={d} className="btn btn-sm btn-outline-dark" disabled={promoteState.isLoading || e.status !== 'SCHEDULED'}
                          onClick={() => run(() => promote({ id: e.id, days: d }).unwrap(), `Promoted for ${d} more days`)}>+{d} days</button>
                ))}
                {e.promoted && (
                  <button className="btn btn-sm btn-link text-danger" onClick={() => run(() => promote({ id: e.id, days: null }).unwrap(), 'Promotion stopped')}>Stop</button>
                )}
              </div>
            </div></section>
          )}

          {e.canManage && (
            <section className="card border-0 shadow-sm"><div className="card-body p-4 d-grid gap-2">
              <h2 className="h6 fw-bold mb-1">Manage</h2>
              <Link to={`/events/${e.id}/edit`} className="btn btn-outline-primary"><i className="bi bi-pencil me-2" />Edit event</Link>
              {e.isHost && (
                <button className="btn btn-outline-danger" disabled={deleteState.isLoading} onClick={onDelete}>
                  <i className="bi bi-trash me-2" />Delete event
                </button>
              )}
            </div></section>
          )}
        </aside>
      </div>
    </div>
  );
}
