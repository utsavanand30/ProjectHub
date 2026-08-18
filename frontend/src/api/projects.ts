import { apiClient } from './client'
import type { Project, ProjectListItem } from '../types'

export interface ProjectFilters {
  status?: string
  health?: string
  priority?: string
  pm_id?: string
}

export interface CreateProjectPayload {
  project_code: string
  name: string
  description?: string
  project_manager_id: string
  start_date?: string
  target_completion_date?: string
  priority: string
  status: string
  health: string
  progress_percentage: number
  member_ids?: string[]
}

export type UpdateProjectPayload = Partial<CreateProjectPayload>

export const projectsApi = {
  list: (filters?: ProjectFilters) =>
    apiClient.get<ProjectListItem[]>('/projects', { params: filters }).then((r) => r.data),
  get: (id: string) => apiClient.get<Project>(`/projects/${id}`).then((r) => r.data),
  create: (payload: CreateProjectPayload) =>
    apiClient.post<Project>('/projects', payload).then((r) => r.data),
  update: (id: string, payload: UpdateProjectPayload) =>
    apiClient.patch<Project>(`/projects/${id}`, payload).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/projects/${id}`),
}
