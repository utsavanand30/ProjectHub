import clsx from 'clsx'

interface ProgressBarProps {
  value: number  // 0–100
  size?: 'sm' | 'md'
  showLabel?: boolean
}

function colorFor(v: number) {
  if (v >= 80) return 'bg-green-500'
  if (v >= 50) return 'bg-blue-500'
  if (v >= 25) return 'bg-amber-500'
  return 'bg-red-500'
}

export function ProgressBar({ value, size = 'md', showLabel = true }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className="flex items-center gap-2">
      <div className={clsx('flex-1 bg-gray-200 rounded-full overflow-hidden', size === 'sm' ? 'h-1.5' : 'h-2.5')}>
        <div
          className={clsx('h-full rounded-full transition-all', colorFor(clamped))}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && <span className="text-xs font-medium text-gray-600 w-8 text-right">{clamped}%</span>}
    </div>
  )
}
