import { apiClient } from './client'
import type { TokenResponse, User } from '../types'

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<TokenResponse>('/auth/login', { email, password }).then((r) => r.data),

  refresh: (refreshToken: string) =>
    apiClient
      .post<{ access_token: string }>('/auth/refresh', { refresh_token: refreshToken })
      .then((r) => r.data),

  me: () => apiClient.get<User>('/auth/me').then((r) => r.data),
}
