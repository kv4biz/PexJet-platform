// Authentication Types

export interface LoginCredentials {
  identifier: string; // email or username
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: "SUPER_ADMIN" | "STAFF" | "OPERATOR";
  type: "admin" | "operator";
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  sub: string;
  type: "admin" | "operator";
  iat: number;
  exp: number;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phone: string;
  role: "SUPER_ADMIN" | "STAFF" | "OPERATOR";
  avatar?: string | null;
}

export interface PasswordResetRequest {
  identifier: string; // email or username
}

export interface PasswordResetVerify {
  identifier: string;
  otp: string;
}

export interface PasswordResetComplete {
  identifier: string;
  otp: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  username?: string;
  phone?: string;
  avatar?: string;
}
