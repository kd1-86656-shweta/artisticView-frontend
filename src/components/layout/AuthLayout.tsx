import type { CSSProperties, ReactNode } from 'react';
import Logo from '@/components/common/Logo';
import Artwork from '@/components/common/Artwork';
import { APP_TAGLINE } from '@/config/app';

interface AuthLayoutProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}

const PERKS = [
  { icon: 'broadcast', title: 'Live rooms', text: 'Hang out and listen in, in real time.', color: '#b5532f' },
  { icon: 'people', title: 'Communities', text: 'Spaces with their own identity and people.', color: '#c8902f' },
  { icon: 'calendar2-heart', title: 'Events', text: 'Sessions, listening parties and meetups.', color: '#6f8a5e' },
];

const CHIPS: [string, string][] = [
  ['Hip hop', '#d9734f'], ['Tarot', '#b9839d'], ['Poetry', '#d99a93'], ['Painting', '#e0ad55'], ['Healing', '#97b083'],
];

/** Split screen: a painted brand panel on the left (desktop only), the form on paper on the right. */
export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  const tagline = APP_TAGLINE.replace(/\.$/, '').split('. ');
  return (
    <div className="container-fluid min-vh-100 auth-page">
      <div className="row min-vh-100">
        <aside className="col-lg-5 d-none d-lg-flex flex-column justify-content-between p-5 auth-hero">
          <Artwork art="parasol" />
          <Logo light />
          <div>
            <h2 className="display-5 mb-3 auth-hero__title">{tagline[0]}.<br /><span>{tagline[1]}.</span></h2>
            <p className="lead opacity-75 mb-4">
              Join live rooms, meet people who love what you love, and build communities around it.
            </p>
            <ul className="list-unstyled d-grid gap-3 mb-4">
              {PERKS.map((p) => (
                <li key={p.title} className="d-flex gap-3 align-items-center">
                  <span className="auth-perk__icon" style={{ background: p.color }}><i className={`bi bi-${p.icon}`} /></span>
                  <span><strong>{p.title}</strong><br /><span className="opacity-75">{p.text}</span></span>
                </li>
              ))}
            </ul>
            <div className="auth-chips">
              {CHIPS.map(([label, color]) => <span key={label} style={{ '--dot': color } as CSSProperties}>{label}</span>)}
            </div>
          </div>
          <small className="opacity-50">Built for people, not vanity metrics.</small>
        </aside>

        <main className="col-lg-7 d-flex align-items-center justify-content-center py-5 px-3">
          <div className="w-100 auth-form-width">
            <div className="d-lg-none mb-4 text-center">
              <Logo />
            </div>
            <h1 className="display-6 mb-1">{title}</h1>
            {subtitle && <p className="text-body-secondary mb-4">{subtitle}</p>}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
