interface AvatarProps {
  name: string;
  url?: string | null;
  size?: number;
}

const PALETTE = ['#7c5cff', '#ff6b4a', '#1fb5a8', '#f5a524', '#e5487a', '#3b82f6'];

/** Photo when there is one, otherwise initials on a colour picked from the name (stable per person). */
export default function Avatar({ name, url, size = 40 }: AvatarProps) {
  const style = { width: size, height: size, fontSize: size * 0.4 };
  if (url) {
    return <img src={url} alt={name} className="rounded-circle object-fit-cover flex-shrink-0" style={style} />;
  }
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
  const color = PALETTE[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % PALETTE.length];
  return (
    <span
      className="rounded-circle d-inline-flex align-items-center justify-content-center fw-semibold text-white flex-shrink-0"
      style={{ ...style, background: color }}
      aria-hidden="true"
    >
      {initials || '?'}
    </span>
  );
}
