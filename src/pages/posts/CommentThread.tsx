import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '@/components/common/Avatar';
import { useAddCommentMutation, useCommentsQuery, useDeleteCommentMutation, useEditCommentMutation } from '@/store/postApi';
import type { Comment } from '@/types/api';
import { toApiError } from '@/utils/errors';
import { timeAgo } from './postUtils';

/** Replies deeper than this are shown flat under the last level so narrow screens stay readable. */
const MAX_DEPTH = 6;

function CommentBox({ postId, parentId, onDone, autoFocus, placeholder }: {
  postId: number; parentId?: number; onDone?: () => void; autoFocus?: boolean; placeholder?: string;
}) {
  const [body, setBody] = useState('');
  const [add, { isLoading }] = useAddCommentMutation();
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);
    try {
      await add({ postId, body: body.trim(), parentId }).unwrap();
      setBody('');
      onDone?.();
    } catch (err) {
      setError(toApiError(err as never)?.message ?? 'Could not post your comment');
    }
  };
  return (
    <form onSubmit={submit} className="d-grid gap-2">
      <textarea className="form-control" rows={parentId ? 2 : 3} maxLength={5000} value={body} autoFocus={autoFocus}
                placeholder={placeholder ?? 'What do you think?'} onChange={(e) => setBody(e.target.value)} />
      {error && <small className="text-danger">{error}</small>}
      <div className="d-flex gap-2 justify-content-end">
        {onDone && parentId && <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onDone}>Cancel</button>}
        <button type="submit" className="btn btn-sm btn-join px-3" disabled={isLoading || !body.trim()}>{parentId ? 'Reply' : 'Comment'}</button>
      </div>
    </form>
  );
}

function CommentNode({ comment, children, depth, postId, byParent }: {
  comment: Comment; children: Comment[]; depth: number; postId: number; byParent: Map<number | null, Comment[]>;
}) {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.body ?? '');
  const [collapsed, setCollapsed] = useState(false);
  const [edit] = useEditCommentMutation();
  const [remove] = useDeleteCommentMutation();
  const [error, setError] = useState<string | null>(null);

  const saveEdit = async () => {
    setError(null);
    try {
      await edit({ id: comment.id, postId, body: text }).unwrap();
      setEditing(false);
    } catch (err) {
      setError(toApiError(err as never)?.message ?? 'Could not save');
    }
  };

  const onDelete = async () => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await remove({ id: comment.id, postId }).unwrap();
    } catch (err) {
      setError(toApiError(err as never)?.message ?? 'Could not delete');
    }
  };

  return (
    <div className="comment">
      <div className="comment__head">
        {comment.author ? (
          <Link to={`/users/${comment.author.username}`} className="d-inline-flex align-items-center gap-2 text-reset fw-semibold">
            <Avatar name={comment.author.displayName} url={comment.author.avatarUrl} size={24} />{comment.author.displayName}
          </Link>
        ) : <span className="text-body-secondary fst-italic">[deleted]</span>}
        <span className="text-body-secondary small">· {timeAgo(comment.createdAt)}{comment.editedAt ? ' (edited)' : ''}</span>
        {children.length > 0 && (
          <button type="button" className="btn btn-link btn-sm p-0 ms-auto text-body-secondary" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? `Show ${children.length} repl${children.length === 1 ? 'y' : 'ies'}` : 'Hide'}
          </button>
        )}
      </div>
      <div className="comment__body">
        {editing ? (
          <div className="d-grid gap-2">
            <textarea className="form-control" rows={3} maxLength={5000} value={text} onChange={(e) => setText(e.target.value)} />
            <div className="d-flex gap-2 justify-content-end">
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setEditing(false)}>Cancel</button>
              <button type="button" className="btn btn-sm btn-join px-3" onClick={saveEdit} disabled={!text.trim()}>Save</button>
            </div>
          </div>
        ) : comment.deleted ? (
          <p className="text-body-secondary fst-italic mb-1">This comment was deleted.</p>
        ) : (
          <p className="mb-1" style={{ whiteSpace: 'pre-line' }}>{comment.body}</p>
        )}
        {!comment.deleted && !editing && (
          <div className="post-actions">
            <button type="button" className="post-action" onClick={() => setReplying(!replying)}><i className="bi bi-reply" /> Reply</button>
            {comment.canEdit && <button type="button" className="post-action" onClick={() => setEditing(true)}><i className="bi bi-pencil" /> Edit</button>}
            {comment.canDelete && <button type="button" className="post-action text-danger" onClick={onDelete}><i className="bi bi-trash" /> Delete</button>}
          </div>
        )}
        {error && <small className="text-danger">{error}</small>}
        {replying && <div className="mt-2"><CommentBox postId={postId} parentId={comment.id} autoFocus placeholder={`Reply to ${comment.author?.displayName ?? 'comment'}`} onDone={() => setReplying(false)} /></div>}
      </div>
      {!collapsed && children.length > 0 && (
        <div className={depth < MAX_DEPTH ? 'comment__replies' : ''}>
          {children.map((c) => (
            <CommentNode key={c.id} comment={c} children={byParent.get(c.id) ?? []} depth={depth + 1} postId={postId} byParent={byParent} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentThread({ postId }: { postId: number }) {
  const { data, isLoading, error } = useCommentsQuery(postId);
  const byParent = useMemo(() => {
    const map = new Map<number | null, Comment[]>();
    for (const c of data ?? []) {
      const list = map.get(c.parentId) ?? [];
      list.push(c);
      map.set(c.parentId, list);
    }
    return map;
  }, [data]);

  return (
    <section className="card border-0 shadow-sm">
      <div className="card-body p-3 p-md-4 d-grid gap-3">
        <CommentBox postId={postId} />
        {isLoading && <div className="placeholder-glow"><span className="placeholder col-12 rounded-3" style={{ height: 60 }} /></div>}
        {error && <div className="alert alert-danger mb-0">{toApiError(error)?.message}</div>}
        {data && data.length === 0 && <p className="text-body-secondary text-center mb-0">No comments yet. Start the conversation.</p>}
        {(byParent.get(null) ?? []).map((c) => (
          <CommentNode key={c.id} comment={c} children={byParent.get(c.id) ?? []} depth={1} postId={postId} byParent={byParent} />
        ))}
      </div>
    </section>
  );
}
