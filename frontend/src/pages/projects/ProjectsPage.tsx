import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi, type CreateProjectPayload, type ProjectFilters } from '../../api/projects'
import { usersApi } from '../../api/users'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { ErrorMessage } from '../../components/common/ErrorMessage'
import { StatusBadge, HealthBadge, PriorityBadge } from '../../components/common/Badge'
import { ProgressBar } from '../../components/common/ProgressBar'
import { Modal } from '../../components/common/Modal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { EmptyState } from '../../components/common/EmptyState'
import { formatDate } from '../../utils/format'
import { useAuth } from '../../context/AuthContext'
import { useForm, Controller } from 'react-hook-form'

type FormData = {
  project_code: string
  name: string
  description?: string
  project_manager_id: string
  start_date?: string
  target_completion_date?: string
  priority: string
  status: string
  health: string
  progress_percentage: number
  member_ids: string[]
}

function ProjectForm({
  initial,
  onSubmit,
  isLoading,
}: {
  initial?: Partial<FormData>
  onSubmit: (d: FormData) => void
  isLoading: boolean
}) {
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: usersApi.list })
  const pms = (users ?? []).filter((u) => u.role === 'project_manager' || u.role === 'admin')
  const members = users ?? []

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      priority: 'medium', status: 'not_started', health: 'green',
      progress_percentage: 0, member_ids: [], ...initial,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Project Code</label>
          <input className="input" {...register('project_code', { required: 'Required' })} placeholder="PROJ-001" />
          {errors.project_code && <p className="text-xs text-red-600 mt-1">{errors.project_code.message}</p>}
        </div>
        <div>
          <label className="label">Project Name</label>
          <input className="input" {...register('name', { required: 'Required' })} />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
        </div>
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input" rows={3} {...register('description')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Project Manager</label>
          <select className="input" {...register('project_manager_id', { required: 'Required' })}>
            <option value="">Select PM</option>
            {pms.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          {errors.project_manager_id && <p className="text-xs text-red-600 mt-1">{errors.project_manager_id.message}</p>}
        </div>
        <div>
          <label className="label">Priority</label>
          <select className="input" {...register('priority')}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
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
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Start Date</label>
          <input type="date" className="input" {...register('start_date')} />
        </div>
        <div>
          <label className="label">Target Completion</label>
          <input type="date" className="input" {...register('target_completion_date')} />
        </div>
        <div>
          <label className="label">Progress (%)</label>
          <input type="number" min={0} max={100} className="input"
            {...register('progress_percentage', { valueAsNumber: true, min: 0, max: 100 })} />
        </div>
      </div>
      <div>
        <label className="label">Team Members</label>
        <Controller
          name="member_ids"
          control={control}
          render={({ field }) => (
            <select
              multiple
              className="input h-28"
              value={field.value}
              onChange={(e) => field.onChange(Array.from(e.target.selectedOptions, (o) => o.value))}
            >
              {members.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role.replace(/_/g, ' ')})</option>)}
            </select>
          )}
        />
        <p className="text-xs text-gray-400 mt-1">Hold Ctrl / Cmd to select multiple</p>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Project'}
        </button>
      </div>
    </form>
  )
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [filters, setFilters] = useState<ProjectFilters>({})
  const [showCreate, setShowCreate] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formError, setFormError] = useState('')

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['projects', filters],
    queryFn: () => projectsApi.list(filters),
  })

  const { data: users } = useQuery({ queryKey: ['users'], queryFn: usersApi.list })
  const pms = (users ?? []).filter((u) => u.role === 'project_manager' || u.role === 'admin')

  const createMutation = useMutation({
    mutationFn: (d: CreateProjectPayload) => projectsApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); setShowCreate(false) },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { detail?: string } } }
      setFormError(err.response?.data?.detail ?? 'Failed to create project')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); setDeleteId(null) },
  })

  const canCreate = user?.role === 'admin' || user?.role === 'project_manager'

  if (isLoading) return <PageLoader />
  if (error) return <ErrorMessage error={error} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title">Projects</h1>
        {canCreate && (
          <button className="btn-primary" onClick={() => { setFormError(''); setShowCreate(true) }}>
            + New Project
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card py-4">
        <div className="flex flex-wrap gap-3">
          <select className="input w-auto" value={filters.status ?? ''} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}>
            <option value="">All Statuses</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select className="input w-auto" value={filters.health ?? ''} onChange={(e) => setFilters((f) => ({ ...f, health: e.target.value || undefined }))}>
            <option value="">All Health</option>
            <option value="green">On Track</option>
            <option value="amber">At Risk</option>
            <option value="red">Delayed</option>
          </select>
          <select className="input w-auto" value={filters.priority ?? ''} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value || undefined }))}>
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select className="input w-auto" value={filters.pm_id ?? ''} onChange={(e) => setFilters((f) => ({ ...f, pm_id: e.target.value || undefined }))}>
            <option value="">All PMs</option>
            {pms.map((pm) => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
          </select>
          {Object.values(filters).some(Boolean) && (
            <button className="btn-secondary btn-sm" onClick={() => setFilters({})}>Clear</button>
          )}
        </div>
      </div>

      {/* Table */}
      {!projects?.length ? (
        <EmptyState
          title="No projects found"
          description="Create your first project to get started"
          action={canCreate ? <button className="btn-primary" onClick={() => setShowCreate(true)}>New Project</button> : undefined}
        />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="table-th">Code</th>
                  <th className="table-th">Name</th>
                  <th className="table-th">PM</th>
                  <th className="table-th">Priority</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Health</th>
                  <th className="table-th">Progress</th>
                  <th className="table-th">Target Date</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="table-td font-mono text-xs text-gray-500">{p.project_code}</td>
                    <td className="table-td">
                      <Link to={`/projects/${p.id}`} className="font-medium text-primary-700 hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="table-td text-gray-500">{p.project_manager.name}</td>
                    <td className="table-td"><PriorityBadge priority={p.priority} /></td>
                    <td className="table-td"><StatusBadge status={p.status} /></td>
                    <td className="table-td"><HealthBadge health={p.health} /></td>
                    <td className="table-td w-36">
                      <ProgressBar value={p.progress_percentage} size="sm" />
                    </td>
                    <td className="table-td text-gray-400">{formatDate(p.target_completion_date)}</td>
                    <td className="table-td">
                      <div className="flex gap-3">
                        <Link to={`/projects/${p.id}`} className="text-primary-600 hover:underline text-sm">View</Link>
                        {canCreate && (
                          <button className="text-red-500 hover:text-red-700 text-sm" onClick={() => setDeleteId(p.id)}>
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <Modal title="Create Project" onClose={() => setShowCreate(false)} size="lg">
          {formError && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{formError}</div>}
          <ProjectForm
            onSubmit={(d) => createMutation.mutate({ ...d, member_ids: d.member_ids })}
            isLoading={createMutation.isPending}
          />
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <ConfirmDialog
          title="Delete Project"
          message="This will soft-delete the project. Existing activities will be retained."
          onConfirm={() => deleteMutation.mutate(deleteId)}
          onCancel={() => setDeleteId(null)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  )
}
