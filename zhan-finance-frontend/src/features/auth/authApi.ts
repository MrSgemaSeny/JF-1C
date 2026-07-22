import { apiRequest, API_BASE_URL } from '@/shared/api/http';

export type UserRole = 'ADMIN' | 'EMPLOYEE' | 'CLIENT' | 'LEARNER';

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

export interface CheckEmailResponse {
  exists: boolean;
  provider: 'LOCAL' | 'GOOGLE' | null;
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

export async function refresh(request: RefreshRequest): Promise<AuthResponse> {
  const url = `${API_BASE_URL}/api/auth/refresh`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  
  if (!response.ok) {
    throw new Error('Refresh failed');
  }
  
  const json = await response.json();
  if (json.success === false) {
    throw new Error(json.message || 'Refresh failed');
  }
  
  return json.data as AuthResponse;
}

export async function loginWithGoogle(credential: string, role?: 'CLIENT' | 'EMPLOYEE'): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential, role })
  });
}

export function checkEmail(email: string): Promise<CheckEmailResponse> {
  return apiRequest<CheckEmailResponse>('/api/auth/check-email', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}