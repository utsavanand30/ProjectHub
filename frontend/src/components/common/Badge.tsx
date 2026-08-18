import clsx from 'clsx'

interface BadgeProps {
  label: string
  variant?: 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'gray' | 'orange'
  size?: 'sm' | 'md'
}

const variants: Record<string, string> = {
  green:  'bg-green-100 text-green-800',
  amber:  'bg-amber-100 text-amber-800',
  red:    'bg-red-100 text-red-800',
  blue:   'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  gray:   'bg-gray-100 text-gray-700',
  orange: 'bg-orange-100 text-orange-800',
}

export function Badge({ label, variant = 'gray', size = 'md' }: BadgeProps) {
  return (
    <span
      className={clsx(
        'badge',
        variants[variant],
        size === 'sm' && 'text-[10px] px-2 py-0.5'
      )}
    >
      {label}
    </span>
  )
}

// ── Domain-specific badge helpers ─────────────────────────────────────────────

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    not_started: { label: 'Not Started', variant: 'gray' },
    in_progress: { label: 'In Progress', variant: 'blue' },
    on_hold:     { label: 'On Hold',     variant: 'orange' },
    completed:   { label: 'Completed',   variant: 'green' },
    cancelled:   { label: 'Cancelled',   variant: 'red' },
    // activity
    planned:     { label: 'Planned',     variant: 'purple' },
    blocked:     { label: 'Blocked',     variant: 'red' },
    // risk/issue
    open:        { label: 'Open',        variant: 'red' },
    mitigated:   { label: 'Mitigated',   variant: 'amber' },
    closed:      { label: 'Closed',      variant: 'gray' },
    resolved:    { label: 'Resolved',    variant: 'green' },
  }
  const { label, variant } = map[status] ?? { label: status, variant: 'gray' }
  return <Badge label={label} variant={variant} />
}

export function HealthBadge({ health }: { health: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    green: { label: 'On Track', variant: 'green' },
    amber: { label: 'At Risk',  variant: 'amber' },
    red:   { label: 'Delayed',  variant: 'red' },
  }
  const { label, variant } = map[health] ?? { label: health, variant: 'gray' }
  return <Badge label={label} variant={variant} />
}

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    low:      { label: 'Low',      variant: 'gray' },
    medium:   { label: 'Medium',   variant: 'blue' },
    high:     { label: 'High',     variant: 'amber' },
    critical: { label: 'Critical', variant: 'red' },
  }
  const { label, variant } = map[priority] ?? { label: priority, variant: 'gray' }
  return <Badge label={label} variant={variant} />
}

export function SeverityBadge({ severity }: { severity: string }) {
  return <PriorityBadge priority={severity} />
}
