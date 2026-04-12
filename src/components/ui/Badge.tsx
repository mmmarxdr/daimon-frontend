import { cn } from '../../lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'accent'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-hover-surface text-text-secondary',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  error:   'bg-error-light text-error',
  accent:  'bg-accent-light text-accent',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm text-xs font-medium px-2 py-0.5',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
