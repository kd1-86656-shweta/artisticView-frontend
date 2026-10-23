import { Link } from 'react-router-dom';
import { useSetMembershipMutation } from '@/store/communityApi';
import type { Community } from '@/types/api';

/** Community card for lists: cover strip, name, description, counts and a join / accept button. */
export default function CommunityTile({ community: c }: { community: Community }) {
  const [setMembership, { isLoading }] = useSetMembershipMutation();
  const member = c.myStatus === 'ACTIVE';
  const invited = c.myStatus === 'INVITED';
  return (
    <div className="community-tile">
      <Link to={`/c/${c.slug}`} className="community-tile__cover" style={c.coverUrl ? { backgroundImage: `url(${c.coverUrl})` } : undefined} aria-label={c.name} />
      <div className="community-tile__body">
        <div className="d-flex align-items-start gap-2">
          <div className="flex-grow-1 min-w-0">
            <Link to={`/c/${c.slug}`} className="community-tile__name">{c.name}</Link>
            <div className="small text-body-secondary">c/{c.slug} · {c.memberCount} member{c.memberCount === 1 ? '' : 's'} · {c.postCount} post{c.postCount === 1 ? '' : 's'}</div>
          </div>
          {c.visibility === 'PRIVATE' && <span className="badge text-bg-light border"><i className="bi bi-lock me-1" />Private</span>}
        </div>
        {c.description && <p className="community-tile__desc">{c.description}</p>}
        <div className="mt-auto d-flex gap-2">
          {member ? (
            <Link to={`/c/${c.slug}`} className="btn btn-sm btn-outline-secondary">{c.myRole === 'OWNER' ? 'Owner' : c.myRole === 'MODERATOR' ? 'Moderator' : 'Joined'}</Link>
          ) : invited ? (
            <>
              <button className="btn btn-sm btn-join px-3" disabled={isLoading} onClick={() => setMembership({ slug: c.slug, join: true })}>Accept invite</button>
              <button className="btn btn-sm btn-outline-secondary" disabled={isLoading} onClick={() => setMembership({ slug: c.slug, join: false })}>Decline</button>
            </>
          ) : c.visibility === 'PUBLIC' ? (
            <button className="btn btn-sm btn-join px-3" disabled={isLoading} onClick={() => setMembership({ slug: c.slug, join: true })}>Join</button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
