import { useApp } from '../context/AppContext'

export default function LanguageToggle({ className = '' }) {
  const { state, dispatch } = useApp()
  const isAr = state.language === 'ar'

  const toggle = () =>
    dispatch({ type: 'SET_LANGUAGE', payload: isAr ? 'en' : 'ar' })

  return (
    <button
      onClick={toggle}
      aria-label={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black/8 bg-card text-[12px] font-semibold transition-all hover:border-primary/40 hover:text-primary select-none ${className}`}
    >
      {/* Track */}
      <span
        className="relative inline-flex w-8 h-4.5 rounded-full transition-colors duration-300 shrink-0"
        style={{ background: isAr ? 'var(--color-primary)' : 'var(--color-line)' }}
      >
        <span
          className="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-300"
          style={{ transform: isAr ? 'translateX(14px)' : 'translateX(2px)' }}
        />
      </span>
      {/* Label */}
      <span style={{ color: isAr ? 'var(--color-primary)' : 'var(--color-muted)' }}>
        {isAr ? 'ع' : 'EN'}
      </span>
    </button>
  )
}
