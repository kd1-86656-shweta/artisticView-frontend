import { Link, useLocation } from 'react-router-dom';
import EventCard from '@/pages/events/EventCard';
import PostComposer from '@/pages/posts/PostComposer';
import PostList from '@/pages/posts/PostList';
import { useAppSelector } from '@/store';
import { useHomeQuery } from '@/store/homeApi';
import { usePermission } from '@/features/auth/permissions';
import { toApiError } from '@/utils/errors';
import VerifyEmailBanner from './VerifyEmailBanner';
import CompleteProfileCard from './CompleteProfileCard';
import PersonCardTile from './PersonCardTile';
import DiscoverSection from './DiscoverSection';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Home = Discover: live now, upcoming, communities and people. Only people are live data so far. */
export default function HomePage() {
  const user = useAppSelector((s) => s.auth.session!.user);
  const welcome = Boolean((useLocation().state as { welcome?: boolean } | null)?.welcome);
  const { data, isLoading, error, refetch } = useHomeQuery();
  const canHostRooms = usePermission('ROOM_HOST');
  const canCreateCommunity = usePermission('COMMUNITY_CREATE');
  const canHostEvents = usePermission('EVENT_HOST');

  return (
    <div className="d-grid gap-4">
      <section className="home-hero rounded-4 p-4 p-md-5 text-white">
        <div className="row align-items-center g-4">
          <div className="col-md-8">
            <p className="mb-1 opacity-75">{welcome ? 'Welcome aboard' : greeting()},</p>
            <h1 className="display-6 fw-bold mb-2">{user.displayName}</h1>
            <p className="mb-0 opacity-75">
              {welcome
                ? 'Your account is ready. Start by telling people what you are into.'
                : 'Here is what is happening in your community.'}
            </p>
          </div>
          <div className="col-md-4">
            <div className="d-flex gap-3 justify-content-md-end">
              <div className="stat-pill">
                <div className="fs-3 fw-bold">{data?.memberCount ?? '–'}</div>
                <small className="opacity-75">members</small>
              </div>
              <div className="stat-pill">
                <div className="fs-3 fw-bold">{data?.newMembersThisWeek ?? '–'}</div>
                <small className="opacity-75">joined this week</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!user.emailVerified && <VerifyEmailBanner email={user.email} />}

      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{toApiError(error)?.message}</span>
          <button className="btn btn-sm btn-outline-danger" onClick={() => refetch()}>Retry</button>
        </div>
      )}

      {data?.profileIncomplete && <CompleteProfileCard />}

      <div className="row g-4">
        <div className="col-lg-8 d-grid gap-4">
          <DiscoverSection
            icon="broadcast"
            title="Live now"
            live
            emptyTitle="No one is live right now"
            emptyText="When people you follow or communities you join go live, they show up here."
            action={canHostRooms ? { label: 'Start a room', to: '/rooms/host' } : undefined}
          />
          {data && data.featuredEvents.length > 0 && (
            <section className="card border-0 shadow-sm ev-promote-card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="h5 fw-bold mb-0"><i className="bi bi-stars me-2" />Featured events</h2>
                  <Link to="/events" className="small">See all</Link>
                </div>
                <div className="d-grid gap-3">{data.featuredEvents.map((e) => <EventCard key={e.id} event={e} />)}</div>
              </div>
            </section>
          )}
          {data && data.upcomingEvents.length > 0 ? (
            <section className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="h5 fw-bold mb-0 d-flex align-items-center gap-2"><i className="bi bi-calendar-event text-primary" />Upcoming sessions</h2>
                  {canHostEvents && <Link to="/events/host" className="btn btn-sm btn-outline-primary">Host an event</Link>}
                </div>
                <div className="d-grid gap-3">{data.upcomingEvents.map((e) => <EventCard key={e.id} event={e} />)}</div>
              </div>
            </section>
          ) : (
            <DiscoverSection
              icon="calendar-event"
              title="Upcoming sessions"
              emptyTitle="Nothing scheduled yet"
              emptyText="Listening parties, workshops and meetups will appear here."
              action={canHostEvents ? { label: 'Host an event', to: '/events/host' } : undefined}
            />
          )}
          <section className="d-grid gap-3">
            <div className="d-flex justify-content-between align-items-center">
              <h2 className="h5 fw-bold mb-0 d-flex align-items-center gap-2"><i className="bi bi-collection text-primary" />Your feed</h2>
              <div className="d-flex gap-2">
                <Link to="/communities" className="btn btn-sm btn-outline-primary">Find communities</Link>
                {canCreateCommunity && <Link to="/communities/new" className="btn btn-sm btn-outline-primary">Start a community</Link>}
              </div>
            </div>
            <PostComposer />
            <PostList emptyTitle="Your feed is quiet"
                      emptyText="Join communities and follow people, and their posts show up here." />
          </section>
        </div>

        <aside className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h2 className="h5 fw-bold mb-1">People you might like</h2>
              <p className="text-body-secondary small mb-3">Shared interests first, then new members.</p>
              {isLoading && (
                <div className="d-grid gap-3">
                  {[1, 2, 3].map((i) => <div key={i} className="placeholder-glow"><span className="placeholder col-12 rounded-3" style={{ height: 56 }} /></div>)}
                </div>
              )}
              {data && data.suggestedPeople.length === 0 && (
                <p className="text-body-secondary mb-0">
                  You have met everyone so far. Invite friends to grow the community.
                </p>
              )}
              <div className="d-grid gap-3">
                {data?.suggestedPeople.map((person) => <PersonCardTile key={person.id} person={person} />)}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
