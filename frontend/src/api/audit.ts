import { apiClient } from './client'
import type { AuditLog } from '../types'

export const auditApi = {
  list: (params?: { entity_type?: string; entity_id?: string; skip?: number; limit?: number }) =>
    apiClient.get<AuditLog[]>('/audit', { params }).then((r) => r.data),
}
