import { useEffect, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/common/Logo';
import Artwork, { ARTWORKS, type ArtworkKey } from '@/components/common/Artwork';
import Watercolor, { BrushStroke, type Wash } from '@/components/common/Watercolor';
import { APP_NAME } from '@/config/app';
import ContactSection from './landing/ContactSection';
import '@/styles/landing.css';

/** Nature pigments: lake and sky blues, leaf greens, sunflower, poppy and lavender. */
const P = {
  ultramarine: '#2d5f86', cobalt: '#3d74a8', cerulean: '#3f8fc4', cadmium: '#f2b632', lemon: '#f6d76b',
  vermilion: '#d9472b', rose: '#8a73c4', violet: '#6c5aa8', viridian: '#3f7a3a', sap: '#7fa650', ochre: '#c8902f',
};

const NAV = [
  { href: '#how', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#creators', label: 'Creators' },
  { href: '#contact', label: 'Contact' },
];

/** [label, swatch colour, dark text on light swatches] */
const INTERESTS: [string, string, boolean?][] = [
  ['Hip hop', P.vermilion], ['Tarot', P.violet], ['Poetry', P.rose], ['Painting', P.cadmium, true], ['Gaming', P.cobalt],
  ['Comedy', P.sap, true], ['Photography', P.ochre], ['Lo-fi', P.cerulean], ['Healing', P.viridian], ['Podcasts', P.rose],
  ['Book clubs', P.lemon, true], ['Film', P.ultramarine],
];

/** Each step hangs as a framed painting whose subject matches it. */
const STEPS: { title: string; text: string; art: ArtworkKey }[] = [
  { title: 'Join us', text: 'Make a free profile in a minute and pick the things you love.', art: 'almond' },
  { title: 'Find your people', text: 'Discover communities and hosts who share your interests.', art: 'boating' },
  { title: 'Experience it live', text: 'Drop into rooms, join the conversation, or start your own.', art: 'galette' },
];

const ROMAN = ['i.', 'ii.', 'iii.'];

/** Each feature tile is its own little painting: a base pigment with lighter and darker washes over it. */
const TILES: { key: string; icon: string; title: string; text: string; washes: Wash[]; strokes?: boolean }[] = [
  {
    key: 'rooms', icon: 'broadcast', title: 'Live rooms', strokes: true,
    text: 'Listening sessions, jams, readings and hangouts. Talk, listen, chat and raise your hand to join the stage.',
    washes: [[820, 110, 260, P.cadmium, 0.55], [960, 420, 240, P.rose, 0.5], [180, 560, 260, '#8f1f12', 0.45]],
  },
  { key: 'comm', icon: 'people', title: 'Communities', text: 'Spaces built around a shared love, with their own rules and regulars.', washes: [[840, 120, 300, '#fbe7a1', 0.7], [160, 560, 280, P.ochre, 0.55]] },
  { key: 'events', icon: 'calendar2-heart', title: 'Events', text: 'RSVP to sessions from hosts you follow and get a nudge when they go live.', washes: [[860, 120, 300, P.sap, 0.6], [140, 560, 260, '#123d2f', 0.6]] },
  { key: 'host', icon: 'mic', title: 'Host your own', text: 'Anyone can start a room or run a community. No gatekeeping.', washes: [[840, 120, 300, '#c4b5ec', 0.6], [160, 560, 260, P.violet, 0.5]] },
  { key: 'safe', icon: 'shield-check', title: 'Safe by design', text: 'Clear guidelines, blocking and reporting, and moderators who keep spaces kind.', washes: [[840, 120, 300, P.cerulean, 0.6], [160, 560, 260, '#141f5c', 0.6]] },
];

const CREATORS = [
  {
    initial: 'B', name: 'Budnix', pig: P.vermilion, washes: [[300, 150, 320, P.cadmium, 0.75], [760, 480, 320, P.rose, 0.6]] as Wash[],
    text: 'Rapper hosting a Friday night cypher: open mics, first listens and real talk.',
    tags: [['music-note-beamed', 'Hip hop', P.vermilion], ['mic', 'Live every Friday', P.ochre]],
  },
  {
    initial: 'M', name: 'Moksha Holistic Healing', pig: P.violet, washes: [[300, 150, 320, P.rose, 0.6], [760, 480, 320, P.cerulean, 0.6]] as Wash[],
    text: 'Tarot readings and healing circles with Hemanika, for clarity, not fear.',
    tags: [['stars', 'Tarot', P.violet], ['flower1', 'Healing', P.viridian]],
  },
];

function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return scrolled;
}

/** Fades sections in the first time they scroll into view. */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.lp-reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

const delay = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties;


function LiveRoomPreview() {
  const speakers = [
    { initial: 'B', name: 'Budnix', color: P.vermilion, speaking: true },
    { initial: 'R', name: 'Riya', color: P.cobalt },
    { initial: 'K', name: 'Kabir', color: P.viridian },
    { initial: 'A', name: 'Aisha', color: P.rose },
  ];
  return (
    <div className="lp-stage" aria-hidden="true">
      <div className="lp-note lp-note--a">that verse was fire!</div>
      <div className="lp-note lp-note--b">can I hop on next? ✋</div>
      <div className="lp-room">
        <span className="lp-tape lp-tape--l" />
        <span className="lp-tape lp-tape--r" />
        <div className="lp-room__top">
          <span className="lp-live"><span className="live-dot" /> LIVE</span>
          <span className="small" style={{ color: 'var(--ink-muted)' }}><i className="bi bi-headphones me-1" />Listening together</span>
        </div>
        <div className="lp-room__title">Friday night cypher</div>
        <div className="lp-room__host">Hosted by Budnix · Hip hop community</div>
        <div className="lp-speakers">
          {speakers.map((s) => (
            <div key={s.name} className="lp-speaker">
              <span className={`lp-face ${s.speaking ? 'is-speaking' : ''}`} style={{ background: s.color }}>{s.initial}</span>
              <small>{s.name}</small>
            </div>
          ))}
        </div>
        <div className="lp-wave">
          {Array.from({ length: 30 }, (_, i) => <i key={i} style={{ animationDelay: `${-((i * 0.37) % 1.2)}s` }} />)}
        </div>
        <div className="lp-room__bar">
          <span><i className="bi bi-chat" /> Chat</span>
          <span><i className="bi bi-hand-index" /> Raise hand</span>
          <span><i className="bi bi-plus-lg" /> Join room</span>
        </div>
      </div>
      <div className="lp-event">
        <span className="lp-event__date"><span>SUN<br /><b>7</b></span></span>
        <span><strong>Tarot circle</strong><small>Moksha Holistic Healing · 7 PM</small></span>
      </div>
      <div className="lp-stage__note">
        <svg viewBox="0 0 42 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M40 22 C 28 24, 14 18, 8 6" /><path d="M8 6 L 4 14 M8 6 L 15 10" />
        </svg>
        <span className="lp-hand">a peek inside a live room</span>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const scrolled = useScrolled();
  useReveal();

  return (
    <div className="lp">
      <header className={`lp-nav ${scrolled ? 'is-solid' : ''}`}>
        <div className="container lp-nav__inner">
          <Logo />
          <nav className="lp-nav__links">
            {NAV.map((n) => <a key={n.href} href={n.href}>{n.label}</a>)}
          </nav>
          <div className="lp-nav__actions">
            <Link to="/login" className="lp-btn lp-btn--ghost">Log in</Link>
            <Link to="/signup" className="lp-btn lp-btn--join">Join us</Link>
          </div>
        </div>
      </header>

      <section className="lp-hero lp-canvas">
        <Artwork art="poppies" />
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span className="lp-pill"><span className="live-dot" /> A live community, not another feed</span>
              <h1 className="lp-hero__title">
                Find your <span className="lp-painted">people.<BrushStroke color={P.cadmium} /></span><br /><em>Experience it live.</em>
              </h1>
              <p className="lp-hero__lead">
                {APP_NAME} is where people gather around what they love: live rooms, communities and events with
                the hosts, creators and friends who share your world.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link to="/signup" className="lp-btn lp-btn--join lp-btn--lg">Join us, it&rsquo;s free <i className="bi bi-arrow-right" /></Link>
                <a href="#how" className="lp-btn lp-btn--ghost lp-btn--lg">See how it works</a>
              </div>
              <div className="lp-promises">
                <span><i className="bi bi-check2" />Free to join</span>
                <span><i className="bi bi-check2" />Host your own rooms</span>
                <span><i className="bi bi-check2" />No algorithmic feed</span>
              </div>
            </div>
            <div className="col-lg-6">
              <LiveRoomPreview />
            </div>
          </div>
        </div>
      </section>

      <div className="lp-marquee" aria-label="Interests on the platform">
        <div className="lp-marquee__track">
          {[0, 1].map((copy) => INTERESTS.map(([label, color, dark]) => (
            <span key={`${copy}-${label}`} className="lp-chip" aria-hidden={copy === 1}
                  style={{ '--dot': color, ...(dark ? { '--chip-ink': '#1d1a2b' } : {}) } as CSSProperties}>{label}</span>
          )))}
        </div>
      </div>

      <section id="how" className="lp-section">
        <div className="container">
          <div className="lp-reveal text-center">
            <span className="lp-eyebrow">how it works</span>
            <h2 className="lp-title">Three steps to <em>your people</em></h2>
            <p className="lp-sub mx-auto">No followers to chase, no feed to scroll. Just show up where the conversation is happening.</p>
          </div>
          <ol className="lp-gallery">
            {STEPS.map((s, i) => {
              const a = ARTWORKS[s.art];
              return (
                <li key={s.title} className="lp-exhibit lp-reveal" style={delay(i * 140)}>
                  <div className="lp-frame">
                    <img src={a.src} alt={`${a.title} by ${a.artist}`} loading="lazy" style={{ objectPosition: a.position }} />
                  </div>
                  <div className="lp-label">
                    <span className="lp-label__num">{ROMAN[i]}</span>
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                    <small><strong>{a.artist}</strong> · <em>{a.title}</em>, {a.year}</small>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section id="features" className="lp-section">
        <div className="container">
          <div className="lp-reveal">
            <span className="lp-eyebrow">everything in one place</span>
            <h2 className="lp-title">Built for <em>being together</em></h2>
            <p className="lp-sub">Real-time spaces with their own character, run by the people who care about them.</p>
          </div>
          <div className="lp-bento">
            {TILES.map((t, i) => (
              <article key={t.key} className={`lp-tile lp-tile--${t.key} lp-reveal`} style={delay((i % 3) * 100)}>
                <Watercolor washes={t.washes} />
                <i className={`bi bi-${t.icon} lp-tile__icon`} />
                {t.strokes && (
                  <div className="lp-tile__strokes" aria-hidden="true">
                    {Array.from({ length: 18 }, (_, j) => <i key={j} style={{ animationDelay: `${-((j * 0.29) % 1.4)}s` }} />)}
                  </div>
                )}
                <h3>{t.title}</h3>
                <p>{t.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="creators" className="lp-section pt-0">
        <div className="container">
          <div className="lp-reveal">
            <span className="lp-eyebrow">founding creators</span>
            <h2 className="lp-title">Hosts you can <em>join</em></h2>
            <p className="lp-sub">The first voices building their communities here.</p>
          </div>
          <div className="lp-creators">
            {CREATORS.map((c, i) => (
              <article key={c.name} className="lp-creator lp-reveal" style={delay(i * 120)}>
                <span className="lp-creator__avatar" style={{ '--pig': c.pig } as CSSProperties}><Watercolor washes={c.washes} /><span>{c.initial}</span></span>
                <div>
                  <h3>{c.name}</h3>
                  <p>{c.text}</p>
                  {c.tags.map(([icon, label, color]) => (
                    <span key={label} className="lp-tag" style={{ '--tag': color } as CSSProperties}><i className={`bi bi-${icon}`} />{label}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ContactSection />

      <section className="lp-section pt-0">
        <div className="container">
          <div className="lp-join lp-reveal">
            <Artwork art="starry" />
            <h2>Your people are <em>already here.</em></h2>
            <p>Join us and find the rooms, communities and hosts that feel like home.</p>
            <Link to="/signup" className="lp-btn lp-btn--paper lp-btn--lg">Join us now <i className="bi bi-arrow-right" /></Link>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="container lp-footer__inner">
          <Logo />
          <div className="d-flex flex-wrap gap-4">
            <a href="#how">How it works</a>
            <a href="#features">Features</a>
            <a href="#contact">Contact</a>
            <Link to="/login">Log in</Link>
            <Link to="/signup">Join us</Link>
          </div>
          <small>© {new Date().getFullYear()} {APP_NAME}. Built for people, not vanity metrics.</small>
        </div>
      </footer>
    </div>
  );
}
