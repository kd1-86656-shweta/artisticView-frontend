import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store';

/** Logged-in area: anonymous visitors go to login and come back afterwards. */
export function RequireAuth() {
  const session = useAppSelector((s) => s.auth.session);
  const location = useLocation();
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

/** Landing, login and sign-up make no sense once logged in. */
export function GuestOnly() {
  const session = useAppSelector((s) => s.auth.session);
  if (session) {
    return <Navigate to="/home" replace />;
  }
  return <Outlet />;
}
