import { Link, useNavigate, useParams } from 'react-router-dom';
import Avatar from '@/components/common/Avatar';
import { useAppSelector } from '@/store';
import { useOpenDirectMutation } from '@/store/chatApi';
import { useFollowMutation } from '@/store/homeApi';
import { useProfileQuery } from '@/store/profileApi';
import { toApiError } from '@/utils/errors';
import { LINK_TYPES } from './profileLinks';
import PostComposer from '@/pages/posts/PostComposer';
import PostList from '@/pages/posts/PostList';

/** /profile shows your own profile; /users/:username shows anyone's. */
export default function ProfilePage() {
  const me = useAppSelector((s) => s.auth.session!.user);
  const username = useParams().username ?? me.username;
  const { data: p, isLoading, error, refetch } = useProfileQuery(username);
  const [follow, followState] = useFollowMutation();
  const canChat = useAppSelector((s) => s.auth.session!.permissions.includes('CHAT_USE'));
  const [openDirect, opening] = useOpenDirectMutation();
  const navigate = useNavigate();

  if (isLoading) return <div className="placeholder-glow"><span className="placeholder col-12 rounded-4" style={{ height: 320 }} /></div>;
  if (error || !p) {
    return (
      <div className="empty-state rounded-4 p-5 text-center">
        <i className="bi bi-person-x fs-1 text-body-tertiary" />
        <h1 className="h4 mt-2">{toApiError(error)?.message ?? 'Profile not found'}</h1>
        <Link to="/home" className="btn btn-outline-primary mt-2">Back home</Link>
      </div>
    );
  }

  const links = LINK_TYPES.filter((t) => p.links?.[t.key]);
  const portfolio = p.links?.portfolio;
  const joined = new Date(p.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const toggleFollow = async () => {
    try {
      await follow({ userId: p.id, follow: !p.followedByMe }).unwrap();
      refetch();
    } catch { /* the button simply stays as it was */ }
  };

  const message = async () => {
    try {
      const chat = await openDirect(p.username).unwrap();
      navigate(`/messages/${chat.id}`);
    } catch { /* stays on the profile */ }
  };

  return (
    <div className="d-grid gap-4">
      <section className="profile-card card border-0 shadow-sm overflow-hidden">
        <div className="profile-cover" style={p.coverUrl ? { backgroundImage: `url(${p.coverUrl})` } : undefined} />
        <div className="card-body px-4 pb-4 pt-0">
          <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 profile-head">
            <div className="profile-avatar"><Avatar name={p.displayName} url={p.avatarUrl} size={128} /></div>
            <div className="d-flex gap-2 mb-2">
              {p.me ? (
                <Link to="/profile/edit" className="btn btn-outline-primary"><i className="bi bi-pencil me-1" />Edit profile</Link>
              ) : (
                <button className={`btn ${p.followedByMe ? 'btn-outline-secondary' : 'btn-join'} px-4`} disabled={followState.isLoading} onClick={toggleFollow}>
                  {p.followedByMe ? 'Following' : 'Follow'}
                </button>
              )}
              {!p.me && canChat && (
                <button className="btn btn-outline-secondary" disabled={opening.isLoading} onClick={message}><i className="bi bi-chat-dots me-1" />Message</button>
              )}
              {portfolio && (
                <a href={portfolio} target="_blank" rel="noreferrer" className="btn btn-dark"><i className="bi bi-palette me-1" />Portfolio</a>
              )}
            </div>
          </div>

          <h1 className="page-title display-6 mt-3 mb-0">{p.displayName}</h1>
          <p className="text-body-secondary mb-3">@{p.username} · Joined {joined}</p>

          <div className="d-flex gap-4 mb-3">
            <span><strong>{p.followerCount}</strong> <span className="text-body-secondary">followers</span></span>
            <span><strong>{p.followingCount}</strong> <span className="text-body-secondary">following</span></span>
          </div>

          {p.bio
            ? <p className="lead mb-3" style={{ whiteSpace: 'pre-line', maxWidth: '60ch' }}>{p.bio}</p>
            : p.me && <p className="text-body-secondary">Add a bio so people know what you create. <Link to="/profile/edit">Edit profile</Link></p>}

          {p.interests.length > 0 && (
            <div className="d-flex flex-wrap gap-2 mb-3">
              {p.interests.map((i) => <span key={i} className="badge rounded-pill interest-chip px-3 py-2">{i}</span>)}
            </div>
          )}

          {links.length > 0 && (
            <div className="d-flex flex-wrap gap-2">
              {links.map((t) => (
                <a key={t.key} href={p.links[t.key]} target="_blank" rel="noreferrer"
                   className={`btn btn-sm ${t.key === 'portfolio' ? 'btn-outline-dark' : 'btn-light'}`}>
                  <i className={`bi bi-${t.icon} me-1`} />{t.label}
                </a>
              ))}
            </div>
          )}

          {!p.me && p.profileVisibility !== 'PUBLIC' && !p.bio && (
            <p className="small text-body-secondary mt-3 mb-0"><i className="bi bi-lock me-1" />
              {p.profileVisibility === 'FOLLOWERS' ? 'Follow to see their full profile.' : 'Part of this profile is private.'}
            </p>
          )}
        </div>
      </section>

      <section className="d-grid gap-3">
        <h2 className="h5 fw-bold mb-0">Posts</h2>
        {p.me && <PostComposer />}
        <PostList author={p.username} emptyTitle={p.me ? 'You have not posted yet' : 'No posts yet'}
                  emptyText={p.me ? 'Share your work, a thought or a clip.' : `${p.displayName} has not posted anything yet.`} />
      </section>
    </div>
  );
}
