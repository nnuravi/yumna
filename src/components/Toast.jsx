import { useApp } from '../context/AppContext'

export default function ToastStack() {
  const { state, dispatch } = useApp()

  if (!state.toasts.length) return null

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[calc(100%-40px)] max-w-sm pointer-events-none">
      {state.toasts.map(toast => (
        <div
          key={toast.id}
          className="toast-enter pointer-events-auto bg-white rounded-xl border border-black/5 shadow-lg px-4 py-3 flex items-center gap-3"
          style={{ boxShadow: '0 12px 30px -10px rgba(11,15,25,0.35)' }}
        >
          <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: toast.type === 'error' ? '#fef2f2' : '#ecfdf5' }}>
            {toast.type === 'error'
              ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e5484d" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
            }
          </span>
          <p className="text-[13px] font-medium text-ink flex-1">{toast.message}</p>
        </div>
      ))}
    </div>
  )
}
