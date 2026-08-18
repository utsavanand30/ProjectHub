import { apiClient } from './client'
import type { Issue } from '../types'

export interface CreateIssuePayload {
  title: string
  description?: string
  severity: string
  status: string
  resolution?: string
  owner_id?: string
  due_date?: string
}

export type UpdateIssuePayload = Partial<CreateIssuePayload>

export const issuesApi = {
  list: (projectId: string, status?: string) =>
    apiClient
      .get<Issue[]>(`/projects/${projectId}/issues`, { params: status ? { status } : undefined })
      .then((r) => r.data),
  create: (projectId: string, payload: CreateIssuePayload) =>
    apiClient.post<Issue>(`/projects/${projectId}/issues`, payload).then((r) => r.data),
  update: (projectId: string, issueId: string, payload: UpdateIssuePayload) =>
    apiClient.patch<Issue>(`/projects/${projectId}/issues/${issueId}`, payload).then((r) => r.data),
  delete: (projectId: string, issueId: string) =>
    apiClient.delete(`/projects/${projectId}/issues/${issueId}`),
}
