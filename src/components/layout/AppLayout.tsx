import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Logo from '@/components/common/Logo';
import Avatar from '@/components/common/Avatar';
import { useAppDispatch, useAppSelector } from '@/store';
import { useLogoutMutation } from '@/store/authApi';
import { loggedOut } from '@/store/authSlice';
import { baseApi } from '@/store/baseApi';

/**
 * Signed-in shell. The menu is built from the feature list the backend returned for this user's roles,
 * so moderators and super admins see their extra areas without any frontend role checks.
 */
export default function AppLayout() {
  const session = useAppSelector((s) => s.auth.session)!;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();

  const mainFeatures = session.features.filter((f) => !['PROFILE', 'NOTIFICATIONS', 'MODERATION', 'ADMINISTRATION'].includes(f.name));
  const staffFeatures = session.features.filter((f) => ['MODERATION', 'ADMINISTRATION'].includes(f.name));
  const hasNotifications = session.features.some((f) => f.name === 'NOTIFICATIONS');

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } finally {
      dispatch(loggedOut());
      dispatch(baseApi.util.resetApiState());
      navigate('/login', { replace: true });
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-body border-bottom sticky-top">
        <div className="container">
          <Logo to="/home" />
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav"
                  aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="mainNav">
            <ul className="navbar-nav me-auto ms-lg-4">
              {mainFeatures.map((f) => (
                <li className="nav-item" key={f.id}>
                  <NavLink className="nav-link d-flex align-items-center gap-2" to={f.route}>
                    <i className={`bi bi-${f.icon}`} /> {f.displayName}
                  </NavLink>
                </li>
              ))}
              {staffFeatures.map((f) => (
                <li className="nav-item" key={f.id}>
                  <NavLink className="nav-link d-flex align-items-center gap-2 text-staff" to={f.route}>
                    <i className={`bi bi-${f.icon}`} /> {f.displayName}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="d-flex align-items-center gap-2">
              {hasNotifications && (
                <NavLink to="/notifications" className="btn btn-light rounded-circle" aria-label="Notifications">
                  <i className="bi bi-bell" />
                </NavLink>
              )}
              <div className="dropdown">
                <button className="btn btn-light d-flex align-items-center gap-2 rounded-pill ps-1 pe-3" data-bs-toggle="dropdown" aria-expanded="false">
                  <Avatar name={session.user.displayName} url={session.user.avatarUrl} size={32} />
                  <span className="fw-medium d-none d-sm-inline">{session.user.displayName}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                  <li className="px-3 py-2">
                    <div className="fw-semibold">{session.user.displayName}</div>
                    <small className="text-body-secondary">@{session.user.username}</small>
                    <div className="mt-1 d-flex flex-wrap gap-1">
                      {session.user.roles.map((r) => (
                        <span key={r} className="badge text-bg-light border">{r.replace('_', ' ').toLowerCase()}</span>
                      ))}
                    </div>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><NavLink className="dropdown-item" to="/profile"><i className="bi bi-person me-2" />My profile</NavLink></li>
                  <li><NavLink className="dropdown-item" to="/profile/privacy"><i className="bi bi-shield-lock me-2" />Privacy</NavLink></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><button className="dropdown-item text-danger" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2" />Log out</button></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="container py-4">
        <Outlet />
      </main>
    </>
  );
}
