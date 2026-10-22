import { useId } from 'react';

/** One pigment wash: centre and radius in a 1000×600 canvas, colour, opacity. */
export type Wash = [cx: number, cy: number, r: number, color: string, opacity?: number];

/**
 * Soft watercolour washes behind a section. Turbulence displaces each blob's edge so it bleeds
 * like paint on paper instead of reading as a perfect gradient circle.
 */
export default function Watercolor({ washes, className = '' }: { washes: Wash[]; className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={`wc ${className}`} viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <filter id={`wc-${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="4" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="90" xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <g filter={`url(#wc-${id})`}>
        {washes.map(([cx, cy, r, color, opacity = 0.35], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill={color} opacity={opacity} />
        ))}
      </g>
    </svg>
  );
}

/** A hand-painted brush stroke, used to underline a word. */
export function BrushStroke({ color = 'var(--ochre)' }: { color?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className="brush" viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <filter id={`br-${id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="4" />
        </filter>
      </defs>
      <path d="M4 15 C 60 6, 140 8, 200 11 S 280 14, 296 9" stroke={color} strokeWidth="9" strokeLinecap="round" fill="none" filter={`url(#br-${id})`} opacity="0.85" />
      <path d="M20 19 C 90 14, 170 15, 270 16" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.45" />
    </svg>
  );
}
