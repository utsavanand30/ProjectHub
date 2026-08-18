import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi, type CreateUserPayload, type UpdateUserPayload } from '../../api/users'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { ErrorMessage } from '../../components/common/ErrorMessage'
import { Badge } from '../../components/common/Badge'
import { Modal } from '../../components/common/Modal'
import { roleLabel, formatDateTime } from '../../utils/format'
import { useForm } from 'react-hook-form'
import type { User } from '../../types'

type FormData = {
  name: string
  email: string
  password?: string
  role: string
  is_active: boolean
}

function UserForm({
  initial,
  onSubmit,
  isLoading,
  isEdit,
}: {
  initial?: Partial<FormData>
  onSubmit: (d: FormData) => void
  isLoading: boolean
  isEdit: boolean
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: { role: 'team_member', is_active: true, ...initial },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Full Name</label>
        <input className="input" {...register('name', { required: 'Name is required' })} />
        {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <label className="label">Email</label>
        <input type="email" className="input" {...register('email', { required: 'Email is required' })} />
        {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <label className="label">{isEdit ? 'New Password (leave blank to keep)' : 'Password'}</label>
        <input
          type="password"
          className="input"
          {...register('password', {
            required: isEdit ? false : 'Password is required',
            minLength: { value: 8, message: 'Min 8 characters' },
          })}
        />
        {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
      </div>
      <div>
        <label className="label">Role</label>
        <select className="input" {...register('role', { required: true })}>
          <option value="team_member">Team Member</option>
          <option value="project_manager">Project Manager</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="is_active" className="rounded border-gray-300" {...register('is_active')} />
        <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  )
}

export default function UsersPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [formError, setFormError] = useState('')

  const { data: users, isLoading, error } = useQuery({ queryKey: ['users'], queryFn: usersApi.list })

  const createMutation = useMutation({
    mutationFn: (d: CreateUserPayload) => usersApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setShowCreate(false); setFormError('') },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { detail?: string } } }
      setFormError(err.response?.data?.detail ?? 'Failed to create user')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) => usersApi.update(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setEditUser(null); setFormError('') },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { detail?: string } } }
      setFormError(err.response?.data?.detail ?? 'Failed to update user')
    },
  })

  const handleCreate = (d: FormData) => {
    createMutation.mutate({ name: d.name, email: d.email, password: d.password!, role: d.role, is_active: d.is_active })
  }

  const handleUpdate = (d: FormData) => {
    if (!editUser) return
    const payload: UpdateUserPayload = { name: d.name, email: d.email, role: d.role, is_active: d.is_active }
    if (d.password) payload.password = d.password
    updateMutation.mutate({ id: editUser.id, payload })
  }

  if (isLoading) return <PageLoader />
  if (error) return <ErrorMessage error={error} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">User Management</h1>
        <button className="btn-primary" onClick={() => { setFormError(''); setShowCreate(true) }}>
          + New User
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-th">Name</th>
                <th className="table-th">Email</th>
                <th className="table-th">Role</th>
                <th className="table-th">Status</th>
                <th className="table-th">Created</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(users ?? []).map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="table-td font-medium">{u.name}</td>
                  <td className="table-td text-gray-500">{u.email}</td>
                  <td className="table-td">
                    <Badge
                      label={roleLabel(u.role)}
                      variant={u.role === 'admin' ? 'red' : u.role === 'project_manager' ? 'blue' : 'gray'}
                    />
                  </td>
                  <td className="table-td">
                    <Badge label={u.is_active ? 'Active' : 'Inactive'} variant={u.is_active ? 'green' : 'gray'} />
                  </td>
                  <td className="table-td text-gray-400">{formatDateTime(u.created_at)}</td>
                  <td className="table-td">
                    <button className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                      onClick={() => { setFormError(''); setEditUser(u) }}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <Modal title="Create User" onClose={() => setShowCreate(false)}>
          {formError && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{formError}</div>}
          <UserForm onSubmit={handleCreate} isLoading={createMutation.isPending} isEdit={false} />
        </Modal>
      )}

      {/* Edit modal */}
      {editUser && (
        <Modal title="Edit User" onClose={() => setEditUser(null)}>
          {formError && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{formError}</div>}
          <UserForm
            initial={{ name: editUser.name, email: editUser.email, role: editUser.role, is_active: editUser.is_active }}
            onSubmit={handleUpdate}
            isLoading={updateMutation.isPending}
            isEdit
          />
        </Modal>
      )}
    </div>
  )
}
