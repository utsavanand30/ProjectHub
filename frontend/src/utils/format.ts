import { format, parseISO } from 'date-fns'

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy')
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy, HH:mm')
  } catch {
    return dateStr
  }
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ')
}

export function roleLabel(role: string): string {
  const map: Record<string, string> = {
    admin: 'Admin',
    project_manager: 'Project Manager',
    team_member: 'Team Member',
  }
  return map[role] ?? capitalize(role)
}
