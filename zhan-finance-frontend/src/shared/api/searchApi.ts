import { apiRequest } from '@/shared/api/http';
import type { TaskDto } from '@/entities/task/model/types';

export interface UserSearchDto {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

export interface CourseSearchDto {
  id: number;
  title: string;
  description: string;
  isPublished: boolean;
}

export interface LessonSearchDto {
  id: number;
  sectionId: number;
  title: string;
  description: string;
  type: string;
}

export interface GlobalSearchResponse {
  tasks: TaskDto[];
  users: UserSearchDto[];
  courses: CourseSearchDto[];
  lessons: LessonSearchDto[];
}

export async function searchGlobal(query: string): Promise<GlobalSearchResponse> {
  return apiRequest<GlobalSearchResponse>(`/api/search?q=${encodeURIComponent(query)}`);
}
