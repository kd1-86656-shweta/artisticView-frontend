/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Full WebSocket URL of the backend, e.g. wss://api.example.com/ws. Empty = same origin. */
  readonly VITE_WS_URL?: string;
  /** Base URL for uploads, ending in "/", e.g. https://api.example.com/. Empty = same origin. */
  readonly VITE_UPLOAD_URL?: string;
}
