import { AuthUser } from './auth-user.model';

export interface LoginPayload {
  email: string;
  password: string;
}

/** Shape of `result` from POST /auth/user/login. */
export interface LoginResult {
  token: string;
  user: AuthUser;
}
