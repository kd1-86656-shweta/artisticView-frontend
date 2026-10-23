import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type { ApiEnvelope, AuthResponse } from '@/types/api';
import { authenticated, loggedOut } from './authSlice';
import type { RootState } from './index';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

/** One refresh at a time: parallel 401s wait for the same refresh instead of racing the cookie rotation. */
let refreshing: Promise<boolean> | null = null;

async function refreshSession(api: Parameters<BaseQueryFn>[1], extra: object): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      const result = await rawBaseQuery({ url: 'auth/refresh-token', method: 'POST' }, api, extra);
      const body = result.data as ApiEnvelope<AuthResponse> | undefined;
      if (body?.data) {
        api.dispatch(authenticated(body.data));
        return true;
      }
      api.dispatch(loggedOut());
      return false;
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

/**
 * Unwraps the { data, error } envelope, and on an expired access token refreshes once and retries.
 */
const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extra) => {
  let result = await rawBaseQuery(args, api, extra);

  const errorCode = (result.error?.data as ApiEnvelope<unknown> | undefined)?.error?.code;
  const url = typeof args === 'string' ? args : args.url;
  if (result.error?.status === 401 && errorCode === 'TOKEN_EXPIRED' && !url.startsWith('auth/refresh-token')) {
    if (await refreshSession(api, extra)) {
      result = await rawBaseQuery(args, api, extra);
    }
  }

  if (result.error) {
    return result;
  }
  const envelope = result.data as ApiEnvelope<unknown> | undefined;
  return { data: envelope?.data ?? null, meta: result.meta };
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Session', 'Home', 'Profile', 'Event', 'Community', 'Post', 'Chat'],
  endpoints: () => ({}),
});
