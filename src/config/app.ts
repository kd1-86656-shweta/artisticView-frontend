/** Working product name; change it here when the final name is chosen. */
export const APP_NAME = 'artisticView';
export const APP_TAGLINE = 'Find your people. Experience it live.';

/** Contact box on the public site. PLACEHOLDER: set the real inbox and address. */
export const CONTACT_EMAIL = 'hello@artisticview.com';
export const CONTACT_ADDRESS = '';

/**
 * Where uploads go. Empty = same origin. On Vercel, set VITE_UPLOAD_URL to the backend
 * (e.g. https://api.example.com/) because Vercel's proxy caps request bodies far below our 100 MB video limit.
 */
export const UPLOAD_BASE = import.meta.env.VITE_UPLOAD_URL ?? '/';
