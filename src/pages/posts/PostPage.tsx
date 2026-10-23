import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDeletePostMutation, usePostQuery } from '@/store/postApi';
import { toApiError } from '@/utils/errors';
import CommentThread from './CommentThread';
import { PostMedia, PostMeta, VoteButtons } from './PostCard';
import PostComposer from './PostComposer';

/** A single post with its comments. ?edit=1 opens it in edit mode (the author's "Edit" link). */
export default function PostPage() {
  const id = Number(useParams().id);
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: post, isLoading, error } = usePostQuery(id);
  const [deletePost] = useDeletePostMutation();
  const editing = params.get('edit') === '1' && post?.canEdit;

  if (isLoading) return <div className="placeholder-glow"><span className="placeholder col-12 rounded-4" style={{ height: 300 }} /></div>;
  if (error || !post) {
    return (
      <div className="empty-state rounded-4 p-5 text-center">
        <i className="bi bi-file-earmark-x fs-1 text-body-tertiary" />
        <h1 className="h4 mt-2">{toApiError(error)?.message ?? 'Post not found'}</h1>
        <Link to="/communities" className="btn btn-outline-primary mt-2">Browse communities</Link>
      </div>
    );
  }

  const onDelete = async () => {
    if (!window.confirm('Delete this post? Its comments will be removed too.')) return;
    await deletePost(post.id).unwrap();
    navigate(post.community ? `/c/${post.community.slug}` : '/profile', { replace: true });
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-9 d-grid gap-3">
        <Link to={post.community ? `/c/${post.community.slug}` : `/users/${post.author.username}`} className="small text-body-secondary">
          <i className="bi bi-arrow-left me-1" />{post.community ? `c/${post.community.slug}` : post.author.displayName}
        </Link>

        {editing ? (
          <PostComposer editing={post} onDone={() => setParams({})} onCancel={() => setParams({})} />
        ) : (
          <article className="post-card post-card--full">
            <VoteButtons post={post} />
            <div className="post-card__main">
              <PostMeta post={post} />
              <h1 className="post-card__title post-card__title--full">{post.title}</h1>
              {post.body && <p className="post-card__body post-card__body--full">{post.body}</p>}
              <PostMedia post={post} />
              <div className="post-actions">
                <span className="post-action"><i className="bi bi-chat" /> {post.commentCount} comment{post.commentCount === 1 ? '' : 's'}</span>
                {post.canEdit && <button type="button" className="post-action" onClick={() => setParams({ edit: '1' })}><i className="bi bi-pencil" /> Edit</button>}
                {post.canDelete && <button type="button" className="post-action text-danger" onClick={onDelete}><i className="bi bi-trash" /> Delete</button>}
              </div>
            </div>
          </article>
        )}

        <CommentThread postId={post.id} />
      </div>
    </div>
  );
}
