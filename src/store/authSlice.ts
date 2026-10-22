import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthResponse, Session } from '@/types/api';

/**
 * The access token lives only in memory (never localStorage), so an XSS bug cannot steal a long-lived
 * credential. On reload the session is restored from the httpOnly refresh cookie.
 */
interface AuthState {
  accessToken: string | null;
  session: Session | null;
}

const initialState: AuthState = { accessToken: null, session: null };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authenticated(state, action: PayloadAction<AuthResponse>) {
      state.accessToken = action.payload.accessToken;
      state.session = action.payload.session;
    },
    sessionUpdated(state, action: PayloadAction<Session>) {
      state.session = action.payload;
    },
    loggedOut() {
      return initialState;
    },
  },
});

export const { authenticated, sessionUpdated, loggedOut } = authSlice.actions;
export default authSlice.reducer;
