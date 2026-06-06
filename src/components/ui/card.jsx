import { cn } from '@/lib/utils'

export function Card({ className, ...props }) {
  return (
    <div
      className={cn('rounded-2xl border border-[var(--color-line)] bg-card', className)}
      style={{ boxShadow: 'var(--shadow-card)' }}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('flex flex-col gap-1 p-5', className)} {...props} />
}

export function CardTitle({ className, ...props }) {
  return <div className={cn('font-semibold text-ink text-[15px] leading-tight', className)} {...props} />
}

export function CardDescription({ className, ...props }) {
  return <div className={cn('text-[12px] text-muted', className)} {...props} />
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-5 pt-0', className)} {...props} />
}

export function CardFooter({ className, ...props }) {
  return <div className={cn('flex items-center p-5 pt-0', className)} {...props} />
}
