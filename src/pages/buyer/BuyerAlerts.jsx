import { useApp } from '../../context/AppContext'

export default function BuyerAlerts() {
  const { state, dispatch } = useApp()
  const notes = state.notes.buyer

  const markRead = () => dispatch({ type: 'MARK_READ', payload: { persona: 'buyer' } })

  return (
    <div className="px-5 pb-8">
      <div className="flex items-center justify-between mt-5 mb-4">
        <h1 className="display text-xl text-ink">Alerts</h1>
        {notes.some(n => !n.read) && (
          <button onClick={markRead} className="text-[12px] font-medium" style={{ color: 'var(--color-primary)' }}>
            Mark all read
          </button>
        )}
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 rounded-2xl bg-card border border-black/5 flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          </div>
          <p className="text-muted text-[14px]">No alerts yet</p>
          <p className="text-muted/60 text-[12px] mt-1">Invoice and payment updates will appear here</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notes.map(note => (
            <div
              key={note.id}
              className="bg-white rounded-2xl p-4 border border-black/5 flex items-start gap-3"
              style={{ borderLeftWidth: note.read ? undefined : '3px', borderLeftColor: note.read ? undefined : 'var(--color-primary)' }}
            >
              <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center"
                style={{ background: note.read ? 'var(--color-card)' : 'rgba(143,133,255,0.1)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={note.read ? 'var(--color-muted)' : 'var(--color-primary)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-ink leading-snug">{note.text}</p>
                <p className="text-[11px] text-muted mt-1">{note.time}</p>
              </div>
              {!note.read && (
                <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: 'var(--color-primary)' }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
