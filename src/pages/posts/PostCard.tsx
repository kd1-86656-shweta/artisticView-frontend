import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from '@/components/common/Avatar';
import { useDeletePostMutation, useVoteMutation } from '@/store/postApi';
import type { Post } from '@/types/api';
import { toApiError } from '@/utils/errors';
import { compact, timeAgo } from './postUtils';

/** Up / down arrows and the score. Clicking your current vote again clears it, like Reddit. */
export function VoteButtons({ post, vertical = true }: { post: Post; vertical?: boolean }) {
  const [vote, { isLoading }] = useVoteMutation();
  const [error, setError] = useState(false);
  const cast = async (value: -1 | 1) => {
    setError(false);
    try {
      await vote({ id: post.id, value: post.myVote === value ? 0 : value }).unwrap();
    } catch {
      setError(true);
    }
  };
  return (
    <div className={`vote ${vertical ? 'vote--vertical' : ''}`} title={error ? 'Could not save your vote' : undefined}>
      <button type="button" className={`vote__btn vote__btn--up ${post.myVote === 1 ? 'is-on' : ''}`} disabled={isLoading}
              onClick={(e) => { e.preventDefault(); cast(1); }} aria-label="Upvote" aria-pressed={post.myVote === 1}>
        <i className="bi bi-arrow-up-circle-fill" />
      </button>
      <span className={`vote__score ${post.myVote === 1 ? 'is-up' : post.myVote === -1 ? 'is-down' : ''}`}>{compact(post.score)}</span>
      <button type="button" className={`vote__btn vote__btn--down ${post.myVote === -1 ? 'is-on' : ''}`} disabled={isLoading}
              onClick={(e) => { e.preventDefault(); cast(-1); }} aria-label="Downvote" aria-pressed={post.myVote === -1}>
        <i className="bi bi-arrow-down-circle-fill" />
      </button>
    </div>
  );
}

export function PostMeta({ post, showCommunity = true }: { post: Post; showCommunity?: boolean }) {
  return (
    <div className="post-meta">
      {showCommunity && post.community && (
        <><Link to={`/c/${post.community.slug}`} className="post-meta__community">c/{post.community.slug}</Link><span>·</span></>
      )}
      <Link to={`/users/${post.author.username}`} className="d-inline-flex align-items-center gap-1 text-reset">
        <Avatar name={post.author.displayName} url={post.author.avatarUrl} size={20} />{post.author.displayName}
      </Link>
      <span>·</span>
      <span title={new Date(post.createdAt).toLocaleString()}>{timeAgo(post.createdAt)}</span>
      {post.editedAt && <span className="fst-italic">(edited)</span>}
    </div>
  );
}

export function PostMedia({ post }: { post: Post }) {
  if (post.videoUrl) {
    return <video className="post-media" src={post.videoUrl} controls preload="metadata" playsInline />;
  }
  if (post.imageUrl) {
    return <img className="post-media" src={post.imageUrl} alt="" loading="lazy" />;
  }
  return null;
}

/** A post in a list. The whole card opens the post; votes, links and the menu work on their own. */
export default function PostCard({ post, showCommunity = true }: { post: Post; showCommunity?: boolean }) {
  const navigate = useNavigate();
  const [deletePost] = useDeletePostMutation();
  const [error, setError] = useState<string | null>(null);

  const onDelete = async () => {
    if (!window.confirm('Delete this post? Its comments will be removed too.')) return;
    try {
      await deletePost(post.id).unwrap();
    } catch (err) {
      setError(toApiError(err as never)?.message ?? 'Could not delete');
    }
  };

  return (
    <article className="post-card" onClick={() => navigate(`/posts/${post.id}`)} role="link" tabIndex={0}
             onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/posts/${post.id}`); }}>
      <VoteButtons post={post} />
      <div className="post-card__main" onClick={(e) => (e.target as HTMLElement).closest('a,button,video') && e.stopPropagation()}>
        <PostMeta post={post} showCommunity={showCommunity} />
        <h3 className="post-card__title">{post.title}</h3>
        {post.body && <p className="post-card__body">{post.body}</p>}
        <PostMedia post={post} />
        <div className="post-actions">
          <Link to={`/posts/${post.id}`} className="post-action"><i className="bi bi-chat" /> {post.commentCount} comment{post.commentCount === 1 ? '' : 's'}</Link>
          {post.canEdit && <Link to={`/posts/${post.id}?edit=1`} className="post-action"><i className="bi bi-pencil" /> Edit</Link>}
          {post.canDelete && <button type="button" className="post-action text-danger" onClick={onDelete}><i className="bi bi-trash" /> Delete</button>}
          {error && <small className="text-danger">{error}</small>}
        </div>
      </div>
    </article>
  );
}
