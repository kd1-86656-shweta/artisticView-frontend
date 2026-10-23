import { Navigate, Route, Routes } from 'react-router-dom';
import { useSessionBootstrap } from './features/auth/useSessionBootstrap';
import { RequireAuth, GuestOnly } from './features/auth/RouteGuards';
import AppLayout from './components/layout/AppLayout';
import FullPageSpinner from './components/common/FullPageSpinner';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import HomePage from './pages/home/HomePage';
import EventsPage from './pages/events/EventsPage';
import CommunitiesPage from './pages/communities/CommunitiesPage';
import CreateCommunityPage from './pages/communities/CreateCommunityPage';
import CommunityPage from './pages/communities/CommunityPage';
import ManageCommunityPage from './pages/communities/ManageCommunityPage';
import PostPage from './pages/posts/PostPage';
import ProfilePage from './pages/profile/ProfilePage';
import EditProfilePage from './pages/profile/EditProfilePage';
import EventFormPage from './pages/events/EventFormPage';
import EventDetailPage from './pages/events/EventDetailPage';
import MessagesPage from './pages/chat/MessagesPage';
import ComingSoonPage from './pages/ComingSoonPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  const ready = useSessionBootstrap();
  if (!ready) {
    return <FullPageSpinner />;
  }

  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/users/:username" element={<ProfilePage />} />
          <Route path="/communities" element={<CommunitiesPage />} />
          <Route path="/communities/mine" element={<CommunitiesPage />} />
          <Route path="/communities/new" element={<CreateCommunityPage />} />
          <Route path="/c/:slug" element={<CommunityPage />} />
          <Route path="/c/:slug/manage" element={<ManageCommunityPage />} />
          <Route path="/posts/:id" element={<PostPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/host" element={<EventFormPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/events/:id/edit" element={<EventFormPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:id" element={<MessagesPage />} />
          <Route path="*" element={<ComingSoonPage />} />
        </Route>
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
