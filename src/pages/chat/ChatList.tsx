import { useState, type FormEvent } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Avatar from '@/components/common/Avatar';
import { useChatSocket } from '@/features/chat/ChatSocketProvider';
import { useAppSelector } from '@/store';
import { useLazyCheckUsernameQuery } from '@/store/authApi';
import { useChatsQuery, useCreateGroupMutation, useOpenDirectMutation } from '@/store/chatApi';
import { toApiError } from '@/utils/errors';
import { listTime, preview } from './chatUtils';

/** "New chat" panel: one person, or a named group of several. */
function NewChat({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'direct' | 'group'>('direct');
  const [username, setUsername] = useState('');
  const [title, setTitle] = useState('');
  const [people, setPeople] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [check] = useLazyCheckUsernameQuery();
  const [openDirect, opening] = useOpenDirectMutation();
  const [createGroup, creating] = useCreateGroupMutation();

  const clean = (s: string) => s.trim().replace(/^@/, '').toLowerCase();

  const addPerson = async () => {
    const name = clean(username);
    setError(null);
    if (!name || people.includes(name)) return setUsername('');
    try {
      if ((await check(name).unwrap()).available) return setError(`No member called @${name}`);
      setPeople([...people, name]);
      setUsername('');
    } catch {
      setError('Could not check that username');
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (mode === 'direct') {
        if (!clean(username)) return;
        const chat = await openDirect(clean(username)).unwrap();
        navigate(`/messages/${chat.id}`);
      } else {
        if (!title.trim()) return setError('Give the group a name');
        if (!people.length) return setError('Add at least one person');
        const chat = await createGroup({ title: title.trim(), usernames: people }).unwrap();
        navigate(`/messages/${chat.id}`);
      }
      onClose();
    } catch (err) {
      setError(toApiError(err as never)?.message ?? 'Something went wrong');
    }
  };

  return (
    <form className="chat-new" onSubmit={submit}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="ev-segmented">
          <button type="button" className={mode === 'direct' ? 'is-on' : ''} onClick={() => setMode('direct')}><i className="bi bi-person me-1" />Person</button>
          <button type="button" className={mode === 'group' ? 'is-on' : ''} onClick={() => setMode('group')}><i className="bi bi-people me-1" />Group</button>
        </div>
        <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
      </div>
      {mode === 'group' && (
        <input className="form-control mb-2" placeholder="Group name" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      )}
      <div className="input-group mb-2">
        <span className="input-group-text">@</span>
        <input className="form-control" placeholder="username" value={username} autoFocus={mode === 'direct'}
               onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
               onKeyDown={(e) => { if (mode === 'group' && e.key === 'Enter') { e.preventDefault(); addPerson(); } }} />
        {mode === 'group' && <button type="button" className="btn btn-outline-secondary" onClick={addPerson}>Add</button>}
      </div>
      {mode === 'group' && people.length > 0 && (
        <div className="d-flex flex-wrap gap-1 mb-2">
          {people.map((p) => (
            <span key={p} className="badge rounded-pill interest-chip px-3 py-2">@{p}
              <button type="button" className="btn-close ms-2" style={{ fontSize: '0.5rem' }} aria-label={`Remove ${p}`} onClick={() => setPeople(people.filter((x) => x !== p))} />
            </span>
          ))}
        </div>
      )}
      {error && <div className="small text-danger mb-2">{error}</div>}
      <button className="btn btn-join w-100" disabled={opening.isLoading || creating.isLoading}>
        {mode === 'direct' ? 'Start chat' : 'Create group'}
      </button>
    </form>
  );
}

export default function ChatList() {
  const myId = useAppSelector((s) => s.auth.session!.user.id);
  const { data: chats, isLoading } = useChatsQuery();
  const { typing, connected } = useChatSocket();
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const shown = chats?.filter((c) => c.title.toLowerCase().includes(search.trim().toLowerCase())) ?? [];

  return (
    <aside className="chat-list">
      <div className="chat-list__head">
        <h1 className="h4 page-title mb-0">Messages</h1>
        <span className={`chat-conn ${connected ? 'is-on' : ''}`} title={connected ? 'Live' : 'Reconnecting…'} />
        <button className="btn btn-sm btn-join ms-auto" onClick={() => setCreating(!creating)} aria-label="New chat"><i className="bi bi-pencil-square" /></button>
      </div>
      {creating && <NewChat onClose={() => setCreating(false)} />}
      <div className="px-3 pb-2">
        <input className="form-control form-control-sm" placeholder="Search chats" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="chat-list__items">
        {isLoading && <div className="p-3 placeholder-glow">{[1, 2, 3].map((i) => <span key={i} className="placeholder col-12 rounded-3 mb-2" style={{ height: 52 }} />)}</div>}
        {chats && chats.length === 0 && !creating && (
          <div className="p-4 text-center text-body-secondary small">
            No chats yet.<br />
            <button className="btn btn-link btn-sm" onClick={() => setCreating(true)}>Start one</button>
          </div>
        )}
        {shown.map((c) => {
          const other = c.type === 'DIRECT' ? c.members.find((m) => m.user.id !== myId) : null;
          const someoneTyping = (typing[c.id] ?? []).length > 0;
          return (
            <NavLink key={c.id} to={`/messages/${c.id}`} className="chat-item">
              <span className="position-relative">
                {c.type === 'GROUP' && !c.avatarUrl
                  ? <span className="chat-group-avatar"><i className="bi bi-people-fill" /></span>
                  : <Avatar name={c.title} url={c.avatarUrl} size={46} />}
                {other?.online && <span className="online-dot" />}
              </span>
              <span className="chat-item__text">
                <span className="d-flex justify-content-between gap-2">
                  <strong className="text-truncate">{c.title}</strong>
                  {c.lastMessage && <small className={c.unreadCount ? 'text-success fw-semibold' : 'text-body-secondary'}>{listTime(c.lastMessage.createdAt)}</small>}
                </span>
                <span className="d-flex justify-content-between gap-2">
                  <small className={`text-truncate ${someoneTyping ? 'text-success fst-italic' : 'text-body-secondary'}`}>
                    {someoneTyping ? 'typing…' : preview(c.lastMessage, myId)}
                  </small>
                  {c.unreadCount > 0 && <span className="chat-unread">{c.unreadCount > 99 ? '99+' : c.unreadCount}</span>}
                </span>
              </span>
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
}
