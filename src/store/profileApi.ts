import { baseApi } from './baseApi';
import type { MediaKind, MediaUpload, Profile, UpdateProfileRequest } from '@/types/api';

export const profileApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    profile: build.query<Profile, string>({
      query: (username) => `api/v1/users/${encodeURIComponent(username)}`,
      providesTags: (_r, _e, username) => [{ type: 'Profile', id: username }],
    }),
    updateProfile: build.mutation<Profile, UpdateProfileRequest>({
      query: (body) => ({ url: 'api/v1/users/me/profile', method: 'PATCH', body }),
      // The navbar avatar and name come from the session; Home shows the "complete your profile" nudge.
      invalidatesTags: (r) => [{ type: 'Profile', id: r?.username }, 'Session', 'Home'],
    }),
    uploadImage: build.mutation<MediaUpload, { file: File; kind: MediaKind }>({
      query: ({ file, kind }) => {
        const body = new FormData();
        body.append('file', file);
        return { url: 'api/v1/media/images', method: 'POST', params: { kind }, body };
      },
    }),
  }),
});

export const { useProfileQuery, useUpdateProfileMutation, useUploadImageMutation } = profileApi;
