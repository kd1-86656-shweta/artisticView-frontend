import { Link } from 'react-router-dom';

interface DiscoverSectionProps {
  icon: string;
  title: string;
  emptyTitle: string;
  emptyText: string;
  live?: boolean;
  action?: { label: string; to: string };
}

/** A Discover row. Until rooms/events/communities exist it shows a friendly empty state. */
export default function DiscoverSection({ icon, title, emptyTitle, emptyText, live, action }: DiscoverSectionProps) {
  return (
    <section className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h5 fw-bold mb-0 d-flex align-items-center gap-2">
            {live ? <span className="live-dot" /> : <i className={`bi bi-${icon} text-primary`} />}
            {title}
          </h2>
          {action && <Link to={action.to} className="btn btn-sm btn-outline-primary">{action.label}</Link>}
        </div>
        <div className="empty-state rounded-3 p-4 text-center">
          <i className={`bi bi-${icon} fs-2 text-body-tertiary`} />
          <h3 className="h6 fw-semibold mt-2 mb-1">{emptyTitle}</h3>
          <p className="text-body-secondary small mb-0">{emptyText}</p>
        </div>
      </div>
    </section>
  );
}
