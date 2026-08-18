import { apiClient } from './client'
import type { Activity } from '../types'

export interface ActivityFilters {
  date?: string
  user_id?: string
  project_id?: string
  status?: string
}

export interface CreateActivityPayload {
  date: string
  project_id: string
  description: string
  hours_spent: string
  status: string
  remarks?: string
  next_action?: string
}

export type UpdateActivityPayload = Partial<CreateActivityPayload>

export const activitiesApi = {
  list: (filters?: ActivityFilters) =>
    apiClient.get<Activity[]>('/activities', { params: filters }).then((r) => r.data),
  get: (id: string) => apiClient.get<Activity>(`/activities/${id}`).then((r) => r.data),
  create: (payload: CreateActivityPayload) =>
    apiClient.post<Activity>('/activities', payload).then((r) => r.data),
  update: (id: string, payload: UpdateActivityPayload) =>
    apiClient.patch<Activity>(`/activities/${id}`, payload).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/activities/${id}`),
}
