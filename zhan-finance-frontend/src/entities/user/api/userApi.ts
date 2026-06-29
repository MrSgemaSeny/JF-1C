import { apiRequest } from '@/shared/api/http';

export interface UserProfileDto {
  id: number;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'CLIENT' | 'LEARNER';
  phone?: string;
  companyName?: string;
  avatarUrl?: string;
  authProvider: 'LOCAL' | 'GOOGLE';
  assignedEmployeeId?: number;
  assignedEmployeeName?: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  phone?: string;
  companyName?: string;
}

export interface UpdatePasswordRequest {
  currentPassword?: string;
  newPassword?: string;
}

export async function getAllLearners(): Promise<UserProfileDto[]> {
  const data = await apiRequest<{ data: UserProfileDto[] }>('/admin/learners');
  return data.data;
}

export async function createLearner(request: any): Promise<void> {
  await apiRequest('/admin/learners', {
    method: 'POST',
    body: JSON.stringify(request)
  });
}

export async function getMyProfile(): Promise<UserProfileDto> {
  return apiRequest<UserProfileDto>('/api/users/me');
}

export async function updateMyProfile(request: UpdateProfileRequest): Promise<UserProfileDto> {
  return apiRequest<UserProfileDto>('/api/users/me', {
    method: 'PUT',
    body: JSON.stringify(request)
  });
}

export async function updateMyPassword(request: UpdatePasswordRequest): Promise<void> {
  return apiRequest<void>('/api/users/me/password', {
    method: 'PUT',
    body: JSON.stringify(request)
  });
}

export async function uploadAvatar(file: File): Promise<UserProfileDto> {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest<UserProfileDto>('/api/users/me/avatar', {
    method: 'POST',
    body: formData,
    // Do not set Content-Type header, the browser will automatically set it to multipart/form-data with boundary
    headers: {} 
  });
}
