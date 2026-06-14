// Shared invoice list row — used by both the buyer and seller Overview tabs so
// their "Invoices" lists share one layout. The caller resolves the badge, the
// secondary line, and any action affordance (button or passive text). When
// `onClick` is provided the whole row becomes a button into the detail drawer;
// the action element stops propagation so its own handler still fires.
export default function InvoiceRow({ number, sub, amount, badge, action = null, accent = false, onClick = null }) {
  return (
    <div
      onClick={onClick || undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
      className={`bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-3 transition-shadow ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
      style={{ borderColor: accent ? '#fbbf24' : 'rgba(0,0,0,0.06)' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-[12px] font-mono font-semibold text-ink">{number}</span>
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: badge.bg, color: badge.text }}>{badge.label}</span>
          )}
        </div>
        <div className="text-[11px] text-muted truncate">{sub}</div>
      </div>
      <div className="text-right shrink-0 flex flex-col items-end gap-1.5"
        onClick={action ? (e) => e.stopPropagation() : undefined}>
        <div className="text-[12px] font-semibold text-ink">{amount}</div>
        {action}
      </div>
    </div>
  )
}
