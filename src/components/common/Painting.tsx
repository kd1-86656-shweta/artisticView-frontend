import { memo, useId } from 'react';

/**
 * A procedurally painted landscape in the Impressionist manner: sky with clouds and sun, distant mountains,
 * green hills, trees, a lake and a flowering meadow, all built from short brush dabs. A seeded random keeps
 * the painting identical on every render. Canvas is 1200×700 and is cropped to fill its container.
 */

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Dab = { d: string; c: string; w: number; o: number };

const SKY = ['#4a7fc1', '#5b8fcb', '#6fa0d2', '#86b2da', '#a2c4e2', '#bfd6e8', '#dfe3e0', '#f2dcb4', '#f6d4a2'];
const CLOUD = ['#ffffff', '#fbf6ec', '#f3e7f0', '#e9eef6', '#fde8d4'];
const SUN = ['#fff4c9', '#ffe79a', '#fbd76b', '#fff9e3'];
const MOUNTAIN = ['#7d86bd', '#8f96c8', '#6f78b0', '#a3a6d1', '#8a7fb8'];
const HILL = ['#7fa858', '#6c9a4c', '#8fb865', '#5e8c45', '#a3c46e', '#4f7d3a'];
const TREE = ['#2f5a35', '#3c6b3c', '#4a7d40', '#26492d', '#5e8f48'];
const TREE_LIGHT = ['#9cc26a', '#b6d47c', '#7fae55'];
const LAKE = ['#5d8fc4', '#79a6d2', '#4a7fb8', '#a6c6e2', '#ffffff'];
const GRASS = ['#5f8f3e', '#76a64c', '#8db85a', '#4c7a33', '#a7c867', '#3f6a2c'];
const FLOWERS = ['#d9472b', '#e8603c', '#f2c94c', '#fbe38a', '#ffffff', '#a58fd0', '#c46aa0'];

function buildDabs(seed: number): Dab[] {
  const r = rng(seed);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const out: Dab[] = [];
  const dash = (x: number, y: number, len: number, tilt: number, c: string, w: number, o = 0.9) =>
    out.push({ d: `M${x.toFixed(1)} ${y.toFixed(1)}q${(len / 2).toFixed(1)} ${((r() - 0.5) * 5).toFixed(1)} ${len.toFixed(1)} ${tilt.toFixed(1)}`, c, w, o });
  const dot = (x: number, y: number, c: string, w: number, o = 0.95) =>
    out.push({ d: `M${x.toFixed(1)} ${y.toFixed(1)}l${(1 + r() * 3).toFixed(1)} ${((r() - 0.5) * 2).toFixed(1)}`, c, w, o });

  // Sky: horizontal dabs, deeper blue at the top warming to peach at the horizon.
  for (let y = 0; y < 380; y += 7) {
    const band = Math.min(SKY.length - 1, Math.max(0, Math.floor((y / 380) * SKY.length + (r() - 0.5) * 1.8)));
    for (let x = -30; x < 1230; x += 22 + r() * 30) dash(x, y, 26 + r() * 36, (r() - 0.5) * 5, SKY[band], 7 + r() * 5, 0.85);
  }

  // Sun glow, upper right.
  for (let rad = 3; rad < 120; rad += 6) {
    for (let a = r(); a < Math.PI * 2; a += 0.5 + r() * 0.4) {
      const x = 960 + Math.cos(a) * rad, y = 110 + Math.sin(a) * rad;
      dash(x, y, 12 + r() * 10, (r() - 0.5) * 6, rad < 34 ? pick(SUN) : pick(['#fde8b0', '#f9edd0', '#e8eef0']), rad < 34 ? 6 : 5, rad < 34 ? 0.95 : 0.4 * (1 - rad / 120) + 0.15);
    }
  }

  // Clouds: soft clusters of pale dabs drifting across the sky.
  for (const [cx, cy, sx, sy] of [[220, 90, 150, 34], [560, 60, 120, 26], [700, 190, 170, 30], [330, 230, 110, 22], [1120, 240, 110, 24]]) {
    for (let i = 0; i < 70; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r());
      dash(cx + Math.cos(a) * sx * d, cy + Math.sin(a) * sy * d * (Math.sin(a) < 0 ? 1.5 : 0.7), 18 + r() * 26, (r() - 0.5) * 4, pick(CLOUD), 7 + r() * 5, 0.75);
    }
  }

  // Distant mountains, hazy violet-blue.
  for (let y = 250; y < 420; y += 6) {
    for (let x = -30; x < 1230; x += 20 + r() * 26) {
      const top = 330 - Math.abs(Math.sin(x * 0.006 + 1.2)) * 80 - Math.sin(x * 0.017) * 18;
      if (y < top) continue;
      const tilt = Math.cos(x * 0.006 + 1.2) * -10;
      dash(x, y, 20 + r() * 26, tilt * (r() * 0.6), pick(MOUNTAIN), 6 + r() * 4, 0.8 - (y - top) / 600);
    }
  }

  // Rolling hills in greens.
  for (const [base, amp, f, ph] of [[390, 26, 0.005, 0.4], [420, 20, 0.008, 2.2]]) {
    for (let y = base - amp; y < 520; y += 6) {
      for (let x = -30; x < 1230; x += 22 + r() * 26) {
        const top = base + Math.sin(x * f + ph) * amp;
        if (y < top) continue;
        dash(x, y, 22 + r() * 30, Math.cos(x * f + ph) * amp * f * 30, pick(HILL), 7 + r() * 4, 0.92);
      }
    }
  }

  // Lake: a band of horizontal blues with white glints, reflecting the sky.
  for (let y = 468; y < 520; y += 5) {
    const half = 330 - (y - 468) * 2.5;
    for (let x = 620 - half; x < 620 + half; x += 16 + r() * 22) {
      const c = r() < 0.07 ? '#ffffff' : pick(LAKE);
      dash(x, y, 18 + r() * 28, (r() - 0.5) * 2, c, c === '#ffffff' ? 3 : 6, 0.9);
    }
  }

  // Trees: trunks and round clusters of foliage dabs, light on top.
  for (const [tx, ty, size] of [[90, 380, 95], [190, 420, 60], [1060, 400, 80], [1150, 430, 55], [880, 440, 40]]) {
    out.push({ d: `M${tx} ${ty + size * 0.9}l${(r() - 0.5) * 6} ${-size * 0.9}`, c: '#4a3324', w: size / 9, o: 0.95 });
    for (let i = 0; i < size * 2.2; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r());
      const x = tx + Math.cos(a) * size * 0.75 * d;
      const y = ty - size * 0.3 + Math.sin(a) * size * 0.85 * d;
      const light = y < ty - size * 0.45 && r() < 0.5;
      dash(x, y, 9 + r() * 12, (r() - 0.5) * 10, light ? pick(TREE_LIGHT) : pick(TREE), 7 + r() * 4, 0.95);
    }
  }

  // Meadow: upright grass strokes with flowers dotted through, bigger in the foreground.
  for (let y = 500; y < 720; y += 6) {
    const depth = (y - 500) / 220;
    for (let x = -30; x < 1230; x += 9 + r() * 14 - depth * 4) {
      const h = 10 + depth * 26 + r() * 10;
      out.push({ d: `M${x.toFixed(1)} ${y.toFixed(1)}q${((r() - 0.5) * 6).toFixed(1)} ${(-h / 2).toFixed(1)} ${((r() - 0.5) * 10).toFixed(1)} ${(-h).toFixed(1)}`, c: pick(GRASS), w: 3 + depth * 4, o: 0.9 });
      if (r() < 0.16 + depth * 0.1) dot(x + (r() - 0.5) * 8, y - h, pick(FLOWERS), 5 + depth * 8);
    }
  }

  return out;
}

function Painting({ seed = 21, className = '' }: { seed?: number; className?: string }) {
  const id = useId().replace(/:/g, '');
  const dabs = buildDabs(seed);
  return (
    <svg className={`painting ${className}`} viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <filter id={`paint-${id}`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="5" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="5" />
        </filter>
        <linearGradient id={`under-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b8fcb" /><stop offset="0.5" stopColor="#d9e2e2" /><stop offset="0.6" stopColor="#7fa858" /><stop offset="1" stopColor="#4c7a33" />
        </linearGradient>
      </defs>
      <rect width="1200" height="700" fill={`url(#under-${id})`} />
      <g filter={`url(#paint-${id})`} fill="none" strokeLinecap="round">
        {dabs.map((s, i) => <path key={i} d={s.d} stroke={s.c} strokeWidth={s.w} opacity={s.o} />)}
      </g>
    </svg>
  );
}

export default memo(Painting);
