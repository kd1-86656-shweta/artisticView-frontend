import { baseApi } from './baseApi';
import type { Community, CommunityMember, CommunityRequest, CommunityRole } from '@/types/api';

export type CommunityScope = 'discover' | 'mine' | 'invites';

export const communityApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    communities: build.query<Community[], { scope: CommunityScope; q?: string }>({
      query: ({ scope, q }) => ({ url: 'api/v1/communities', params: { scope, q: q || undefined } }),
      providesTags: [{ type: 'Community', id: 'LIST' }],
    }),
    community: build.query<Community, string>({
      query: (slug) => `api/v1/communities/${slug}`,
      providesTags: (_r, _e, slug) => [{ type: 'Community', id: slug }],
    }),
    createCommunity: build.mutation<Community, CommunityRequest>({
      query: (body) => ({ url: 'api/v1/communities', method: 'POST', body }),
      invalidatesTags: [{ type: 'Community', id: 'LIST' }],
    }),
    updateCommunity: build.mutation<Community, { slug: string; body: CommunityRequest }>({
      query: ({ slug, body }) => ({ url: `api/v1/communities/${slug}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { slug }) => [{ type: 'Community', id: slug }, { type: 'Community', id: 'LIST' }],
    }),
    deleteCommunity: build.mutation<null, string>({
      query: (slug) => ({ url: `api/v1/communities/${slug}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Community', id: 'LIST' }, { type: 'Post', id: 'LIST' }],
    }),
    setMembership: build.mutation<Community, { slug: string; join: boolean }>({
      query: ({ slug, join }) => ({ url: `api/v1/communities/${slug}/membership`, method: join ? 'PUT' : 'DELETE' }),
      // Joining changes what the feed and the community's posts show.
      invalidatesTags: (_r, _e, { slug }) => [{ type: 'Community', id: slug }, { type: 'Community', id: 'LIST' },
        { type: 'Community', id: `members-${slug}` }, { type: 'Post', id: 'LIST' }],
    }),
    members: build.query<CommunityMember[], string>({
      query: (slug) => `api/v1/communities/${slug}/members`,
      providesTags: (_r, _e, slug) => [{ type: 'Community', id: `members-${slug}` }],
    }),
    addMember: build.mutation<CommunityMember[], { slug: string; username: string }>({
      query: ({ slug, username }) => ({ url: `api/v1/communities/${slug}/members`, method: 'POST', body: { username } }),
      invalidatesTags: (_r, _e, { slug }) => [{ type: 'Community', id: `members-${slug}` }],
    }),
    removeMember: build.mutation<CommunityMember[], { slug: string; userId: number }>({
      query: ({ slug, userId }) => ({ url: `api/v1/communities/${slug}/members/${userId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { slug }) => [{ type: 'Community', id: `members-${slug}` }, { type: 'Community', id: slug }],
    }),
    setMemberRole: build.mutation<CommunityMember[], { slug: string; userId: number; role: CommunityRole }>({
      query: ({ slug, userId, role }) => ({ url: `api/v1/communities/${slug}/members/${userId}`, method: 'PATCH', body: { role } }),
      invalidatesTags: (_r, _e, { slug }) => [{ type: 'Community', id: `members-${slug}` }],
    }),
  }),
});

export const {
  useCommunitiesQuery,
  useCommunityQuery,
  useCreateCommunityMutation,
  useUpdateCommunityMutation,
  useDeleteCommunityMutation,
  useSetMembershipMutation,
  useMembersQuery,
  useAddMemberMutation,
  useRemoveMemberMutation,
  useSetMemberRoleMutation,
} = communityApi;
