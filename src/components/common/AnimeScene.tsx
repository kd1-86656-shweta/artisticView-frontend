import { memo, useId } from 'react';

/**
 * An original anime-style landscape (golden hour or night): soft cumulus clouds, hazy mountains,
 * rim-lit hills, a lone tree and a small listener on the hill. Canvas is 1200×700, cropped to fill.
 */

type Circle = [cx: number, cy: number, r: number];

const CLOUDS: Circle[][] = [
  [[150, 150, 46], [205, 125, 60], [275, 140, 52], [330, 162, 38], [100, 172, 32], [240, 175, 44]],
  [[560, 90, 34], [610, 70, 46], [668, 84, 40], [712, 102, 28], [520, 108, 24], [640, 108, 34]],
  [[930, 190, 50], [1000, 160, 70], [1080, 175, 58], [1140, 200, 40], [880, 212, 34], [1030, 215, 48]],
  [[400, 300, 24], [440, 288, 32], [482, 300, 26], [372, 312, 18]],
];

const PALETTE = {
  day: {
    sky: ['#2f62b0', '#5b98d8', '#a9cfe9', '#fbe2c0', '#ffbe8f'],
    sun: '#fff4d6', glow: '#ffd99a',
    cloudTop: '#ffffff', cloudBottom: '#fde3cf', cloudShade: '#e9b3a6',
    far: ['#9fb0dc', '#d8cbe0'], near: ['#6f8cc4', '#aebfde'],
    hillBack: ['#8fcb6e', '#5c9f50'], hillFront: ['#5aa04c', '#2f6b35'], rim: '#fff0a0',
    tree: ['#7cc363', '#3f8a40', '#2b5f31'], trunk: '#4a3328',
    grass: ['#1f4a28', '#2f6b35', '#3f7a3a'], figure: '#283252',
    flowers: ['#ffffff', '#ffe27a', '#ff9db5'],
  },
  night: {
    sky: ['#0b1636', '#1b2f66', '#33508f', '#5f6aa8', '#8a78b0'],
    sun: '#fffbea', glow: '#c9d6ff',
    cloudTop: '#a9b6e6', cloudBottom: '#6c74b0', cloudShade: '#3d4783',
    far: ['#3c4a86', '#56609c'], near: ['#2c3a72', '#46548e'],
    hillBack: ['#2f5a5a', '#22424a'], hillFront: ['#1f3e3e', '#122428'], rim: '#b9c8ff',
    tree: ['#2f5f55', '#1f4040', '#132a2c'], trunk: '#1d1a22',
    grass: ['#0c1a1c', '#132a2c', '#1a3534'], figure: '#0c1020',
    flowers: ['#dfe8ff', '#fff2a8', '#c9b8ff'],
  },
};

function AnimeScene({ night = false, className = '' }: { night?: boolean; className?: string }) {
  const id = useId().replace(/:/g, '');
  const p = night ? PALETTE.night : PALETTE.day;
  const u = (name: string) => `${name}-${id}`;
  const sun = night ? { x: 930, y: 120, r: 34 } : { x: 560, y: 405, r: 46 };

  return (
    <svg className={`anime ${className}`} viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={u('sky')} x1="0" y1="0" x2="0" y2="1">
          {p.sky.map((c, i) => <stop key={c} offset={i / (p.sky.length - 1)} stopColor={c} />)}
        </linearGradient>
        <radialGradient id={u('glow')}>
          <stop offset="0" stopColor={p.glow} stopOpacity="0.95" />
          <stop offset="0.35" stopColor={p.glow} stopOpacity="0.45" />
          <stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={u('far')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.far[0]} /><stop offset="1" stopColor={p.far[1]} /></linearGradient>
        <linearGradient id={u('near')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.near[0]} /><stop offset="1" stopColor={p.near[1]} /></linearGradient>
        <linearGradient id={u('hb')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.hillBack[0]} /><stop offset="1" stopColor={p.hillBack[1]} /></linearGradient>
        <linearGradient id={u('hf')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.hillFront[0]} /><stop offset="1" stopColor={p.hillFront[1]} /></linearGradient>
        <linearGradient id={u('canopy')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.tree[0]} /><stop offset="1" stopColor={p.tree[1]} /></linearGradient>
        {CLOUDS.map((c, i) => {
          const top = Math.min(...c.map(([, y, r]) => y - r));
          const bottom = Math.max(...c.map(([, y, r]) => y + r));
          return (
            <linearGradient key={i} id={u(`cl${i}`)} gradientUnits="userSpaceOnUse" x1="0" y1={top} x2="0" y2={bottom}>
              <stop offset="0.25" stopColor={p.cloudTop} /><stop offset="1" stopColor={p.cloudBottom} />
            </linearGradient>
          );
        })}
        <filter id={u('soft')}><feGaussianBlur stdDeviation="1.2" /></filter>
        {/* hand-painted finish: wobble every edge slightly, like a brush rather than a vector pen */}
        <filter id={u('hand')} x="-2%" y="-2%" width="104%" height="104%">
          <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="8" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* gouache texture: streaky noise that darkens and lightens the paint in brush-like patches */}
        <filter id={u('gouache')} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.06" numOctaves="4" seed="3" />
          <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 1.4 -0.55" />
        </filter>
        <filter id={u('paper')} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="11" />
          <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.25  0 0 0 0.5 0" />
        </filter>
      </defs>

      <g filter={`url(#${u('hand')})`}>
      <rect x="-20" y="-20" width="1240" height="740" fill={`url(#${u('sky')})`} />

      {night && (
        <g className="anime__stars" fill="#fff">
          {[[80, 60], [210, 40], [330, 90], [470, 30], [620, 70], [760, 40], [1080, 60], [1160, 140], [40, 200], [520, 160], [700, 210], [1010, 250], [300, 230], [860, 300]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 ? 1.4 : 2.2} style={{ animationDelay: `${-(i * 0.7) % 4}s` }} />
          ))}
        </g>
      )}

      {/* sun or moon with a soft glow and slow-turning rays */}
      <circle cx={sun.x} cy={sun.y} r={sun.r * 5} fill={`url(#${u('glow')})`} />
      {!night && (
        <g className="anime__rays" style={{ transformOrigin: `${sun.x}px ${sun.y}px` }} fill={p.glow} opacity="0.18">
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * Math.PI) / 6;
            const b = a + 0.07;
            return <path key={i} d={`M${sun.x} ${sun.y}L${sun.x + Math.cos(a) * 900} ${sun.y + Math.sin(a) * 900}L${sun.x + Math.cos(b) * 900} ${sun.y + Math.sin(b) * 900}Z`} />;
          })}
        </g>
      )}
      <circle cx={sun.x} cy={sun.y} r={sun.r} fill={p.sun} />
      {night && <circle cx={sun.x + 14} cy={sun.y - 8} r={sun.r * 0.92} fill={p.sky[0]} opacity="0.9" />}

      {/* clouds: a shaded underside, then the lit body on top */}
      {CLOUDS.map((c, i) => (
        <g key={i} className={`anime__cloud anime__cloud--${i}`}>
          <g fill={p.cloudShade} opacity="0.7" transform="translate(6 9)">
            {c.map(([x, y, r], j) => <circle key={j} cx={x} cy={y} r={r} />)}
          </g>
          <g fill={`url(#${u(`cl${i}`)})`}>
            {c.map(([x, y, r], j) => <circle key={j} cx={x} cy={y} r={r} />)}
          </g>
        </g>
      ))}

      {/* birds */}
      {!night && (
        <g fill="none" stroke="#3b3f5c" strokeWidth="2" strokeLinecap="round" className="anime__birds">
          <path d="M760 250q8-8 16 0q8-8 16 0" /><path d="M800 228q6-6 12 0q6-6 12 0" /><path d="M735 232q5-5 10 0q5-5 10 0" />
        </g>
      )}

      {/* mountains */}
      <path d="M0 430L90 360L170 395L290 300L380 370L470 330L560 395L660 320L760 380L880 290L990 360L1080 330L1200 380V470H0Z" fill={`url(#${u('far')})`} opacity="0.85" />
      <path d="M0 455L120 400L220 430L330 380L450 440L540 410L640 450L760 400L860 440L980 395L1100 430L1200 410V480H0Z" fill={`url(#${u('near')})`} opacity="0.9" />

      {/* hills with warm rim light along the ridge */}
      <path d="M0 500C180 440 360 455 520 485C700 520 860 450 1200 470V700H0Z" fill={`url(#${u('hb')})`} />
      <path d="M0 500C180 440 360 455 520 485C700 520 860 450 1200 470" fill="none" stroke={p.rim} strokeWidth="3" opacity="0.65" filter={`url(#${u('soft')})`} />
      <path d="M0 600C200 540 420 545 620 570C820 595 980 540 1200 548V700H0Z" fill={`url(#${u('hf')})`} />
      <path d="M0 600C200 540 420 545 620 570C820 595 980 540 1200 548" fill="none" stroke={p.rim} strokeWidth="3" opacity="0.55" filter={`url(#${u('soft')})`} />

      {/* lone tree on the right */}
      <g>
        <path d="M1062 560C1066 520 1060 480 1050 440L1064 438C1076 478 1084 520 1082 562Z" fill={p.trunk} />
        <path d="M1056 470L1022 445M1070 465L1100 440" stroke={p.trunk} strokeWidth="6" strokeLinecap="round" />
        <g fill={p.tree[2]} transform="translate(5 10)">
          {[[1000, 430, 46], [1060, 395, 62], [1125, 430, 50], [1030, 460, 40], [1100, 465, 42]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}
        </g>
        <g fill={`url(#${u('canopy')})`}>
          {[[1000, 430, 46], [1060, 395, 62], [1125, 430, 50], [1030, 460, 40], [1100, 465, 42]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}
        </g>
        <g fill={p.rim} opacity="0.35">
          <circle cx="1040" cy="372" r="16" /><circle cx="985" cy="410" r="12" /><circle cx="1105" cy="405" r="13" />
        </g>
      </g>

      {/* the listener: sitting on the hill with headphones, looking at the sky */}
      <g fill={p.figure} transform="translate(545 556) scale(1.35)">
        <path d="M-18 22C-20 6 -14 -6 0 -8C14 -6 18 6 16 22Z" />
        <path d="M10 18L34 20L36 26L8 26Z" />
        <circle cx="0" cy="-20" r="11" />
        <path d="M-11 -22C-12 -34 10 -36 12 -24C8 -30 -4 -31 -11 -22Z" />
        <path d="M-12 -21a12 12 0 0 1 24 0" fill="none" stroke={p.figure} strokeWidth="3" />
        <rect x="-14" y="-23" width="5" height="8" rx="2" fill={night ? '#ffd27a' : '#e8603c'} />
      </g>

      {/* flowers on the front hill */}
      {Array.from({ length: 46 }, (_, i) => {
        const x = (i * 97) % 1200;
        const y = 600 + ((i * 53) % 70) - Math.sin(x / 200) * 20;
        return <circle key={i} cx={x} cy={y} r={2 + (i % 3)} fill={p.flowers[i % p.flowers.length]} opacity="0.9" />;
      })}

      {/* foreground grass framing the bottom edge */}
      <g fill={p.grass[0]}>
        {Array.from({ length: 90 }, (_, i) => {
          const x = i * 13.5 - 10;
          const h = 26 + ((i * 37) % 30) + (i % 7 === 0 ? 20 : 0);
          const lean = ((i * 17) % 11) - 5;
          return <path key={i} d={`M${x} 712Q${x + lean} ${712 - h / 2} ${x + lean * 1.6} ${712 - h}Q${x + 4} ${712 - h / 2} ${x + 9} 712Z`} fill={p.grass[i % 3]} />;
        })}
      </g>
      </g>

      {/* paint and paper texture laid over everything */}
      <rect width="1200" height="700" filter={`url(#${u('gouache')})`} style={{ mixBlendMode: 'soft-light' }} opacity="0.55" />
      <rect width="1200" height="700" filter={`url(#${u('paper')})`} style={{ mixBlendMode: 'multiply' }} opacity="0.35" />
    </svg>
  );
}

export default memo(AnimeScene);
