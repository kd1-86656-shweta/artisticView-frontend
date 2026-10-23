import { useState } from 'react';
import { usePostsQuery, type PostListArgs } from '@/store/postApi';
import type { Post, PostSort } from '@/types/api';
import { toApiError } from '@/utils/errors';
import PostCard from './PostCard';

const SORTS: { key: PostSort; label: string; icon: string }[] = [
  { key: 'hot', label: 'Hot', icon: 'fire' },
  { key: 'new', label: 'New', icon: 'stars' },
  { key: 'top', label: 'Top', icon: 'bar-chart' },
];

/** One page of posts; "Load more" renders the next page below it. */
function Page({ args, showCommunity, last, onMore }: { args: PostListArgs; showCommunity: boolean; last: boolean; onMore: (cursor: string) => void }) {
  const { data, isLoading, error } = usePostsQuery(args);
  if (isLoading) return <div className="placeholder-glow d-grid gap-3">{[1, 2].map((i) => <span key={i} className="placeholder rounded-4" style={{ height: 140 }} />)}</div>;
  if (error) return <div className="alert alert-danger">{toApiError(error)?.message}</div>;
  return (
    <>
      {data?.items.map((p: Post) => <PostCard key={p.id} post={p} showCommunity={showCommunity} />)}
      {last && data?.nextCursor && (
        <button type="button" className="btn btn-outline-secondary" onClick={() => onMore(data.nextCursor!)}>Load more</button>
      )}
    </>
  );
}

interface PostListProps {
  community?: string;
  author?: string;
  emptyTitle: string;
  emptyText: string;
}

export default function PostList({ community, author, emptyTitle, emptyText }: PostListProps) {
  const [sort, setSort] = useState<PostSort>('hot');
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const first = usePostsQuery({ community, author, sort });

  const changeSort = (s: PostSort) => {
    setSort(s);
    setCursors([undefined]);
  };

  return (
    <div className="d-grid gap-3">
      <div className="sort-bar">
        {SORTS.map((s) => (
          <button key={s.key} type="button" className={sort === s.key ? 'is-on' : ''} onClick={() => changeSort(s.key)}>
            <i className={`bi bi-${s.icon} me-1`} />{s.label}
          </button>
        ))}
      </div>
      {first.data && first.data.items.length === 0 ? (
        <div className="empty-state rounded-4 p-5 text-center">
          <i className="bi bi-chat-square-heart fs-1 text-body-tertiary" />
          <h3 className="h5 fw-semibold mt-2 mb-1">{emptyTitle}</h3>
          <p className="text-body-secondary mb-0">{emptyText}</p>
        </div>
      ) : (
        cursors.map((cursor, i) => (
          <Page key={`${sort}-${cursor ?? 'first'}`} args={{ community, author, sort, cursor }} showCommunity={!community}
                last={i === cursors.length - 1} onMore={(next) => setCursors([...cursors, next])} />
        ))
      )}
    </div>
  );
}
