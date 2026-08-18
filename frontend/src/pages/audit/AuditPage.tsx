import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { auditApi } from '../../api/audit'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { ErrorMessage } from '../../components/common/ErrorMessage'
import { EmptyState } from '../../components/common/EmptyState'
import { Badge } from '../../components/common/Badge'
import { formatDateTime } from '../../utils/format'

const ACTION_COLORS: Record<string, 'green' | 'amber' | 'red' | 'blue' | 'gray'> = {
  created: 'green',
  updated: 'blue',
  deleted: 'red',
  progress_update: 'amber',
}

const ENTITY_COLORS: Record<string, 'blue' | 'purple' | 'gray'> = {
  project: 'blue',
  user: 'purple',
}

export default function AuditPage() {
  const [entityType, setEntityType] = useState('')
  const [page, setPage] = useState(0)
  const limit = 50

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit', entityType, page],
    queryFn: () =>
      auditApi.list({
        entity_type: entityType || undefined,
        skip: page * limit,
        limit,
      }),
  })

  if (isLoading) return <PageLoader />
  if (error) return <ErrorMessage error={error} />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Immutable record of important system changes
        </p>
      </div>

      {/* Filters */}
      <div className="card py-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label text-xs">Entity Type</label>
            <select
              className="input w-auto"
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value)
                setPage(0)
              }}
            >
              <option value="">All Types</option>
              <option value="project">Project</option>
              <option value="user">User</option>
            </select>
          </div>
          {entityType && (
            <button
              className="btn-secondary btn-sm self-end"
              onClick={() => { setEntityType(''); setPage(0) }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {!data?.length ? (
        <EmptyState
          title="No audit entries"
          description="Audit entries appear here when important changes are made"
        />
      ) : (
        <>
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="table-th">Timestamp</th>
                    <th className="table-th">Entity</th>
                    <th className="table-th">Action</th>
                    <th className="table-th">Changed By</th>
                    <th className="table-th">Before</th>
                    <th className="table-th">After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 align-top">
                      <td className="table-td whitespace-nowrap text-gray-400">
                        {formatDateTime(entry.created_at)}
                      </td>
                      <td className="table-td">
                        <div className="space-y-1">
                          <Badge
                            label={entry.entity_type}
                            variant={ENTITY_COLORS[entry.entity_type] ?? 'gray'}
                          />
                          <p className="text-xs text-gray-400 font-mono">
                            {entry.entity_id.slice(0, 8)}…
                          </p>
                        </div>
                      </td>
                      <td className="table-td">
                        <Badge
                          label={entry.action.replace(/_/g, ' ')}
                          variant={ACTION_COLORS[entry.action] ?? 'gray'}
                        />
                      </td>
                      <td className="table-td">
                        {entry.changed_by_user ? (
                          <div>
                            <p className="font-medium text-gray-800">
                              {entry.changed_by_user.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {entry.changed_by_user.role.replace(/_/g, ' ')}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400">System</span>
                        )}
                      </td>
                      <td className="table-td">
                        {entry.old_value ? (
                          <pre className="text-xs bg-red-50 text-red-700 rounded p-2 max-w-[180px] overflow-auto whitespace-pre-wrap">
                            {JSON.stringify(entry.old_value, null, 2)}
                          </pre>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="table-td">
                        {entry.new_value ? (
                          <pre className="text-xs bg-green-50 text-green-700 rounded p-2 max-w-[180px] overflow-auto whitespace-pre-wrap">
                            {JSON.stringify(entry.new_value, null, 2)}
                          </pre>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              Showing {page * limit + 1}–{page * limit + data.length} entries
            </span>
            <div className="flex gap-2">
              <button
                className="btn-secondary btn-sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                className="btn-secondary btn-sm"
                disabled={data.length < limit}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
