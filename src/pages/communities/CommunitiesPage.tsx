import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePermission } from '@/features/auth/permissions';
import { useCommunitiesQuery, type CommunityScope } from '@/store/communityApi';
import { toApiError } from '@/utils/errors';
import CommunityTile from './CommunityTile';

const TABS: { key: CommunityScope; label: string; icon: string }[] = [
  { key: 'discover', label: 'Discover', icon: 'compass' },
  { key: 'mine', label: 'My communities', icon: 'people' },
  { key: 'invites', label: 'Invites', icon: 'envelope-heart' },
];

const EMPTY: Record<CommunityScope, [string, string]> = {
  discover: ['No communities yet', 'Start the first one and invite your people.'],
  mine: ['You have not joined any communities', 'Discover communities that match what you love, or start your own.'],
  invites: ['No invites', 'When someone adds you to a community, the invite shows up here.'],
};

export default function CommunitiesPage() {
  const [tab, setTab] = useState<CommunityScope>('discover');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const canCreate = usePermission('COMMUNITY_CREATE');
  const { data, isLoading, error } = useCommunitiesQuery({ scope: tab, q: tab === 'discover' ? q : undefined });

  // Search as you type, but not on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="d-grid gap-4">
      <header className="d-flex flex-wrap gap-3 justify-content-between align-items-end">
        <div>
          <h1 className="display-6 mb-1 page-title">Communities</h1>
          <p className="text-body-secondary mb-0">Spaces built around what you love. Post, vote and talk with your people.</p>
        </div>
        {canCreate && <Link to="/communities/new" className="btn btn-join px-4"><i className="bi bi-plus-lg me-1" /> Create community</Link>}
      </header>

      <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between">
        <ul className="nav ev-tabs flex-grow-1">
          {TABS.map((t) => (
            <li className="nav-item" key={t.key}>
              <button className={`nav-link ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}><i className={`bi bi-${t.icon} me-1`} />{t.label}</button>
            </li>
          ))}
        </ul>
        {tab === 'discover' && (
          <div className="input-group" style={{ maxWidth: 320 }}>
            <span className="input-group-text"><i className="bi bi-search" /></span>
            <input className="form-control" placeholder="Search communities" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        )}
      </div>

      {isLoading && <div className="community-grid placeholder-glow">{[1, 2, 3].map((i) => <span key={i} className="placeholder rounded-4" style={{ height: 220 }} />)}</div>}
      {error && <div className="alert alert-danger">{toApiError(error)?.message}</div>}
      {data && data.length === 0 && (
        <div className="empty-state rounded-4 p-5 text-center">
          <i className="bi bi-collection fs-1 text-body-tertiary" />
          <h3 className="h5 fw-semibold mt-2 mb-1">{q && tab === 'discover' ? `No communities match "${q}"` : EMPTY[tab][0]}</h3>
          <p className="text-body-secondary mb-0">{EMPTY[tab][1]}</p>
        </div>
      )}
      {data && data.length > 0 && <div className="community-grid">{data.map((c) => <CommunityTile key={c.id} community={c} />)}</div>}
    </div>
  );
}
