import { baseApi } from './baseApi';
import type { HomeData, Profile } from '@/types/api';

export const homeApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    home: build.query<HomeData, void>({
      query: () => 'api/v1/home',
      providesTags: ['Home'],
    }),
    follow: build.mutation<null, { userId: number; follow: boolean }>({
      query: ({ userId, follow }) => ({ url: `api/v1/users/${userId}/follow`, method: follow ? 'PUT' : 'DELETE' }),
      // Optimistic: flip the button immediately, roll back if the request fails.
      async onQueryStarted({ userId, follow }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          homeApi.util.updateQueryData('home', undefined, (draft) => {
            const person = draft.suggestedPeople.find((p) => p.id === userId);
            if (person) {
              person.followedByMe = follow;
              person.followerCount += follow ? 1 : -1;
            }
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
    updateMyProfile: build.mutation<Profile, { bio?: string; interests?: string[]; displayName?: string }>({
      query: (body) => ({ url: 'api/v1/users/me/profile', method: 'PATCH', body }),
      invalidatesTags: ['Home', 'Session'],
    }),
  }),
});

export const { useHomeQuery, useFollowMutation, useUpdateMyProfileMutation } = homeApi;
