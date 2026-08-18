import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { activitiesApi, type CreateActivityPayload, type ActivityFilters } from '../../api/activities'
import { projectsApi } from '../../api/projects'
import { usersApi } from '../../api/users'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { ErrorMessage } from '../../components/common/ErrorMessage'
import { StatusBadge } from '../../components/common/Badge'
import { Modal } from '../../components/common/Modal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { EmptyState } from '../../components/common/EmptyState'
import { formatDate } from '../../utils/format'
import { useAuth } from '../../context/AuthContext'
import { useForm } from 'react-hook-form'
import type { Activity } from '../../types'

// ── Form ──────────────────────────────────────────────────────────────────────
type ActivityFormData = {
  date: string
  project_id: string
  description: string
  hours_spent: string
  status: string
  remarks?: string
  next_action?: string
}

function ActivityForm({
  initial,
  onSubmit,
  isLoading,
  isEdit,
}: {
  initial?: Partial<ActivityFormData>
  onSubmit: (d: ActivityFormData) => void
  isLoading: boolean
  isEdit: boolean
}) {
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
  })

  const today = new Date().toISOString().slice(0, 10)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ActivityFormData>({
    defaultValues: {
      date: today,
      status: 'in_progress',
      hours_spent: '',
      ...initial,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Date</label>
          <input
            type="date"
            className="input"
            {...register('date', { required: 'Date is required' })}
          />
          {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date.message}</p>}
        </div>
        <div>
          <label className="label">Project</label>
          <select className="input" {...register('project_id', { required: 'Project is required' })}>
            <option value="">Select project</option>
            {(projects ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_code} — {p.name}
              </option>
            ))}
          </select>
          {errors.project_id && (
            <p className="text-xs text-red-600 mt-1">{errors.project_id.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="label">Activity Description</label>
        <textarea
          className="input"
          rows={3}
          placeholder="What did you work on?"
          {...register('description', { required: 'Description is required' })}
        />
        {errors.description && (
          <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Hours Spent</label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            max="24"
            className="input"
            placeholder="e.g. 3.5"
            {...register('hours_spent', {
              required: 'Hours is required',
              min: { value: 0.5, message: 'Minimum 0.5h' },
              max: { value: 24, message: 'Maximum 24h' },
            })}
          />
          {errors.hours_spent && (
            <p className="text-xs text-red-600 mt-1">{errors.hours_spent.message}</p>
          )}
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" {...register('status', { required: true })}>
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Remarks</label>
        <textarea className="input" rows={2} placeholder="Optional notes" {...register('remarks')} />
      </div>

      <div>
        <label className="label">Next Action</label>
        <textarea
          className="input"
          rows={2}
          placeholder="What's the next step?"
          {...register('next_action')}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Saving...' : isEdit ? 'Update Activity' : 'Log Activity'}
        </button>
      </div>
    </form>
  )
}

// ── Filter bar ────────────────────────────────────────────────────────────────
function FilterBar({
  filters,
  onChange,
  showUserFilter,
}: {
  filters: ActivityFilters
  onChange: (f: ActivityFilters) => void
  showUserFilter: boolean
}) {
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
  })
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
    enabled: showUserFilter,
  })

  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div className="card py-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="label text-xs">Date</label>
          <input
            type="date"
            className="input w-auto"
            value={filters.date ?? ''}
            onChange={(e) => onChange({ ...filters, date: e.target.value || undefined })}
          />
        </div>

        <div>
          <label className="label text-xs">Project</label>
          <select
            className="input w-auto"
            value={filters.project_id ?? ''}
            onChange={(e) => onChange({ ...filters, project_id: e.target.value || undefined })}
          >
            <option value="">All Projects</option>
            {(projects ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_code} — {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label text-xs">Status</label>
          <select
            className="input w-auto"
            value={filters.status ?? ''}
            onChange={(e) => onChange({ ...filters, status: e.target.value || undefined })}
          >
            <option value="">All Statuses</option>
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        {showUserFilter && (
          <div>
            <label className="label text-xs">User</label>
            <select
              className="input w-auto"
              value={filters.user_id ?? ''}
              onChange={(e) => onChange({ ...filters, user_id: e.target.value || undefined })}
            >
              <option value="">All Users</option>
              {(users ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {hasFilters && (
          <button
            className="btn-secondary btn-sm self-end"
            onClick={() => onChange({})}
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ActivitiesPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [filters, setFilters] = useState<ActivityFilters>({})
  const [showCreate, setShowCreate] = useState(false)
  const [editActivity, setEditActivity] = useState<Activity | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formError, setFormError] = useState('')

  const canSeeAllUsers =
    user?.role === 'admin' || user?.role === 'project_manager'

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
  })

  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['activities', filters],
    queryFn: () => activitiesApi.list(filters),
  })

  const createMutation = useMutation({
    mutationFn: (d: CreateActivityPayload) => activitiesApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setShowCreate(false)
      setFormError('')
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { detail?: string } } }
      setFormError(err.response?.data?.detail ?? 'Failed to log activity')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateActivityPayload> }) =>
      activitiesApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setEditActivity(null)
      setFormError('')
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { detail?: string } } }
      setFormError(err.response?.data?.detail ?? 'Failed to update activity')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => activitiesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setDeleteId(null)
    },
  })

  const handleCreate = (d: ActivityFormData) => {
    createMutation.mutate(d as CreateActivityPayload)
  }

  const handleUpdate = (d: ActivityFormData) => {
    if (!editActivity) return
    updateMutation.mutate({ id: editActivity.id, payload: d as CreateActivityPayload })
  }

  if (isLoading) return <PageLoader />
  if (error) return <ErrorMessage error={error} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Daily Activities</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {canSeeAllUsers
              ? 'Showing activities across your projects'
              : 'Showing your own activities'}
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setFormError('')
            setShowCreate(true)
          }}
        >
          + Log Activity
        </button>
      </div>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        showUserFilter={canSeeAllUsers}
      />

      {/* Summary bar */}
      {activities && activities.length > 0 && (
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg">
            <span className="font-semibold">{activities.length}</span> entries
          </div>
          <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg">
            <span className="font-semibold">
              {activities.reduce((sum, a) => sum + parseFloat(a.hours_spent), 0).toFixed(1)}
            </span>{' '}
            total hours
          </div>
        </div>
      )}

      {/* Table */}
      {!activities?.length ? (
        <EmptyState
          title="No activities found"
          description="Log your first activity to get started"
          action={
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              Log Activity
            </button>
          }
        />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="table-th">Date</th>
                  {canSeeAllUsers && <th className="table-th">User</th>}
                  <th className="table-th">Project</th>
                  <th className="table-th">Description</th>
                  <th className="table-th">Hours</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Next Action</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activities.map((a) => {
                  const isOwn = a.user_id === user?.id
                  const canEdit = isOwn || user?.role === 'admin'

                  return (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="table-td text-gray-500 whitespace-nowrap">
                        {formatDate(a.date)}
                      </td>
                      {canSeeAllUsers && (
                        <td className="table-td">
                          <span className="font-medium">{a.user.name}</span>
                        </td>
                      )}
                      <td className="table-td">
                        <span className="text-sm text-gray-600">
                          {(projects ?? []).find((p) => p.id === a.project_id)?.name ?? a.project_id.slice(0, 8) + '…'}
                        </span>
                      </td>
                      <td className="table-td max-w-xs">
                        <p className="truncate" title={a.description}>
                          {a.description}
                        </p>
                        {a.remarks && (
                          <p className="text-xs text-gray-400 truncate">{a.remarks}</p>
                        )}
                      </td>
                      <td className="table-td font-medium text-center">
                        {a.hours_spent}h
                      </td>
                      <td className="table-td">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="table-td max-w-xs">
                        <p className="truncate text-gray-500 text-xs" title={a.next_action ?? ''}>
                          {a.next_action ?? '—'}
                        </p>
                      </td>
                      <td className="table-td whitespace-nowrap">
                        {canEdit && (
                          <div className="flex gap-3">
                            <button
                              className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                              onClick={() => {
                                setFormError('')
                                setEditActivity(a)
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="text-red-500 hover:text-red-700 text-sm"
                              onClick={() => setDeleteId(a.id)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <Modal title="Log Activity" onClose={() => setShowCreate(false)} size="lg">
          {formError && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded">
              {formError}
            </div>
          )}
          <ActivityForm
            onSubmit={handleCreate}
            isLoading={createMutation.isPending}
            isEdit={false}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {editActivity && (
        <Modal title="Edit Activity" onClose={() => setEditActivity(null)} size="lg">
          {formError && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded">
              {formError}
            </div>
          )}
          <ActivityForm
            initial={{
              date: editActivity.date,
              project_id: editActivity.project_id,
              description: editActivity.description,
              hours_spent: editActivity.hours_spent,
              status: editActivity.status,
              remarks: editActivity.remarks ?? '',
              next_action: editActivity.next_action ?? '',
            }}
            onSubmit={handleUpdate}
            isLoading={updateMutation.isPending}
            isEdit
          />
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <ConfirmDialog
          title="Delete Activity"
          message="This activity entry will be permanently deleted."
          onConfirm={() => deleteMutation.mutate(deleteId)}
          onCancel={() => setDeleteId(null)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  )
}
