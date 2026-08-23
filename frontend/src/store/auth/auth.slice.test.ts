import { describe, expect, it } from 'vitest';
import authReducer, {
  clearAuth,
  setAuthChecking,
  setAuthenticated,
  setAuthError,
  setUnauthenticated,
  type AuthState,
} from './auth.slice';

const initialState: AuthState = {
  accessToken: null,
  authStatus: 'checking',
  currentUser: null,
  authError: null,
};

describe('authSlice', () => {
  it('has the expected empty initial shape', () => {
    const state = authReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialState);
  });

  it('setAuthChecking resets to checking and clears authError', () => {
    const state = authReducer(
      { ...initialState, authError: 'boom' },
      setAuthChecking(undefined),
    );
    expect(state.authStatus).toBe('checking');
    expect(state.authError).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it('setAuthChecking can carry a token forward so the interceptor can attach it', () => {
    const state = authReducer(initialState, setAuthChecking('token-123'));
    expect(state.authStatus).toBe('checking');
    expect(state.accessToken).toBe('token-123');
  });

  it('setAuthenticated stores the token and user, and marks authenticated', () => {
    const user = { id: '1', email: 'a@b.com', fullName: 'A B' };
    const state = authReducer(initialState, setAuthenticated({ accessToken: 'tok', currentUser: user }));
    expect(state).toEqual({
      accessToken: 'tok',
      authStatus: 'authenticated',
      currentUser: user,
      authError: null,
    });
  });

  it('setUnauthenticated clears token and user', () => {
    const authenticated: AuthState = {
      accessToken: 'tok',
      authStatus: 'authenticated',
      currentUser: { id: '1', email: 'a@b.com', fullName: 'A B' },
      authError: null,
    };
    const state = authReducer(authenticated, setUnauthenticated());
    expect(state.authStatus).toBe('unauthenticated');
    expect(state.accessToken).toBeNull();
    expect(state.currentUser).toBeNull();
  });

  it('setAuthError records a safe error message without touching the session', () => {
    const state = authReducer(initialState, setAuthError('Network error'));
    expect(state.authError).toBe('Network error');
  });

  it('clearAuth resets everything to unauthenticated (used on logout / 401)', () => {
    const authenticated: AuthState = {
      accessToken: 'tok',
      authStatus: 'authenticated',
      currentUser: { id: '1', email: 'a@b.com', fullName: 'A B' },
      authError: null,
    };
    const state = authReducer(authenticated, clearAuth());
    expect(state).toEqual({
      accessToken: null,
      authStatus: 'unauthenticated',
      currentUser: null,
      authError: null,
    });
  });
});
