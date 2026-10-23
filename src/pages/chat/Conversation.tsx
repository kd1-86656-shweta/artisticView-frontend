import { Fragment, useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from '@/components/common/Avatar';
import { useChatSocket } from '@/features/chat/ChatSocketProvider';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  chatApi,
  useAddChatMemberMutation,
  useChatQuery,
  useDeleteMessageMutation,
  useLazyOlderMessagesQuery,
  useMarkReadMutation,
  useMessagesQuery,
  useRemoveChatMemberMutation,
  useSendMessageMutation,
  useUpdateGroupMutation,
} from '@/store/chatApi';
import { useUploadImageMutation } from '@/store/profileApi';
import type { Chat, ChatMessage } from '@/types/api';
import { toApiError } from '@/utils/errors';
import { dayLabel, messageTime, readByAll } from './chatUtils';

const PAGE = 40;

function GroupInfo({ chat, onClose }: { chat: Chat; onClose: () => void }) {
  const myId = useAppSelector((s) => s.auth.session!.user.id);
  const navigate = useNavigate();
  const admin = chat.myRole === 'ADMIN';
  const [title, setTitle] = useState(chat.title);
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [update] = useUpdateGroupMutation();
  const [add, adding] = useAddChatMemberMutation();
  const [remove] = useRemoveChatMemberMutation();

  const run = async (fn: () => Promise<unknown>) => {
    setError(null);
    try { await fn(); } catch (err) { setError(toApiError(err as never)?.message ?? 'Something went wrong'); }
  };

  return (
    <aside className="chat-info">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h6 fw-bold mb-0">Group info</h2>
        <button className="btn-close" aria-label="Close" onClick={onClose} />
      </div>
      {error && <div className="alert alert-danger py-2 small">{error}</div>}
      {admin ? (
        <form className="input-group input-group-sm mb-3" onSubmit={(e) => { e.preventDefault(); run(() => update({ id: chat.id, title: title.trim() }).unwrap()); }}>
          <input className="form-control" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} aria-label="Group name" />
          <button className="btn btn-outline-secondary" disabled={!title.trim() || title.trim() === chat.title}>Rename</button>
        </form>
      ) : <p className="fw-semibold">{chat.title}</p>}

      <div className="small text-body-secondary mb-2">{chat.members.length} members</div>
      <div className="d-grid gap-2 mb-3">
        {chat.members.map((m) => (
          <div key={m.user.id} className="d-flex align-items-center gap-2">
            <span className="position-relative"><Avatar name={m.user.displayName} url={m.user.avatarUrl} size={32} />{m.online && <span className="online-dot online-dot--sm" />}</span>
            <Link to={`/users/${m.user.username}`} className="flex-grow-1 text-reset small text-truncate">
              {m.user.id === myId ? 'You' : m.user.displayName}
            </Link>
            {m.role === 'ADMIN' && <span className="badge text-bg-light border">Admin</span>}
            {admin && m.user.id !== myId && (
              <button className="btn btn-sm btn-link text-danger p-0" onClick={() => window.confirm(`Remove ${m.user.displayName}?`) && run(() => remove({ id: chat.id, userId: m.user.id }).unwrap())}>Remove</button>
            )}
          </div>
        ))}
      </div>
      {admin && (
        <form className="input-group input-group-sm mb-3" onSubmit={(e) => { e.preventDefault(); if (username.trim()) run(async () => { await add({ id: chat.id, username: username.trim().replace(/^@/, '') }).unwrap(); setUsername(''); }); }}>
          <span className="input-group-text">@</span>
          <input className="form-control" placeholder="Add someone" value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))} />
          <button className="btn btn-outline-secondary" disabled={adding.isLoading}>Add</button>
        </form>
      )}
      <button className="btn btn-outline-danger btn-sm w-100" onClick={() => {
        if (!window.confirm('Leave this group?')) return;
        run(async () => { await remove({ id: chat.id, userId: myId }).unwrap(); navigate('/messages', { replace: true }); });
      }}>Leave group</button>
    </aside>
  );
}

function Bubble({ m, chat, mine, showSender }: { m: ChatMessage; chat: Chat; mine: boolean; showSender: boolean }) {
  const myId = useAppSelector((s) => s.auth.session!.user.id);
  const [remove] = useDeleteMessageMutation();
  if (m.system) return <div className="chat-system">{m.body}</div>;
  const read = mine && readByAll(chat, m, myId);
  return (
    <div className={`chat-row ${mine ? 'chat-row--mine' : ''}`}>
      <div className={`chat-bubble ${mine ? 'chat-bubble--mine' : ''} ${m.deleted ? 'is-deleted' : ''}`}>
        {showSender && m.sender && <div className="chat-bubble__sender">{m.sender.displayName}</div>}
        {m.deleted ? (
          <span className="fst-italic"><i className="bi bi-slash-circle me-1" />{mine ? 'You deleted this message' : 'This message was deleted'}</span>
        ) : (
          <>
            {m.imageUrl && <a href={m.imageUrl} target="_blank" rel="noreferrer"><img className="chat-bubble__img" src={m.imageUrl} alt="" /></a>}
            {m.body && <span className="chat-bubble__text">{m.body}</span>}
          </>
        )}
        <span className="chat-bubble__meta">
          {messageTime(m.createdAt)}
          {mine && !m.deleted && <i className={`bi bi-check2${read ? '-all text-info' : '-all opacity-75'} ms-1`} title={read ? 'Read' : 'Sent'} />}
        </span>
        {mine && !m.deleted && (
          <button className="chat-bubble__delete" title="Delete" onClick={() => window.confirm('Delete this message for everyone?') && remove(m.id)}>
            <i className="bi bi-trash" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function Conversation({ chatId }: { chatId: number }) {
  const me = useAppSelector((s) => s.auth.session!.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: chat, error } = useChatQuery(chatId);
  const { data: messages, isLoading } = useMessagesQuery(chatId);
  const [loadOlder, older] = useLazyOlderMessagesQuery();
  const [send, sending] = useSendMessageMutation();
  const [markRead] = useMarkReadMutation();
  const [upload, uploading] = useUploadImageMutation();
  const { typing, sendTyping, setActiveChat, removedChatId } = useChatSocket();
  const [text, setText] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [info, setInfo] = useState(false);
  const [noMore, setNoMore] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLInputElement>(null);
  const atBottom = useRef(true);
  const lastMarked = useRef(0);

  // This chat is on screen: its messages don't count as unread.
  useEffect(() => {
    setActiveChat(chatId);
    setNoMore(false);
    setInfo(false);
    dispatch(chatApi.util.updateQueryData('chats', undefined, (draft) => {
      const c = draft.find((x) => x.id === chatId);
      if (c) c.unreadCount = 0;
    }));
    return () => setActiveChat(null);
  }, [chatId, setActiveChat, dispatch]);

  useEffect(() => {
    if (removedChatId === chatId) navigate('/messages', { replace: true });
  }, [removedChatId, chatId, navigate]);

  // Mark the newest message from someone else as read while the tab is visible.
  const newest = messages?.[messages.length - 1];
  useEffect(() => {
    if (!newest || newest.id <= lastMarked.current || document.visibilityState !== 'visible') return;
    lastMarked.current = newest.id;
    markRead({ id: chatId, messageId: newest.id });
  }, [newest, chatId, markRead]);

  // Stay pinned to the bottom when new messages arrive (unless reading older ones).
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && atBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages?.length, chatId]);

  const onScroll = () => {
    const el = scroller.current;
    if (el) atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const showOlder = async () => {
    const first = messages?.[0];
    if (!first) return;
    const el = scroller.current;
    const before = el?.scrollHeight ?? 0;
    const rows = await loadOlder({ id: chatId, before: first.id }).unwrap();
    if (rows.length < PAGE) setNoMore(true);
    dispatch(chatApi.util.updateQueryData('messages', chatId, (draft) => {
      draft.unshift(...rows.filter((r) => !draft.some((d) => d.id === r.id)));
    }));
    // Keep the view where it was instead of jumping.
    requestAnimationFrame(() => { if (el) el.scrollTop = el.scrollHeight - before; });
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSendError(null);
    try {
      atBottom.current = true;
      setText('');
      await send({ id: chatId, body }).unwrap();
    } catch (err) {
      setText(body);
      setSendError(toApiError(err as never)?.message ?? 'Could not send');
    }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    } else {
      sendTyping(chatId);
    }
  };

  const sendPhoto = async (file: File | undefined) => {
    if (!file) return;
    setSendError(null);
    try {
      const { key } = await upload({ file, kind: 'POST' }).unwrap();
      atBottom.current = true;
      await send({ id: chatId, imageKey: key, body: text.trim() || undefined }).unwrap();
      setText('');
    } catch (err) {
      setSendError(toApiError(err as never)?.message ?? 'Could not send the photo');
    } finally {
      if (photo.current) photo.current.value = '';
    }
  };

  if (error) {
    return <div className="chat-empty"><i className="bi bi-chat-square-x fs-1" /><p>{toApiError(error)?.message ?? 'Chat not found'}</p></div>;
  }
  if (!chat) return <div className="chat-empty"><span className="spinner-border" /></div>;

  const other = chat.type === 'DIRECT' ? chat.members.find((m) => m.user.id !== me.id) : null;
  const typers = (typing[chatId] ?? []).map((id) => chat.members.find((m) => m.user.id === id)?.user.displayName).filter(Boolean);
  const status = typers.length
    ? (chat.type === 'DIRECT' ? 'typing…' : `${typers.join(', ')} typing…`)
    : chat.type === 'DIRECT' ? (other?.online ? 'online' : 'offline') : `${chat.members.length} members · ${chat.members.filter((m) => m.online).length} online`;

  return (
    <div className="chat-main">
      <section className="chat-conv">
        <header className="chat-conv__head">
          <Link to="/messages" className="btn btn-sm btn-light d-lg-none" aria-label="Back"><i className="bi bi-arrow-left" /></Link>
          {chat.type === 'GROUP' && !chat.avatarUrl
            ? <span className="chat-group-avatar chat-group-avatar--sm"><i className="bi bi-people-fill" /></span>
            : <Avatar name={chat.title} url={chat.avatarUrl} size={40} />}
          <div className="min-w-0 flex-grow-1">
            {other ? <Link to={`/users/${other.user.username}`} className="fw-semibold text-reset text-decoration-none">{chat.title}</Link> : <span className="fw-semibold">{chat.title}</span>}
            <div className={`small ${typers.length || other?.online ? 'text-success' : 'text-body-secondary'}`}>{status}</div>
          </div>
          {chat.type === 'GROUP' && <button className="btn btn-sm btn-light" onClick={() => setInfo(!info)} aria-label="Group info"><i className="bi bi-info-circle" /></button>}
        </header>

        <div className="chat-conv__body" ref={scroller} onScroll={onScroll}>
          {isLoading && <div className="text-center p-4"><span className="spinner-border spinner-border-sm" /></div>}
          {messages && messages.length >= PAGE && !noMore && (
            <div className="text-center my-2"><button className="btn btn-sm btn-light" disabled={older.isFetching} onClick={showOlder}>Load earlier messages</button></div>
          )}
          {messages && messages.length === 0 && <div className="chat-system">Say hello 👋</div>}
          {messages?.map((m, i) => {
            const prev = messages[i - 1];
            const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
            const showSender = chat.type === 'GROUP' && m.sender?.id !== me.id && (newDay || prev?.sender?.id !== m.sender?.id || prev?.system);
            return (
              <Fragment key={m.id}>
                {newDay && <div className="chat-day"><span>{dayLabel(m.createdAt)}</span></div>}
                <Bubble m={m} chat={chat} mine={m.sender?.id === me.id} showSender={Boolean(showSender)} />
              </Fragment>
            );
          })}
        </div>

        {sendError && <div className="px-3 small text-danger">{sendError}</div>}
        <form className="chat-compose" onSubmit={submit}>
          <button type="button" className="btn btn-light" title="Send a photo" disabled={uploading.isLoading} onClick={() => photo.current?.click()}>
            {uploading.isLoading ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-image" />}
          </button>
          <input ref={photo} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => sendPhoto(e.target.files?.[0])} />
          <textarea className="form-control" rows={1} placeholder="Type a message" value={text} maxLength={4000}
                    onChange={(e) => setText(e.target.value)} onKeyDown={onKey} />
          <button className="btn btn-join" disabled={!text.trim() || sending.isLoading} aria-label="Send"><i className="bi bi-send-fill" /></button>
        </form>
      </section>
      {info && chat.type === 'GROUP' && <GroupInfo chat={chat} onClose={() => setInfo(false)} />}
    </div>
  );
}
