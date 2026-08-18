import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { dashboardApi } from '../../api/dashboard'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { ErrorMessage } from '../../components/common/ErrorMessage'
import { StatusBadge, HealthBadge, SeverityBadge } from '../../components/common/Badge'
import { ProgressBar } from '../../components/common/ProgressBar'
import { formatDate, formatDateTime } from '../../utils/format'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color: string }) {
  return (
    <div className="card flex flex-col gap-1">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
    refetchInterval: 60_000,
  })

  if (isLoading) return <PageLoader />
  if (error) return <ErrorMessage error={error} />
  if (!data) return null

  const { project_stats: stats, recent_updates, todays_activities, open_risks, open_issues } = data

  const pieData = [
    { name: 'On Track', value: stats.on_track,   color: '#22c55e' },
    { name: 'At Risk',  value: stats.at_risk,    color: '#f59e0b' },
    { name: 'Delayed',  value: stats.delayed,    color: '#ef4444' },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-6">
      <h1 className="page-title">Dashboard</h1>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Projects"  value={stats.total}       color="text-gray-900" />
        <StatCard label="In Progress"     value={stats.in_progress} color="text-blue-600" />
        <StatCard label="On Track"        value={stats.on_track}    color="text-green-600" />
        <StatCard label="At Risk"         value={stats.at_risk}     color="text-amber-600" />
        <StatCard label="Delayed"         value={stats.delayed}     color="text-red-600" />
        <StatCard label="Avg Progress"    value={`${stats.avg_progress}%`} color="text-primary-600" />
      </div>

      {/* Charts + status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health pie */}
        <div className="card">
          <h2 className="section-title mb-4">Project Health</h2>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    {d.name}: {d.value}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No project data yet</p>
          )}
        </div>

        {/* Status breakdown */}
        <div className="card">
          <h2 className="section-title mb-4">Status Breakdown</h2>
          <div className="space-y-3">
            {[
              { label: 'Not Started', value: stats.not_started, max: stats.total, color: 'bg-gray-400' },
              { label: 'In Progress', value: stats.in_progress, max: stats.total, color: 'bg-blue-500' },
              { label: 'On Hold',     value: stats.on_hold,     max: stats.total, color: 'bg-amber-500' },
              { label: 'Completed',   value: stats.completed,   max: stats.total, color: 'bg-green-500' },
              { label: 'Cancelled',   value: stats.cancelled,   max: stats.total, color: 'bg-red-400' },
            ].map(({ label, value, max, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-24 flex-shrink-0">{label}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: max > 0 ? `${(value / max) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 w-4 text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Open risks/issues */}
        <div className="card">
          <h2 className="section-title mb-4">Open Risks & Issues</h2>
          <div className="space-y-2">
            {open_risks.slice(0, 3).map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-2 text-sm py-1 border-b border-gray-100">
                <span className="text-gray-700 truncate">{r.title}</span>
                <SeverityBadge severity={r.severity} />
              </div>
            ))}
            {open_issues.slice(0, 3).map((i) => (
              <div key={i.id} className="flex items-start justify-between gap-2 text-sm py-1 border-b border-gray-100">
                <span className="text-gray-700 truncate">{i.title}</span>
                <SeverityBadge severity={i.severity} />
              </div>
            ))}
            {open_risks.length === 0 && open_issues.length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">No open risks or issues</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent updates + Today's activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent updates */}
        <div className="card">
          <h2 className="section-title mb-4">Recent Project Updates</h2>
          {recent_updates.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No updates yet</p>
          ) : (
            <div className="space-y-4">
              {recent_updates.map((u) => (
                <div key={u.id} className="border-l-4 border-primary-500 pl-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Link to={`/projects/${u.project_id}`} className="text-sm font-medium text-primary-700 hover:underline">
                      View Project
                    </Link>
                    <div className="flex gap-2">
                      <StatusBadge status={u.status} />
                      <HealthBadge health={u.health} />
                    </div>
                  </div>
                  <ProgressBar value={u.progress_percentage} size="sm" />
                  <p className="text-xs text-gray-400 mt-1">
                    by {u.updated_by_user.name} · {formatDateTime(u.created_at)}
                  </p>
                  {u.key_achievements && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{u.key_achievements}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's activities */}
        <div className="card">
          <h2 className="section-title mb-1">Today's Activities</h2>
          <p className="text-xs text-gray-400 mb-4">{formatDate(new Date().toISOString())}</p>
          {todays_activities.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No activities logged today</p>
          ) : (
            <div className="space-y-3">
              {todays_activities.map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{a.description}</p>
                    <p className="text-xs text-gray-400">{a.user.name} · {a.hours_spent}h</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
