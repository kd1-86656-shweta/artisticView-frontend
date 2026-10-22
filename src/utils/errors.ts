import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';
import type { ApiEnvelope, ApiError } from '@/types/api';

/** Pulls the backend's { error } out of an RTK Query failure, with a friendly fallback. */
export function toApiError(error: FetchBaseQueryError | SerializedError | undefined): ApiError | null {
  if (!error) {
    return null;
  }
  if ('status' in error) {
    const body = error.data as ApiEnvelope<unknown> | undefined;
    if (body?.error) {
      return body.error;
    }
    if (error.status === 'FETCH_ERROR') {
      return { code: 'NETWORK', message: 'Cannot reach the server. Check your connection and try again.' };
    }
  }
  return { code: 'UNKNOWN', message: 'Something went wrong. Please try again.' };
}
