/** Link types a profile can show, in display order. "portfolio" is the artist's main site and is highlighted. */
export const LINK_TYPES = [
  { key: 'portfolio', label: 'Portfolio', icon: 'palette', placeholder: 'https://your-portfolio.com' },
  { key: 'website', label: 'Website', icon: 'globe2', placeholder: 'https://...' },
  { key: 'instagram', label: 'Instagram', icon: 'instagram', placeholder: 'https://instagram.com/yourname' },
  { key: 'youtube', label: 'YouTube', icon: 'youtube', placeholder: 'https://youtube.com/@yourname' },
  { key: 'spotify', label: 'Spotify', icon: 'spotify', placeholder: 'https://open.spotify.com/artist/...' },
  { key: 'soundcloud', label: 'SoundCloud', icon: 'cloud', placeholder: 'https://soundcloud.com/yourname' },
  { key: 'x', label: 'X', icon: 'twitter-x', placeholder: 'https://x.com/yourname' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'linkedin', placeholder: 'https://linkedin.com/in/yourname' },
] as const;

export const VISIBILITY = [
  { value: 'PUBLIC', label: 'Everyone', hint: 'Anyone on artisticView can see your bio, interests and links.' },
  { value: 'MEMBERS', label: 'Members', hint: 'Only signed-in members can see your full profile.' },
  { value: 'FOLLOWERS', label: 'Followers', hint: 'Only people who follow you see your bio, interests and links.' },
] as const;
