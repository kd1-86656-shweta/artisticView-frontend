import { baseApi } from './baseApi';
import type { CursorPage, EventItem, EventRequest } from '@/types/api';

export type EventScope = 'upcoming' | 'promoted' | 'mine';

/** Every event mutation refreshes event lists and Home, since featured/upcoming events show there too. */
const changed = (id?: number) => [{ type: 'Event' as const, id: 'LIST' }, ...(id ? [{ type: 'Event' as const, id }] : []), 'Home' as const];

export const eventsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    events: build.query<CursorPage<EventItem>, { scope: EventScope; cursor?: string }>({
      query: ({ scope, cursor }) => ({ url: 'api/v1/events', params: { scope, cursor } }),
      providesTags: [{ type: 'Event', id: 'LIST' }],
    }),
    eventInvites: build.query<EventItem[], void>({
      query: () => 'api/v1/events/invites',
      providesTags: [{ type: 'Event', id: 'LIST' }],
    }),
    event: build.query<EventItem, number>({
      query: (id) => `api/v1/events/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Event', id }],
    }),
    createEvent: build.mutation<EventItem, EventRequest>({
      query: (body) => ({ url: 'api/v1/events', method: 'POST', body }),
      invalidatesTags: () => changed(),
    }),
    updateEvent: build.mutation<EventItem, { id: number; body: EventRequest }>({
      query: ({ id, body }) => ({ url: `api/v1/events/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => changed(id),
    }),
    deleteEvent: build.mutation<null, number>({
      query: (id) => ({ url: `api/v1/events/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => changed(id),
    }),
    rsvp: build.mutation<EventItem, { id: number; going: boolean }>({
      query: ({ id, going }) => ({ url: `api/v1/events/${id}/rsvp`, method: going ? 'PUT' : 'DELETE' }),
      invalidatesTags: (_r, _e, { id }) => changed(id),
    }),
    inviteCollaborator: build.mutation<EventItem, { id: number; username: string }>({
      query: ({ id, username }) => ({ url: `api/v1/events/${id}/collaborators`, method: 'POST', body: { username } }),
      invalidatesTags: (_r, _e, { id }) => changed(id),
    }),
    removeCollaborator: build.mutation<EventItem, { id: number; userId: number }>({
      query: ({ id, userId }) => ({ url: `api/v1/events/${id}/collaborators/${userId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { id }) => changed(id),
    }),
    respondToInvite: build.mutation<EventItem, { id: number; accept: boolean }>({
      query: ({ id, accept }) => ({ url: `api/v1/events/${id}/collaboration`, method: 'PUT', body: { accept } }),
      invalidatesTags: (_r, _e, { id }) => changed(id),
    }),
    promoteEvent: build.mutation<EventItem, { id: number; days: number | null }>({
      query: ({ id, days }) => days
        ? { url: `api/v1/events/${id}/promotion`, method: 'POST', body: { days } }
        : { url: `api/v1/events/${id}/promotion`, method: 'DELETE' },
      invalidatesTags: (_r, _e, { id }) => changed(id),
    }),
  }),
});

export const {
  useEventsQuery,
  useEventInvitesQuery,
  useEventQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useRsvpMutation,
  useInviteCollaboratorMutation,
  useRemoveCollaboratorMutation,
  useRespondToInviteMutation,
  usePromoteEventMutation,
} = eventsApi;
