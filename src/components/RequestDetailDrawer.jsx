import useDismissable from '../hooks/useDismissable'

// Shared ticket detail slide-over for the Buyer and Seller apps. Shows the
// counterparty, amount, (buyer only) credit impact, stage progress, documents,
// and the full activity timeline built from the card's correspondence.
//
// Props:
//   card         – the request/invoice object
//   role         – 'buyer' | 'seller'
//   stageSteps   – [{ key, label }] for the horizontal tracker
//   stageMap     – { [stage]: { bg, text, label } } badge resolver
//   creditSummary– { limit, used, pending, available } (buyer only; optional)
//   actionLabel  – footer button text (optional)
//   onAction     – footer button handler (optional)
//   onClose      – required

function fmt(n) {
  if (!n && n !== 0) return '—'
  return 'SAR ' + Number(n).toLocaleString('en', { maximumFractionDigits: 0 })
}

const DOC_STATUS = {
  received: { label: 'Received', color: '#15803d', bg: '#f0fdf4' },
  uploaded: { label: 'Uploaded', color: '#15803d', bg: '#f0fdf4' },
  verified: { label: 'Verified', color: '#15803d', bg: '#f0fdf4' },
  pending:  { label: 'Pending',  color: '#92400e', bg: '#fef9c3' },
}

// Group correspondence entries into day buckets with friendly labels.
function groupByDay(entries) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yest = new Date(today); yest.setDate(yest.getDate() - 1)
  const keyOf = (e) => (e.time || '').slice(0, 10)
  const labelOf = (key) => {
    if (!key) return 'Earlier'
    const d = new Date(key + 'T00:00:00')
    if (d.getTime() === today.getTime()) return 'Today'
    if (d.getTime() === yest.getTime()) return 'Yesterday'
    return d.toLocaleDateString('en', { day: '2-digit', month: 'short' })
  }
  const sorted = [...entries].sort((a, b) => (a.time || '').localeCompare(b.time || ''))
  const groups = []
  for (const e of sorted) {
    const key = keyOf(e)
    let g = groups.find(x => x.key === key)
    if (!g) { g = { key, label: labelOf(key), entries: [] }; groups.push(g) }
    g.entries.push(e)
  }
  return groups
}

export default function RequestDetailDrawer({
  card, role = 'buyer', stageSteps = [], stageMap = {},
  creditSummary = null, actionLabel = null, onAction = null, onClose,
}) {
  useDismissable(onClose)
  if (!card) return null

  const counterparty = role === 'buyer' ? card.seller : card.buyer
  const counterpartyLabel = role === 'buyer' ? 'Requested by' : 'Buyer'
  const badge = stageMap[card.stage] || { bg: '#f5f5f5', text: '#525252', label: card.stage }
  const stepIdx = stageSteps.findIndex(s => s.key === card.stage)
  const groups = groupByDay(card.correspondence || [])
  const lastGi = groups.length - 1

  // Buyer-only credit footprint of this request.
  const impact = creditSummary && card.amount ? (() => {
    const { limit, used, pending } = creditSummary
    const amt = card.amount
    const pctOfLimit = limit > 0 ? Math.round((amt / limit) * 100) : 0
    const remainingAfter = Math.max(0, limit - used - pending)
    return { limit, used, pending, amt, pctOfLimit, remainingAfter }
  })() : null

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1" />
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col"
        role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/6 shrink-0">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-ink truncate">{card.invoiceNumber || card.id}</h2>
            <div className="text-[11px] text-muted mt-0.5 truncate">{counterpartyLabel}: {counterparty || '—'}</div>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="flex-1 p-5 space-y-6">
          {/* Amount + status */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">Amount requested</div>
              <div className="text-[24px] font-bold text-ink mt-1">{fmt(card.amount)}</div>
              <div className="text-[11px] text-muted mt-1">
                {[card.sector, card.tenure ? `${card.tenure}d tenure` : null].filter(Boolean).join(' · ') || '—'}
              </div>
            </div>
            <span className="inline-block mt-1 px-2.5 py-1 rounded-full text-[10px] font-semibold shrink-0"
              style={{ background: badge.bg, color: badge.text }}>{badge.label}</span>
          </div>

          {/* Credit impact (buyer only) */}
          {impact && (
            <div className="rounded-2xl border border-[var(--color-primary)]/20 bg-[#f8f6ff] p-4">
              <div className="text-[12px] font-semibold text-ink mb-1">Credit impact</div>
              <p className="text-[11px] text-muted leading-snug mb-3">
                This invoice draws <span className="font-semibold text-ink">{fmt(impact.amt)}</span>
                {' '}— {impact.pctOfLimit}% of your {fmt(impact.limit)} limit.
              </p>
              <div className="h-2.5 rounded-full bg-white overflow-hidden flex">
                <div className="h-full" style={{ width: `${impact.limit ? (impact.used / impact.limit) * 100 : 0}%`, background: 'var(--color-primary)' }} />
                <div className="h-full" style={{ width: `${impact.limit ? (impact.pending / impact.limit) * 100 : 0}%`, background: '#f59e0b' }} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted mt-2">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-primary)' }} /> Used {fmt(impact.used)}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} /> Pending {fmt(impact.pending)}</span>
                <span className="font-semibold text-ink">Available {fmt(impact.remainingAfter)}</span>
              </div>
            </div>
          )}

          {/* Stage tracker */}
          {stageSteps.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-3">Progress</div>
              <div className="relative flex items-center justify-between">
                <div className="absolute left-0 right-0 h-0.5 bg-gray-100 top-[11px] z-0" />
                {stageSteps.map((step, i) => {
                  const done = i < stepIdx
                  const current = i === stepIdx
                  return (
                    <div key={step.key} className="relative z-10 flex flex-col items-center gap-1.5" style={{ flex: 1 }}>
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                        style={{
                          background: done ? 'var(--color-primary)' : current ? '#fff' : '#f5f5f5',
                          borderColor: done || current ? 'var(--color-primary)' : '#e5e5e5',
                          boxShadow: current ? '0 0 0 3px rgba(144,132,253,0.2)' : 'none',
                        }}>
                        {done ? (
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : current ? (
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-primary)' }} />
                        ) : null}
                      </div>
                      <span className="text-[9px] font-semibold text-center leading-tight"
                        style={{ color: done || current ? 'var(--color-primary)' : '#a3a3a3', maxWidth: 56 }}>
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Documents */}
          {Array.isArray(card.documents) && card.documents.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-2">Documents</div>
              <div className="space-y-1.5">
                {card.documents.map((doc, i) => {
                  const st = DOC_STATUS[doc.status] || { label: doc.status || '—', color: '#525252', bg: '#f5f5f5' }
                  return (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--color-page)]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      <span className="flex-1 text-[12px] text-ink truncate">{doc.name}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Activity timeline */}
          <div>
            <div className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-3">Activity</div>
            {groups.length === 0 ? (
              <div className="text-[12px] text-muted">No activity yet.</div>
            ) : (
              <div className="relative">
                <div className="absolute top-3.5 bottom-3.5 w-px bg-slate-100" style={{ left: '5px' }} />
                {groups.map((group, gi) => (
                  <div key={group.key || gi}>
                    <div className="flex items-center gap-2 mb-3 mt-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{group.label}</span>
                      <div className="flex-1 h-px bg-slate-100" />
                    </div>
                    <div className="space-y-4 mb-2">
                      {group.entries.map((entry, ei) => {
                        const isLast = gi === lastGi && ei === group.entries.length - 1
                        return (
                          <div key={ei} className="relative pl-6">
                            <span className="absolute left-0 top-1 w-[11px] h-[11px] rounded-full bg-white border-2"
                              style={{ borderColor: isLast ? 'var(--color-primary)' : '#cbd5e1' }} />
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-semibold text-ink">{entry.from}</span>
                              {isLast && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#ede9ff', color: 'var(--color-primary)' }}>Latest</span>
                              )}
                              <span className="text-[10px] text-muted">{entry.time}</span>
                            </div>
                            <p className="text-[12px] text-ink-soft leading-snug mt-0.5">{entry.message}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer action */}
        {actionLabel && onAction && (
          <div className="p-5 border-t border-black/6 shrink-0">
            <button onClick={onAction}
              className="w-full h-11 rounded-xl text-[13px] font-semibold text-white transition-colors"
              style={{ background: 'var(--color-primary)' }}>
              {actionLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
