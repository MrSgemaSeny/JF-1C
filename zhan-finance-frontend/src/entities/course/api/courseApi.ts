import { apiRequest } from '@/shared/api/http';

export interface CourseDto {
  id: number;
  title: string;
  description: string;
  thumbnail?: string;
  isPublished: boolean;
  lessons: LessonDto[];
}

export interface LessonDto {
  id: number;
  title: string;
  description: string;
  content?: string;
  type: 'VIDEO' | 'PRESENTATION' | 'DOCUMENT';
  fileName?: string;
  contentType?: string;
  fileSize?: number;
  orderIndex: number;
}

// Learner API
export async function getPublishedCourses(): Promise<CourseDto[]> {
  return await apiRequest<CourseDto[]>('/api/courses');
}

export async function getCourseById(id: number): Promise<CourseDto> {
  return await apiRequest<CourseDto>(`/api/courses/${id}`);
}

// Admin API
export async function getAdminCourses(): Promise<CourseDto[]> {
  return await apiRequest<CourseDto[]>('/api/admin/courses');
}

export async function getAdminCourseById(id: number): Promise<CourseDto> {
  return await apiRequest<CourseDto>(`/api/admin/courses/${id}`);
}

export async function createCourse(title: string, description: string, isPublished: boolean): Promise<CourseDto> {
  const formData = new URLSearchParams();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('isPublished', String(isPublished));

  return await apiRequest<CourseDto>('/api/admin/courses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  });
}

export async function updateCourse(id: number, title: string, description: string, isPublished: boolean): Promise<CourseDto> {
  const formData = new URLSearchParams();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('isPublished', String(isPublished));

  return await apiRequest<CourseDto>(`/api/admin/courses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  });
}

export async function createLesson(
  courseId: number, 
  title: string, 
  description: string, 
  type: string, 
  file?: File
): Promise<LessonDto> {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('type', type);
  if (file) {
    formData.append('file', file);
  }

  return await apiRequest<LessonDto>(`/api/admin/courses/${courseId}/lessons`, {
    method: 'POST',
    body: formData // Note: Content-Type is intentionally omitted for FormData
  });
}

export async function deleteLesson(lessonId: number): Promise<void> {
  await apiRequest(`/api/admin/courses/lessons/${lessonId}`, {
    method: 'DELETE',
  });
}

export async function updateLesson(
  lessonId: number,
  title?: string,
  description?: string,
  content?: string,
  orderIndex?: number,
  file?: File
): Promise<LessonDto> {
  const formData = new FormData();
  if (title !== undefined) formData.append('title', title);
  if (description !== undefined) formData.append('description', description);
  if (content !== undefined) formData.append('content', content);
  if (orderIndex !== undefined) formData.append('orderIndex', String(orderIndex));
  if (file !== undefined) formData.append('file', file);

  return await apiRequest<LessonDto>(`/api/admin/courses/lessons/${lessonId}`, {
    method: 'PUT',
    body: formData
  });
}

export async function uploadMedia(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  return await apiRequest<{ url: string }>('/api/admin/media/upload', {
    method: 'POST',
    body: formData
  });
}
