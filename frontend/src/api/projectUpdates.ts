import { apiClient } from './client'
import type { ProjectUpdate } from '../types'

export interface CreateProjectUpdatePayload {
  progress_percentage: number
  status: string
  health: string
  key_achievements?: string
  key_issues?: string
  risks?: string
  next_actions?: string
  expected_completion_date?: string
}

export const projectUpdatesApi = {
  list: (projectId: string) =>
    apiClient.get<ProjectUpdate[]>(`/projects/${projectId}/updates`).then((r) => r.data),
  create: (projectId: string, payload: CreateProjectUpdatePayload) =>
    apiClient.post<ProjectUpdate>(`/projects/${projectId}/updates`, payload).then((r) => r.data),
}
