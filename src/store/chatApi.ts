import { baseApi } from './baseApi';
import type { Chat, ChatMessage } from '@/types/api';

export const chatApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    chats: build.query<Chat[], void>({
      query: () => 'api/v1/chats',
      providesTags: [{ type: 'Chat', id: 'LIST' }],
    }),
    chat: build.query<Chat, number>({
      query: (id) => `api/v1/chats/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Chat', id }],
    }),
    /** Newest first from the server; kept oldest-first in the cache. Older pages are merged in by loadOlder. */
    messages: build.query<ChatMessage[], number>({
      query: (id) => `api/v1/chats/${id}/messages?size=40`,
      transformResponse: (rows: ChatMessage[]) => [...rows].reverse(),
      keepUnusedDataFor: 600,
    }),
    olderMessages: build.query<ChatMessage[], { id: number; before: number }>({
      query: ({ id, before }) => `api/v1/chats/${id}/messages?size=40&before=${before}`,
      transformResponse: (rows: ChatMessage[]) => [...rows].reverse(),
    }),
    openDirect: build.mutation<Chat, string>({
      query: (username) => ({ url: 'api/v1/chats/direct', method: 'POST', body: { username } }),
      invalidatesTags: [{ type: 'Chat', id: 'LIST' }],
    }),
    createGroup: build.mutation<Chat, { title: string; usernames: string[] }>({
      query: (body) => ({ url: 'api/v1/chats/groups', method: 'POST', body }),
      invalidatesTags: [{ type: 'Chat', id: 'LIST' }],
    }),
    updateGroup: build.mutation<Chat, { id: number; title?: string; avatarKey?: string }>({
      query: ({ id, ...body }) => ({ url: `api/v1/chats/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Chat', id }, { type: 'Chat', id: 'LIST' }],
    }),
    addChatMember: build.mutation<Chat, { id: number; username: string }>({
      query: ({ id, username }) => ({ url: `api/v1/chats/${id}/members`, method: 'POST', body: { username } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Chat', id }],
    }),
    removeChatMember: build.mutation<null, { id: number; userId: number }>({
      query: ({ id, userId }) => ({ url: `api/v1/chats/${id}/members/${userId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Chat', id }, { type: 'Chat', id: 'LIST' }],
    }),
    sendMessage: build.mutation<ChatMessage, { id: number; body?: string; imageKey?: string }>({
      query: ({ id, ...body }) => ({ url: `api/v1/chats/${id}/messages`, method: 'POST', body }),
      // Show it right away even if the socket copy is late (upsert keeps it single).
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: null }));
        if (data) dispatch(chatApi.util.updateQueryData('messages', id, (draft) => upsertMessage(draft, data)));
      },
    }),
    deleteMessage: build.mutation<null, number>({
      query: (id) => ({ url: `api/v1/messages/${id}`, method: 'DELETE' }),
    }),
    markRead: build.mutation<null, { id: number; messageId: number }>({
      query: ({ id, messageId }) => ({ url: `api/v1/chats/${id}/read`, method: 'POST', body: { messageId } }),
      // Server count is the truth; this also beats a list refetch that started before the read landed.
      invalidatesTags: [{ type: 'Chat', id: 'LIST' }],
    }),
  }),
});

export const {
  useChatsQuery,
  useChatQuery,
  useMessagesQuery,
  useLazyOlderMessagesQuery,
  useOpenDirectMutation,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useAddChatMemberMutation,
  useRemoveChatMemberMutation,
  useSendMessageMutation,
  useDeleteMessageMutation,
  useMarkReadMutation,
} = chatApi;

/** Adds a message to a chat's cached history once (the sender's own copy also arrives over the socket). */
export function upsertMessage(list: ChatMessage[], m: ChatMessage) {
  const i = list.findIndex((x) => x.id === m.id);
  if (i >= 0) list[i] = m;
  else list.push(m);
}
