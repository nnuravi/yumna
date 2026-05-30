export default function Avatar({ initials, bg = '#8f85ff', size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-8 h-8 text-[11px]',
    md: 'w-10 h-10 text-[13px]',
    lg: 'w-12 h-12 text-[15px]',
    xl: 'w-16 h-16 text-xl',
  }
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white shrink-0 ${className}`}
      style={{ background: bg }}
    >
      {initials}
    </div>
  )
}
