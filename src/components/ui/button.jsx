import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // primary brand — #9084fd
        default: 'bg-[var(--color-primary)] text-white shadow-sm hover:bg-[var(--color-primary-hover)]',
        // secondary — black
        secondary: 'bg-[var(--color-secondary)] text-white hover:bg-[var(--color-secondary-hover)]',
        outline: 'border border-[var(--color-line)] bg-white text-ink hover:bg-[var(--color-page)]',
        ghost: 'text-ink-soft hover:bg-black/5',
        soft: 'bg-[var(--color-primary-soft)] text-[var(--color-accent-foreground)] hover:brightness-95',
        destructive: 'bg-[var(--color-danger)] text-white hover:brightness-95',
        link: 'text-[var(--color-primary)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4',
        sm: 'h-8 px-3 text-[12px]',
        lg: 'h-11 px-6 text-[14px]',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export function Button({ className, variant, size, type = 'button', ...props }) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
}

export { buttonVariants }
