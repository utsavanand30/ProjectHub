// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'project_manager' | 'team_member'

export type ProjectStatus = 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
export type ProjectHealth = 'green' | 'amber' | 'red'
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical'

export type ActivityStatus = 'planned' | 'in_progress' | 'completed' | 'blocked'

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical'
export type RiskLikelihood = 'low' | 'medium' | 'high'
export type RiskStatus = 'open' | 'mitigated' | 'closed'

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical'
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserSummary {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface User extends UserSummary {
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── Project ──────────────────────────────────────────────────────────────────

export interface Project {
  id: string
  project_code: string
  name: string
  description?: string
  project_manager_id: string
  project_manager: UserSummary
  start_date?: string
  target_completion_date?: string
  expected_completion_date?: string
  priority: ProjectPriority
  status: ProjectStatus
  health: ProjectHealth
  progress_percentage: number
  members: UserSummary[]
  created_at: string
  updated_at: string
}

export interface ProjectListItem {
  id: string
  project_code: string
  name: string
  project_manager: UserSummary
  priority: ProjectPriority
  status: ProjectStatus
  health: ProjectHealth
  progress_percentage: number
  target_completion_date?: string
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export interface Activity {
  id: string
  date: string
  user_id: string
  user: UserSummary
  project_id: string
  description: string
  hours_spent: string
  status: ActivityStatus
  remarks?: string
  next_action?: string
  created_at: string
  updated_at: string
}

// ─── Project Update ───────────────────────────────────────────────────────────

export interface ProjectUpdate {
  id: string
  project_id: string
  updated_by: string
  updated_by_user: UserSummary
  progress_percentage: number
  status: ProjectStatus
  health: ProjectHealth
  key_achievements?: string
  key_issues?: string
  risks?: string
  next_actions?: string
  expected_completion_date?: string
  created_at: string
}

// ─── Risk ─────────────────────────────────────────────────────────────────────

export interface Risk {
  id: string
  project_id: string
  title: string
  description?: string
  severity: RiskSeverity
  likelihood: RiskLikelihood
  status: RiskStatus
  mitigation_plan?: string
  owner_id?: string
  owner?: UserSummary
  due_date?: string
  created_by: string
  created_at: string
  updated_at: string
}

// ─── Issue ────────────────────────────────────────────────────────────────────

export interface Issue {
  id: string
  project_id: string
  title: string
  description?: string
  severity: IssueSeverity
  status: IssueStatus
  resolution?: string
  owner_id?: string
  owner?: UserSummary
  due_date?: string
  created_by: string
  created_at: string
  updated_at: string
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string
  entity_type: string
  entity_id: string
  action: string
  changed_by?: string
  changed_by_user?: UserSummary
  old_value?: Record<string, unknown>
  new_value?: Record<string, unknown>
  created_at: string
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface ProjectStats {
  total: number
  not_started: number
  in_progress: number
  on_hold: number
  completed: number
  cancelled: number
  on_track: number
  at_risk: number
  delayed: number
  avg_progress: number
}

export interface DashboardData {
  project_stats: ProjectStats
  recent_updates: ProjectUpdate[]
  todays_activities: Activity[]
  open_risks: Risk[]
  open_issues: Issue[]
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}
