import type { RootState } from '../index';

export const selectAuthStatus = (state: RootState) => state.auth.authStatus;
export const selectCurrentUser = (state: RootState) => state.auth.currentUser;
export const selectAccessToken = (state: RootState) => state.auth.accessToken;
export const selectAuthError = (state: RootState) => state.auth.authError;
