import { apiClient } from './client'
import type { User } from '../types'

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  role: string
  is_active?: boolean
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  password?: string
  role?: string
  is_active?: boolean
}

export const usersApi = {
  list: () => apiClient.get<User[]>('/users').then((r) => r.data),
  get: (id: string) => apiClient.get<User>(`/users/${id}`).then((r) => r.data),
  create: (payload: CreateUserPayload) =>
    apiClient.post<User>('/users', payload).then((r) => r.data),
  update: (id: string, payload: UpdateUserPayload) =>
    apiClient.patch<User>(`/users/${id}`, payload).then((r) => r.data),
}
