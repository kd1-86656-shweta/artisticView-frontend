import { Client } from '@stomp/stompjs';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { store, useAppDispatch, useAppSelector } from '@/store';
import { chatApi, upsertMessage } from '@/store/chatApi';
import type { ChatEvent } from '@/types/api';

const TYPING_MS = 4000;

interface ChatSocket {
  connected: boolean;
  /** userIds typing right now, per chat. */
  typing: Record<number, number[]>;
  sendTyping: (chatId: number) => void;
  /** The chat on screen: its incoming messages don't add to the unread count. */
  setActiveChat: (chatId: number | null) => void;
  /** Set when the viewer is removed from (or leaves) a chat, so an open chat can close. */
  removedChatId: number | null;
}

const Ctx = createContext<ChatSocket>({ connected: false, typing: {}, sendTyping: () => undefined, setActiveChat: () => undefined, removedChatId: null });

export const useChatSocket = () => useContext(Ctx);

/**
 * One STOMP connection for the signed-in session. Events update the RTK Query caches directly, so chat lists,
 * open conversations and unread badges change live without polling.
 */
export function ChatSocketProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const myId = useAppSelector((s) => s.auth.session?.user.id);
  const canChat = useAppSelector((s) => s.auth.session?.permissions.includes('CHAT_USE') ?? false);
  const [connected, setConnected] = useState(false);
  const [typing, setTyping] = useState<Record<number, { userId: number; until: number }[]>>({});
  const [removedChatId, setRemovedChatId] = useState<number | null>(null);
  const activeChat = useRef<number | null>(null);
  const client = useRef<Client | null>(null);
  const lastTypingSent = useRef<Record<number, number>>({});

  const handle = useCallback((event: ChatEvent) => {
    const id = event.conversationId;
    switch (event.type) {
      case 'MESSAGE':
      case 'MESSAGE_DELETED': {
        const m = event.message!;
        dispatch(chatApi.util.updateQueryData('messages', id, (draft) => upsertMessage(draft, m)));
        let known = false;
        dispatch(chatApi.util.updateQueryData('chats', undefined, (draft) => {
          const i = draft.findIndex((c) => c.id === id);
          if (i < 0) return;
          known = true;
          const chat = draft[i];
          if (event.type === 'MESSAGE') {
            chat.lastMessage = m;
            if (m.sender && m.sender.id !== myId && activeChat.current !== id) chat.unreadCount += 1;
            draft.splice(i, 1);
            draft.unshift(chat);
          } else if (chat.lastMessage?.id === m.id) {
            chat.lastMessage = m;
          }
        }));
        if (!known) dispatch(chatApi.util.invalidateTags([{ type: 'Chat', id: 'LIST' }]));
        // Whoever sent it has stopped typing.
        if (m.sender) setTyping((t) => ({ ...t, [id]: (t[id] ?? []).filter((x) => x.userId !== m.sender!.id) }));
        break;
      }
      case 'READ': {
        const update = (members: { user: { id: number }; lastReadMessageId: number | null }[]) => {
          const member = members.find((x) => x.user.id === event.userId);
          if (member) member.lastReadMessageId = event.messageId;
        };
        dispatch(chatApi.util.updateQueryData('chat', id, (draft) => update(draft.members)));
        dispatch(chatApi.util.updateQueryData('chats', undefined, (draft) => {
          const chat = draft.find((c) => c.id === id);
          if (chat) update(chat.members);
        }));
        break;
      }
      case 'TYPING':
        setTyping((t) => ({
          ...t,
          [id]: [...(t[id] ?? []).filter((x) => x.userId !== event.userId), { userId: event.userId!, until: Date.now() + TYPING_MS }],
        }));
        break;
      case 'CHAT_UPDATED':
        dispatch(chatApi.util.invalidateTags([{ type: 'Chat', id }, { type: 'Chat', id: 'LIST' }]));
        break;
      case 'REMOVED':
        dispatch(chatApi.util.invalidateTags([{ type: 'Chat', id: 'LIST' }]));
        setRemovedChatId(id);
        break;
    }
  }, [dispatch, myId]);

  useEffect(() => {
    if (!canChat) return undefined;
    const c = new Client({
      brokerURL: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`,
      reconnectDelay: 3000,
      heartbeatIncoming: 20000,
      heartbeatOutgoing: 20000,
      // Read the token at every (re)connect, so a refreshed token is used after a reconnect.
      beforeConnect: () => {
        c.connectHeaders = { Authorization: `Bearer ${store.getState().auth.accessToken ?? ''}` };
      },
      onConnect: () => {
        setConnected(true);
        c.subscribe('/user/queue/chat', (frame) => handle(JSON.parse(frame.body) as ChatEvent));
        // Anything missed while disconnected: refetch the chat list.
        dispatch(chatApi.util.invalidateTags([{ type: 'Chat', id: 'LIST' }]));
      },
      onWebSocketClose: () => setConnected(false),
    });
    c.activate();
    client.current = c;
    return () => {
      void c.deactivate();
      client.current = null;
    };
  }, [canChat, handle, dispatch]);

  // Drop typing indicators that have timed out.
  useEffect(() => {
    const timer = setInterval(() => {
      setTyping((t) => {
        const now = Date.now();
        let changed = false;
        const next: typeof t = {};
        for (const [k, list] of Object.entries(t)) {
          const kept = list.filter((x) => x.until > now);
          if (kept.length !== list.length) changed = true;
          if (kept.length) next[Number(k)] = kept;
        }
        return changed ? next : t;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const sendTyping = useCallback((chatId: number) => {
    const now = Date.now();
    if (!client.current?.connected || now - (lastTypingSent.current[chatId] ?? 0) < 2500) return;
    lastTypingSent.current[chatId] = now;
    client.current.publish({ destination: `/app/chats/${chatId}/typing` });
  }, []);

  const setActiveChat = useCallback((chatId: number | null) => {
    activeChat.current = chatId;
    if (chatId !== null) setRemovedChatId(null);
  }, []);

  const typingIds = useMemo(() => Object.fromEntries(Object.entries(typing).map(([k, v]) => [k, v.map((x) => x.userId)])), [typing]);

  return (
    <Ctx.Provider value={{ connected, typing: typingIds, sendTyping, setActiveChat, removedChatId }}>
      {children}
    </Ctx.Provider>
  );
}
