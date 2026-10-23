import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Avatar from '@/components/common/Avatar';
import { useCommunityQuery, useMembersQuery, useSetMembershipMutation } from '@/store/communityApi';
import { toApiError } from '@/utils/errors';
import PostComposer from '@/pages/posts/PostComposer';
import PostList from '@/pages/posts/PostList';

export default function CommunityPage() {
  const slug = useParams().slug!;
  const { data: c, isLoading, error } = useCommunityQuery(slug);
  const member = c?.myStatus === 'ACTIVE';
  const canRead = c && (c.visibility === 'PUBLIC' || member);
  const { data: members } = useMembersQuery(slug, { skip: !canRead });
  const [setMembership, joining] = useSetMembershipMutation();
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading) return <div className="placeholder-glow"><span className="placeholder col-12 rounded-4" style={{ height: 260 }} /></div>;
  if (error || !c) {
    return (
      <div className="empty-state rounded-4 p-5 text-center">
        <i className="bi bi-collection fs-1 text-body-tertiary" />
        <h1 className="h4 mt-2">{toApiError(error)?.message ?? 'Community not found'}</h1>
        <Link to="/communities" className="btn btn-outline-primary mt-2">Browse communities</Link>
      </div>
    );
  }

  const toggle = async (join: boolean) => {
    setActionError(null);
    if (!join && !window.confirm(c.myStatus === 'INVITED' ? 'Decline this invite?' : `Leave c/${c.slug}?`)) return;
    try {
      await setMembership({ slug, join }).unwrap();
    } catch (err) {
      setActionError(toApiError(err as never)?.message ?? 'Something went wrong');
    }
  };

  const moderators = members?.filter((m) => m.status === 'ACTIVE' && m.role !== 'MEMBER') ?? [];

  return (
    <div className="d-grid gap-4">
      <section className="card border-0 shadow-sm overflow-hidden">
        <div className="profile-cover" style={c.coverUrl ? { backgroundImage: `url(${c.coverUrl})` } : undefined} />
        <div className="card-body px-4 py-3 d-flex flex-wrap gap-3 align-items-center justify-content-between">
          <div>
            <h1 className="page-title h2 mb-0">{c.name}</h1>
            <div className="text-body-secondary">
              c/{c.slug} · {c.memberCount} member{c.memberCount === 1 ? '' : 's'}
              {c.visibility === 'PRIVATE' && <span className="ms-2 badge text-bg-light border"><i className="bi bi-lock me-1" />Private</span>}
            </div>
          </div>
          <div className="d-flex gap-2">
            {c.canModerate && <Link to={`/c/${slug}/manage`} className="btn btn-outline-primary"><i className="bi bi-gear me-1" />Manage</Link>}
            {c.myStatus === 'INVITED' && (
              <>
                <button className="btn btn-join px-4" disabled={joining.isLoading} onClick={() => toggle(true)}>Accept invite</button>
                <button className="btn btn-outline-secondary" disabled={joining.isLoading} onClick={() => toggle(false)}>Decline</button>
              </>
            )}
            {member && c.myRole !== 'OWNER' && <button className="btn btn-outline-secondary" disabled={joining.isLoading} onClick={() => toggle(false)}>Joined · Leave</button>}
            {!c.myStatus && c.visibility === 'PUBLIC' && <button className="btn btn-join px-4" disabled={joining.isLoading} onClick={() => toggle(true)}>Join</button>}
          </div>
        </div>
      </section>
      {actionError && <div className="alert alert-danger mb-0">{actionError}</div>}

      <div className="row g-4">
        <div className="col-lg-8 d-grid gap-3 align-content-start">
          {!canRead ? (
            <div className="empty-state rounded-4 p-5 text-center">
              <i className="bi bi-lock fs-1 text-body-tertiary" />
              <h3 className="h5 fw-semibold mt-2 mb-1">This community is private</h3>
              <p className="text-body-secondary mb-0">Only members can see its posts. Ask a moderator to add you.</p>
            </div>
          ) : (
            <>
              {member && <PostComposer communitySlug={slug} />}
              <PostList community={slug} emptyTitle="No posts yet"
                        emptyText={member ? 'Be the first to post something.' : 'Join to start posting.'} />
            </>
          )}
        </div>

        <aside className="col-lg-4 d-grid gap-3 align-content-start">
          <section className="card border-0 shadow-sm"><div className="card-body">
            <h2 className="h6 fw-bold">About</h2>
            <p className="small mb-2" style={{ whiteSpace: 'pre-line' }}>{c.description ?? 'No description yet.'}</p>
            <div className="d-flex gap-4 small">
              <span><strong>{c.memberCount}</strong> members</span>
              <span><strong>{c.postCount}</strong> posts</span>
            </div>
            <div className="small text-body-secondary mt-2">Created {new Date(c.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div></section>
          {c.rules && (
            <section className="card border-0 shadow-sm"><div className="card-body">
              <h2 className="h6 fw-bold">Rules</h2>
              <p className="small mb-0" style={{ whiteSpace: 'pre-line' }}>{c.rules}</p>
            </div></section>
          )}
          {moderators.length > 0 && (
            <section className="card border-0 shadow-sm"><div className="card-body d-grid gap-2">
              <h2 className="h6 fw-bold mb-1">Moderators</h2>
              {moderators.map((m) => (
                <Link key={m.user.id} to={`/users/${m.user.username}`} className="d-flex align-items-center gap-2 text-reset">
                  <Avatar name={m.user.displayName} url={m.user.avatarUrl} size={28} />
                  <span className="small"><strong>{m.user.displayName}</strong> · {m.role === 'OWNER' ? 'Owner' : 'Moderator'}</span>
                </Link>
              ))}
            </div></section>
          )}
        </aside>
      </div>
    </div>
  );
}
