import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '../../api/projects'
import { projectUpdatesApi, type CreateProjectUpdatePayload } from '../../api/projectUpdates'
import { risksApi, type CreateRiskPayload } from '../../api/risks'
import { issuesApi, type CreateIssuePayload } from '../../api/issues'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { ErrorMessage } from '../../components/common/ErrorMessage'
import { StatusBadge, HealthBadge, PriorityBadge, SeverityBadge } from '../../components/common/Badge'
import { ProgressBar } from '../../components/common/ProgressBar'
import { Modal } from '../../components/common/Modal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { EmptyState } from '../../components/common/EmptyState'
import { formatDate, formatDateTime } from '../../utils/format'
import { useAuth } from '../../context/AuthContext'
import { useForm } from 'react-hook-form'
import { usersApi } from '../../api/users'
import type { Risk, Issue } from '../../types'

// ── Update form ───────────────────────────────────────────────────────────────
function UpdateForm({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const { register, handleSubmit } = useForm<CreateProjectUpdatePayload>({
    defaultValues: { status: 'in_progress', health: 'green', progress_percentage: 0 },
  })
  const mutation = useMutation({
    mutationFn: (d: CreateProjectUpdatePayload) => projectUpdatesApi.create(projectId, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project', projectId] }); qc.invalidateQueries({ queryKey: ['updates', projectId] }); onClose() },
  })

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Progress (%)</label>
          <input type="number" min={0} max={100} className="input"
            {...register('progress_percentage', { valueAsNumber: true })} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" {...register('status')}>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="label">Health</label>
          <select className="input" {...register('health')}>
            <option value="green">Green (On Track)</option>
            <option value="amber">Amber (At Risk)</option>
            <option value="red">Red (Delayed)</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Key Achievements</label>
        <textarea className="input" rows={2} {...register('key_achievements')} />
      </div>
      <div>
        <label className="label">Key Issues</label>
        <textarea className="input" rows={2} {...register('key_issues')} />
      </div>
      <div>
        <label className="label">Risks (summary)</label>
        <textarea className="input" rows={2} {...register('risks')} />
      </div>
      <div>
        <label className="label">Next Actions</label>
        <textarea className="input" rows={2} {...register('next_actions')} />
      </div>
      <div>
        <label className="label">Expected Completion Date</label>
        <input type="date" className="input" {...register('expected_completion_date')} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? 'Posting...' : 'Post Update'}
        </button>
      </div>
    </form>
  )
}

// ── Risk form ─────────────────────────────────────────────────────────────────
function RiskForm({ projectId, onClose, initial }: { projectId: string; onClose: () => void; initial?: Risk }) {
  const qc = useQueryClient()
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: usersApi.list })
  const { register, handleSubmit } = useForm<CreateRiskPayload>({
    defaultValues: { severity: 'medium', likelihood: 'medium', status: 'open', ...initial },
  })
  const createMutation = useMutation({
    mutationFn: (d: CreateRiskPayload) => risksApi.create(projectId, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['risks', projectId] }); onClose() },
  })
  const updateMutation = useMutation({
    mutationFn: (d: CreateRiskPayload) => risksApi.update(projectId, initial!.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['risks', projectId] }); onClose() },
  })
  const mutation = initial ? updateMutation : createMutation

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div>
        <label className="label">Title</label>
        <input className="input" {...register('title', { required: true })} />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input" rows={2} {...register('description')} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Severity</label>
          <select className="input" {...register('severity')}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="label">Likelihood</label>
          <select className="input" {...register('likelihood')}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" {...register('status')}>
            <option value="open">Open</option>
            <option value="mitigated">Mitigated</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Mitigation Plan</label>
        <textarea className="input" rows={2} {...register('mitigation_plan')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Owner</label>
          <select className="input" {...register('owner_id')}>
            <option value="">Unassigned</option>
            {(users ?? []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Due Date</label>
          <input type="date" className="input" {...register('due_date')} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : initial ? 'Update Risk' : 'Add Risk'}
        </button>
      </div>
    </form>
  )
}

// ── Issue form ────────────────────────────────────────────────────────────────
function IssueForm({ projectId, onClose, initial }: { projectId: string; onClose: () => void; initial?: Issue }) {
  const qc = useQueryClient()
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: usersApi.list })
  const { register, handleSubmit } = useForm<CreateIssuePayload>({
    defaultValues: { severity: 'medium', status: 'open', ...initial },
  })
  const createMutation = useMutation({
    mutationFn: (d: CreateIssuePayload) => issuesApi.create(projectId, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['issues', projectId] }); onClose() },
  })
  const updateMutation = useMutation({
    mutationFn: (d: CreateIssuePayload) => issuesApi.update(projectId, initial!.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['issues', projectId] }); onClose() },
  })
  const mutation = initial ? updateMutation : createMutation

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div>
        <label className="label">Title</label>
        <input className="input" {...register('title', { required: true })} />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input" rows={2} {...register('description')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Severity</label>
          <select className="input" {...register('severity')}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" {...register('status')}>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Resolution</label>
        <textarea className="input" rows={2} {...register('resolution')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Owner</label>
          <select className="input" {...register('owner_id')}>
            <option value="">Unassigned</option>
            {(users ?? []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Due Date</label>
          <input type="date" className="input" {...register('due_date')} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : initial ? 'Update Issue' : 'Add Issue'}
        </button>
      </div>
    </form>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'updates' | 'risks' | 'issues'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('overview')
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [showRiskForm, setShowRiskForm] = useState(false)
  const [showIssueForm, setShowIssueForm] = useState(false)
  const [editRisk, setEditRisk] = useState<Risk | null>(null)
  const [editIssue, setEditIssue] = useState<Issue | null>(null)
  const [deleteRiskId, setDeleteRiskId] = useState<string | null>(null)
  const [deleteIssueId, setDeleteIssueId] = useState<string | null>(null)

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id!),
    enabled: !!id,
  })

  const { data: updates } = useQuery({
    queryKey: ['updates', id],
    queryFn: () => projectUpdatesApi.list(id!),
    enabled: !!id && tab === 'updates',
  })

  const { data: risks } = useQuery({
    queryKey: ['risks', id],
    queryFn: () => risksApi.list(id!),
    enabled: !!id && tab === 'risks',
  })

  const { data: issues } = useQuery({
    queryKey: ['issues', id],
    queryFn: () => issuesApi.list(id!),
    enabled: !!id && tab === 'issues',
  })

  const deleteRiskMutation = useMutation({
    mutationFn: (riskId: string) => risksApi.delete(id!, riskId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['risks', id] }); setDeleteRiskId(null) },
  })

  const deleteIssueMutation = useMutation({
    mutationFn: (issueId: string) => issuesApi.delete(id!, issueId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['issues', id] }); setDeleteIssueId(null) },
  })

  const canManage = user?.role === 'admin' || (user?.role === 'project_manager' && project?.project_manager_id === user?.id)

  if (isLoading) return <PageLoader />
  if (error) return <ErrorMessage error={error} />
  if (!project) return null

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'updates', label: 'Updates' },
    { key: 'risks', label: 'Risks' },
    { key: 'issues', label: 'Issues' },
  ]

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/projects" className="hover:text-primary-600">Projects</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{project.name}</span>
      </div>

      {/* Header */}
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                {project.project_code}
              </span>
              <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
            </div>
            {project.description && (
              <p className="text-sm text-gray-500 mt-2 max-w-2xl">{project.description}</p>
            )}
          </div>
          {canManage && (
            <button className="btn-primary btn-sm" onClick={() => setShowUpdateForm(true)}>
              Post Update
            </button>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-400">Status</p>
            <StatusBadge status={project.status} />
          </div>
          <div>
            <p className="text-xs text-gray-400">Health</p>
            <HealthBadge health={project.health} />
          </div>
          <div>
            <p className="text-xs text-gray-400">Priority</p>
            <PriorityBadge priority={project.priority} />
          </div>
          <div>
            <p className="text-xs text-gray-400">Progress</p>
            <ProgressBar value={project.progress_percentage} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400">Project Manager</p>
            <p className="font-medium">{project.project_manager.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Start Date</p>
            <p>{formatDate(project.start_date)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Target Completion</p>
            <p>{formatDate(project.target_completion_date)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Expected Completion</p>
            <p>{formatDate(project.expected_completion_date)}</p>
          </div>
        </div>

        {project.members.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-400 mb-2">Team Members</p>
            <div className="flex flex-wrap gap-2">
              {project.members.map((m) => (
                <span key={m.id} className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full">
                  {m.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab: Updates */}
      {tab === 'updates' && (
        <div className="space-y-4">
          {!updates?.length ? (
            <EmptyState title="No updates yet" description="Post the first update for this project" />
          ) : (
            updates.map((u) => (
              <div key={u.id} className="card border-l-4 border-primary-500">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex gap-2">
                    <StatusBadge status={u.status} />
                    <HealthBadge health={u.health} />
                  </div>
                  <div className="text-xs text-gray-400">
                    {u.updated_by_user.name} · {formatDateTime(u.created_at)}
                  </div>
                </div>
                <ProgressBar value={u.progress_percentage} />
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {u.key_achievements && (
                    <div><p className="text-xs font-semibold text-gray-400 mb-1">Achievements</p><p className="text-gray-700">{u.key_achievements}</p></div>
                  )}
                  {u.key_issues && (
                    <div><p className="text-xs font-semibold text-gray-400 mb-1">Issues</p><p className="text-gray-700">{u.key_issues}</p></div>
                  )}
                  {u.next_actions && (
                    <div><p className="text-xs font-semibold text-gray-400 mb-1">Next Actions</p><p className="text-gray-700">{u.next_actions}</p></div>
                  )}
                  {u.expected_completion_date && (
                    <div><p className="text-xs font-semibold text-gray-400 mb-1">Expected Completion</p><p className="text-gray-700">{formatDate(u.expected_completion_date)}</p></div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Risks */}
      {tab === 'risks' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="btn-primary btn-sm" onClick={() => setShowRiskForm(true)}>+ Add Risk</button>
          </div>
          {!risks?.length ? (
            <EmptyState title="No risks logged" />
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="table-th">Title</th>
                    <th className="table-th">Severity</th>
                    <th className="table-th">Likelihood</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Owner</th>
                    <th className="table-th">Due</th>
                    <th className="table-th">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {risks.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="table-td font-medium">{r.title}</td>
                      <td className="table-td"><SeverityBadge severity={r.severity} /></td>
                      <td className="table-td"><SeverityBadge severity={r.likelihood} /></td>
                      <td className="table-td"><StatusBadge status={r.status} /></td>
                      <td className="table-td text-gray-500">{r.owner?.name ?? '—'}</td>
                      <td className="table-td text-gray-400">{formatDate(r.due_date)}</td>
                      <td className="table-td">
                        <div className="flex gap-3">
                          <button className="text-primary-600 hover:underline text-sm" onClick={() => setEditRisk(r)}>Edit</button>
                          <button className="text-red-500 hover:text-red-700 text-sm" onClick={() => setDeleteRiskId(r.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Issues */}
      {tab === 'issues' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="btn-primary btn-sm" onClick={() => setShowIssueForm(true)}>+ Add Issue</button>
          </div>
          {!issues?.length ? (
            <EmptyState title="No issues logged" />
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="table-th">Title</th>
                    <th className="table-th">Severity</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Owner</th>
                    <th className="table-th">Due</th>
                    <th className="table-th">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {issues.map((i) => (
                    <tr key={i.id} className="hover:bg-gray-50">
                      <td className="table-td font-medium">{i.title}</td>
                      <td className="table-td"><SeverityBadge severity={i.severity} /></td>
                      <td className="table-td"><StatusBadge status={i.status} /></td>
                      <td className="table-td text-gray-500">{i.owner?.name ?? '—'}</td>
                      <td className="table-td text-gray-400">{formatDate(i.due_date)}</td>
                      <td className="table-td">
                        <div className="flex gap-3">
                          <button className="text-primary-600 hover:underline text-sm" onClick={() => setEditIssue(i)}>Edit</button>
                          <button className="text-red-500 hover:text-red-700 text-sm" onClick={() => setDeleteIssueId(i.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showUpdateForm && (
        <Modal title="Post Project Update" onClose={() => setShowUpdateForm(false)} size="lg">
          <UpdateForm projectId={id!} onClose={() => setShowUpdateForm(false)} />
        </Modal>
      )}
      {(showRiskForm || editRisk) && (
        <Modal title={editRisk ? 'Edit Risk' : 'Add Risk'} onClose={() => { setShowRiskForm(false); setEditRisk(null) }} size="lg">
          <RiskForm projectId={id!} onClose={() => { setShowRiskForm(false); setEditRisk(null) }} initial={editRisk ?? undefined} />
        </Modal>
      )}
      {(showIssueForm || editIssue) && (
        <Modal title={editIssue ? 'Edit Issue' : 'Add Issue'} onClose={() => { setShowIssueForm(false); setEditIssue(null) }} size="lg">
          <IssueForm projectId={id!} onClose={() => { setShowIssueForm(false); setEditIssue(null) }} initial={editIssue ?? undefined} />
        </Modal>
      )}
      {deleteRiskId && (
        <ConfirmDialog title="Delete Risk" message="This risk will be permanently deleted."
          onConfirm={() => deleteRiskMutation.mutate(deleteRiskId)}
          onCancel={() => setDeleteRiskId(null)} isLoading={deleteRiskMutation.isPending} />
      )}
      {deleteIssueId && (
        <ConfirmDialog title="Delete Issue" message="This issue will be permanently deleted."
          onConfirm={() => deleteIssueMutation.mutate(deleteIssueId)}
          onCancel={() => setDeleteIssueId(null)} isLoading={deleteIssueMutation.isPending} />
      )}
    </div>
  )
}
