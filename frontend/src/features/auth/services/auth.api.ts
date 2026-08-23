import { ApiEndpoints } from '../../../shared/api/api-endpoints';
import { baseApiService } from '../../../shared/api/base-api.service';
import type { AuthUser } from '../../../store/auth/auth.slice';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  user: AuthUser;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

/**
 * Auth API service. Pages call hooks, hooks call this service — never Axios
 * directly, per docs/07-frontend/api-client.md.
 */
export const authApiService = {
  login(payload: LoginPayload): Promise<LoginResult> {
    return baseApiService.post<LoginResult>(ApiEndpoints.auth.login(), payload);
  },
  getMe(): Promise<AuthUser> {
    return baseApiService.get<AuthUser>(ApiEndpoints.auth.me());
  },
  logout(): Promise<null> {
    return baseApiService.post<null>(ApiEndpoints.auth.logout());
  },
  changePassword(payload: ChangePasswordPayload): Promise<null> {
    return baseApiService.post<null>(ApiEndpoints.auth.changePassword(), payload);
  },
  forgotPassword(payload: ForgotPasswordPayload): Promise<null> {
    return baseApiService.post<null>(ApiEndpoints.auth.forgotPassword(), payload);
  },
};
