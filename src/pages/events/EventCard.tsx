import { Link } from 'react-router-dom';
import Avatar from '@/components/common/Avatar';
import type { EventItem } from '@/types/api';
import { formatDay, formatTime, relativeStart } from './eventUtils';

/** Ticket-style card: a date stub on the left, details on the right. */
export default function EventCard({ event }: { event: EventItem }) {
  const start = new Date(event.startsAt);
  const coHosts = event.collaborators.filter((c) => c.status === 'ACCEPTED');
  return (
    <Link to={`/events/${event.id}`} className="ev-card text-decoration-none">
      <div className="ev-card__stub">
        <span className="ev-card__month">{start.toLocaleString(undefined, { month: 'short' })}</span>
        <span className="ev-card__day">{start.getDate()}</span>
        <span className="ev-card__time">{formatTime(event.startsAt)}</span>
      </div>
      <div className="ev-card__body">
        <div className="d-flex flex-wrap gap-2 mb-1">
          {event.promoted && <span className="ev-badge ev-badge--featured"><i className="bi bi-stars" /> Featured</span>}
          <span className="ev-badge">{relativeStart(event)}</span>
          {event.category && <span className="ev-badge ev-badge--soft">{event.category}</span>}
        </div>
        <h3 className="ev-card__title">{event.title}</h3>
        <p className="ev-card__meta">
          <i className={`bi bi-${event.locationType === 'ONLINE' ? 'camera-video' : 'geo-alt'}`} />
          {event.locationType === 'ONLINE' ? 'Online' : event.location}
          <span className="mx-1">·</span>{formatDay(event.startsAt)}
        </p>
        <div className="d-flex align-items-center justify-content-between">
          <span className="d-flex align-items-center gap-2 small text-body-secondary">
            <Avatar name={event.host.displayName} url={event.host.avatarUrl} size={24} />
            {event.host.displayName}{coHosts.length > 0 && ` + ${coHosts.length} co-host${coHosts.length > 1 ? 's' : ''}`}
          </span>
          <span className="small fw-semibold">
            {event.going && <span className="text-success me-2"><i className="bi bi-check-circle-fill" /> Going</span>}
            <i className="bi bi-people me-1" />{event.rsvpCount}{event.capacity ? `/${event.capacity}` : ''}
          </span>
        </div>
      </div>
    </Link>
  );
}
