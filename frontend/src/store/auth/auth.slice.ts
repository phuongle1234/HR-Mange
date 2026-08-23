import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

export interface AuthState {
  accessToken: string | null;
  authStatus: AuthStatus;
  currentUser: AuthUser | null;
  authError: string | null;
}

const initialState: AuthState = {
  accessToken: null,
  authStatus: 'checking',
  currentUser: null,
  authError: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthChecking(state, action: PayloadAction<string | undefined>) {
      state.authStatus = 'checking';
      state.authError = null;
      // A token may be supplied so the request interceptor can attach it to
      // the Get-Me verification call before authStatus becomes 'authenticated'.
      if (action.payload) {
        state.accessToken = action.payload;
      }
    },
    setAuthenticated(
      state,
      action: PayloadAction<{ accessToken: string; currentUser: AuthUser }>,
    ) {
      state.accessToken = action.payload.accessToken;
      state.currentUser = action.payload.currentUser;
      state.authStatus = 'authenticated';
      state.authError = null;
    },
    setUnauthenticated(state) {
      state.accessToken = null;
      state.currentUser = null;
      state.authStatus = 'unauthenticated';
    },
    setAuthError(state, action: PayloadAction<string>) {
      state.authError = action.payload;
    },
    clearAuth(state) {
      state.accessToken = null;
      state.currentUser = null;
      state.authStatus = 'unauthenticated';
      state.authError = null;
    },
  },
});

export const {
  setAuthChecking,
  setAuthenticated,
  setUnauthenticated,
  setAuthError,
  clearAuth,
} = authSlice.actions;

export default authSlice.reducer;
