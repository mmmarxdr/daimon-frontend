import { cn } from '../../lib/utils'

interface FormFieldProps {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function FormField({ label, hint, error, required, children, className }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-text-disabled">{hint}</p>}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
}
