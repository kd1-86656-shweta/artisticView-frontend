import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/store';
import { authenticated } from '@/store/authSlice';
import type { ApiEnvelope, AuthResponse } from '@/types/api';

/**
 * On first load, try to restore the session from the httpOnly refresh cookie.
 * Renders nothing until we know whether the visitor is logged in, so guarded routes never flash.
 */
export function useSessionBootstrap(): boolean {
  const dispatch = useAppDispatch();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/auth/refresh-token', { method: 'POST', credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          return;
        }
        const body = (await res.json()) as ApiEnvelope<AuthResponse>;
        if (body.data && !cancelled) {
          dispatch(authenticated(body.data));
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return ready;
}
