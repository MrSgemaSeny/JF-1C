import { apiRequest } from '@/shared/api/http';

export type UserRole = 'ADMIN' | 'EMPLOYEE' | 'CLIENT';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  isNewUser: boolean;
  avatarUrl?: string;
  authProvider: 'LOCAL' | 'GOOGLE';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: 'CLIENT' | 'EMPLOYEE';
  phone?: string;
  companyName?: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface GoogleLoginRequest {
  credential: string;
}

export function login(request: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(request)
  });
}

export function register(request: RegisterRequest): Promise<AuthResponse | null> {
  return apiRequest<AuthResponse | null>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(request)
  });
}

export function refresh(request: RefreshRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify(request)
  });
}

export async function loginWithGoogle(credential: string, role?: 'CLIENT' | 'EMPLOYEE'): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential, role })
  });
}