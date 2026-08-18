import { apiClient } from './client'
import type { Risk } from '../types'

export interface CreateRiskPayload {
  title: string
  description?: string
  severity: string
  likelihood: string
  status: string
  mitigation_plan?: string
  owner_id?: string
  due_date?: string
}

export type UpdateRiskPayload = Partial<CreateRiskPayload>

export const risksApi = {
  list: (projectId: string, status?: string) =>
    apiClient
      .get<Risk[]>(`/projects/${projectId}/risks`, { params: status ? { status } : undefined })
      .then((r) => r.data),
  create: (projectId: string, payload: CreateRiskPayload) =>
    apiClient.post<Risk>(`/projects/${projectId}/risks`, payload).then((r) => r.data),
  update: (projectId: string, riskId: string, payload: UpdateRiskPayload) =>
    apiClient.patch<Risk>(`/projects/${projectId}/risks/${riskId}`, payload).then((r) => r.data),
  delete: (projectId: string, riskId: string) =>
    apiClient.delete(`/projects/${projectId}/risks/${riskId}`),
}
