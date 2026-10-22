import { Link } from 'react-router-dom';
import { APP_NAME } from '@/config/app';

/** Gradient eye mark + wordmark; the trailing "View" picks up the same rainbow as the mark. */
export default function Logo({ to = '/', light = false }: { to?: string; light?: boolean }) {
  const [, head = APP_NAME, tail = ''] = APP_NAME.match(/^(.*?)(View)$/) ?? [];
  return (
    <Link to={to} className={`brand-logo d-inline-flex align-items-center gap-2 text-decoration-none ${light ? 'text-white' : 'text-body'}`}>
      <img src="/favicon.svg" alt="" width={36} height={36} className="brand-logo__mark" />
      <span className="fw-bold fs-5 brand-wordmark">
        {head}{tail && <span className="brand-wordmark__accent">{tail}</span>}
      </span>
    </Link>
  );
}
