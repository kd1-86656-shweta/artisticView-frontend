import { Link, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store';

/** Menu entries come from the backend; the screens behind most of them are still being built. */
export default function ComingSoonPage() {
  const { pathname } = useLocation();
  const feature = useAppSelector((s) =>
    s.auth.session?.features.find((f) => pathname === f.route || pathname.startsWith(f.route + '/')),
  );
  return (
    <div className="text-center py-5">
      <div className="feature-icon mx-auto mb-3"><i className={`bi bi-${feature?.icon ?? 'hourglass-split'}`} /></div>
      <h1 className="h3 fw-bold">{feature?.displayName ?? 'Coming soon'}</h1>
      <p className="text-body-secondary mx-auto" style={{ maxWidth: 480 }}>
        {feature?.description ?? 'This page is not ready yet.'} This area is on the way.
      </p>
      {feature && feature.subFeatures.length > 0 && (
        <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
          {feature.subFeatures.map((sf) => (
            <span key={sf.id} className="badge rounded-pill text-bg-light border px-3 py-2">
              {sf.displayName}
              <span className="ms-2 text-body-secondary">
                {[sf.canRead && 'read', sf.canWrite && 'write', sf.canDelete && 'delete'].filter(Boolean).join(' · ')}
              </span>
            </span>
          ))}
        </div>
      )}
      <Link to="/home" className="btn btn-primary">Back home</Link>
    </div>
  );
}
