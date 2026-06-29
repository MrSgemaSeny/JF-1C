import { apiRequest } from '@/shared/api/http';

export interface CourseDto {
  id: number;
  title: string;
  description: string;
  thumbnail?: string;
  isPublished: boolean;
  sections: CourseSectionDto[];
}

export interface CourseSectionDto {
  id: number;
  courseId: number;
  title: string;
  orderIndex: number;
  lessons: LessonDto[];
}

export interface LessonDto {
  id: number;
  sectionId: number;
  title: string;
  description: string;
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

export async function createSection(courseId: number, title: string): Promise<CourseSectionDto> {
  const formData = new URLSearchParams();
  formData.append('title', title);
  return await apiRequest<CourseSectionDto>(`/api/admin/courses/${courseId}/sections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  });
}

export async function deleteSection(sectionId: number): Promise<void> {
  await apiRequest(`/api/admin/courses/sections/${sectionId}`, {
    method: 'DELETE',
  });
}

export async function createLesson(
  sectionId: number, 
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

  return await apiRequest<LessonDto>(`/api/admin/courses/sections/${sectionId}/lessons`, {
    method: 'POST',
    body: formData // Note: Content-Type is intentionally omitted for FormData
  });
}

export async function deleteLesson(lessonId: number): Promise<void> {
  await apiRequest(`/api/admin/courses/lessons/${lessonId}`, {
    method: 'DELETE',
  });
}
