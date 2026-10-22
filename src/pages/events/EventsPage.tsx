import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePermission } from '@/features/auth/permissions';
import { useEventInvitesQuery, useEventsQuery, useRespondToInviteMutation, type EventScope } from '@/store/eventsApi';
import { toApiError } from '@/utils/errors';
import EventCard from './EventCard';
import { formatWhen } from './eventUtils';

type Tab = EventScope | 'invites';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'upcoming', label: 'Upcoming', icon: 'calendar-event' },
  { key: 'promoted', label: 'Featured', icon: 'stars' },
  { key: 'mine', label: 'My events', icon: 'person-badge' },
  { key: 'invites', label: 'Co-host invites', icon: 'envelope-heart' },
];

const EMPTY: Record<Tab, { title: string; text: string }> = {
  upcoming: { title: 'Nothing scheduled yet', text: 'Be the first: host a listening party, workshop or meetup.' },
  promoted: { title: 'No featured events right now', text: 'Hosts can promote an event to feature it here and on Home.' },
  mine: { title: 'You are not hosting anything yet', text: 'Events you host or co-host show up here.' },
  invites: { title: 'No invites', text: 'When a host asks you to co-host their event, it appears here.' },
};

function InvitesList() {
  const { data, isLoading, error } = useEventInvitesQuery();
  const [respond, { isLoading: saving }] = useRespondToInviteMutation();
  if (isLoading) return <Skeleton />;
  if (error) return <div className="alert alert-danger">{toApiError(error)?.message}</div>;
  if (!data?.length) return <Empty tab="invites" />;
  return (
    <div className="d-grid gap-3">
      {data.map((e) => (
        <div key={e.id} className="card border-0 shadow-sm">
          <div className="card-body d-flex flex-wrap gap-3 align-items-center justify-content-between">
            <div>
              <div className="small text-body-secondary">{e.host.displayName} invited you to co-host</div>
              <Link to={`/events/${e.id}`} className="h6 fw-bold d-block mb-0 text-body">{e.title}</Link>
              <small className="text-body-secondary">{formatWhen(e)}</small>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-join btn-sm px-3" disabled={saving} onClick={() => respond({ id: e.id, accept: true })}>Accept</button>
              <button className="btn btn-outline-secondary btn-sm" disabled={saving} onClick={() => respond({ id: e.id, accept: false })}>Decline</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EventList({ scope }: { scope: EventScope }) {
  const { data, isLoading, error, refetch } = useEventsQuery({ scope });
  if (isLoading) return <Skeleton />;
  if (error) {
    return (
      <div className="alert alert-danger d-flex justify-content-between align-items-center">
        <span>{toApiError(error)?.message}</span>
        <button className="btn btn-sm btn-outline-danger" onClick={() => refetch()}>Retry</button>
      </div>
    );
  }
  if (!data?.items.length) return <Empty tab={scope} />;
  return <div className="ev-grid">{data.items.map((e) => <EventCard key={e.id} event={e} />)}</div>;
}

function Skeleton() {
  return (
    <div className="ev-grid placeholder-glow">
      {[1, 2, 3, 4].map((i) => <span key={i} className="placeholder rounded-4" style={{ height: 150 }} />)}
    </div>
  );
}

function Empty({ tab }: { tab: Tab }) {
  return (
    <div className="empty-state rounded-4 p-5 text-center">
      <i className="bi bi-calendar-heart fs-1 text-body-tertiary" />
      <h3 className="h5 fw-semibold mt-2 mb-1">{EMPTY[tab].title}</h3>
      <p className="text-body-secondary mb-0">{EMPTY[tab].text}</p>
    </div>
  );
}

export default function EventsPage() {
  const [tab, setTab] = useState<Tab>('upcoming');
  const canHost = usePermission('EVENT_HOST');

  return (
    <div className="d-grid gap-4">
      <header className="d-flex flex-wrap gap-3 justify-content-between align-items-end">
        <div>
          <h1 className="display-6 mb-1 page-title">Events</h1>
          <p className="text-body-secondary mb-0">Listening parties, sessions and meetups from the community.</p>
        </div>
        {canHost && <Link to="/events/host" className="btn btn-join px-4"><i className="bi bi-plus-lg me-1" /> Host an event</Link>}
      </header>

      <ul className="nav ev-tabs">
        {TABS.map((t) => (
          <li className="nav-item" key={t.key}>
            <button className={`nav-link ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              <i className={`bi bi-${t.icon} me-1`} />{t.label}
            </button>
          </li>
        ))}
      </ul>

      {tab === 'invites' ? <InvitesList /> : <EventList scope={tab} />}
    </div>
  );
}
