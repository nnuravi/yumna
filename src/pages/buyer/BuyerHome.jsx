import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { MOCK_INVOICES_BUYER, CREDIT_TIERS, formatSAR } from '../../data/mockData'

export default function BuyerHome({ onTabChange }) {
  const { state } = useApp()
  const navigate = useNavigate()
  const user = state.currentUser
  const tier = CREDIT_TIERS.find(t => t.level === user?.tier) || CREDIT_TIERS[0]

  const liveFR = state.liveData && ['approved', 'delivery_confirmed', 'disbursed'].includes(state.liveStatus)
    ? { ...state.liveData, status: state.liveStatus }
    : null

  const totalOutstanding = MOCK_INVOICES_BUYER.reduce((s, i) => s + i.amount, 0)
  const nextDue = MOCK_INVOICES_BUYER.find(i => i.status !== 'overdue')?.dueDate

  // Inline notifications from global state
  const newNotes = state.notes.buyer.filter(n => !n.read).slice(0, 2)

  return (
    <div className="px-5 pb-8">
      {/* Inline notification banners */}
      {newNotes.map(n => (
        <div key={n.id} className="mt-3 px-4 py-3 rounded-2xl flex items-center gap-3 border"
          style={{ background: 'rgba(143,133,255,0.06)', borderColor: 'rgba(143,133,255,0.2)' }}>
          <div className="w-2 h-2 rounded-full shrink-0 live-dot" style={{ background: 'var(--color-primary)' }}/>
          <p className="text-[12px] text-ink-soft leading-snug flex-1">{n.text}</p>
        </div>
      ))}

      {/* Outstanding Balance Hero */}
      <div className="mt-4 rounded-3xl p-5" style={{ background: 'var(--color-ink)' }}>
        <div className="eyebrow text-white/40 mb-1">Total Outstanding</div>
        <div className="display text-3xl text-white tabular mb-1">{formatSAR(totalOutstanding)}</div>
        <div className="text-white/50 text-[12px]">
          {MOCK_INVOICES_BUYER.length} invoices
          {nextDue && ` · Next due ${new Date(nextDue).toLocaleDateString('en-SA', { month: 'short', day: 'numeric' })}`}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => onTabChange('payments')}
            className="flex-1 py-2.5 rounded-full text-ink bg-white font-semibold text-[13px]">
            Pay Now
          </button>
          <button onClick={() => onTabChange('payments')}
            className="flex-1 py-2.5 rounded-full border border-white/20 text-white/80 font-semibold text-[13px]">
            Schedule
          </button>
        </div>
      </div>

      {/* Credit Tier */}
      <div className="mt-4 bg-white rounded-2xl border border-black/5 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-[15px]"
            style={{ borderColor: tier.color, color: tier.color }}>
            {user?.tier}
          </div>
          <div>
            <div className="font-semibold text-[14px] text-ink">{tier.label} Member</div>
            <div className="text-[11px] text-muted">{tier.req}</div>
          </div>
        </div>
        {/* Tier track */}
        <div className="flex gap-1.5">
          {CREDIT_TIERS.map(t => (
            <div key={t.level} className="flex-1 h-1.5 rounded-full transition-all"
              style={{ background: t.level <= (user?.tier || 1) ? tier.color : 'var(--color-line)', opacity: t.level < (user?.tier || 1) ? 0.5 : 1 }} />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          {CREDIT_TIERS.map(t => (
            <span key={t.level} className="text-[9px]" style={{ color: t.level <= (user?.tier || 1) ? tier.color : 'var(--color-muted)' }}>
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {/* Live Finance Request */}
      {liveFR && (
        <div className="mt-4 bg-white rounded-2xl border-2 p-4" style={{ borderColor: 'var(--color-primary)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full live-dot" style={{ background: 'var(--color-primary)' }}/>
              <span className="text-[12px] font-semibold" style={{ color: 'var(--color-primary)' }}>New Invoice</span>
            </div>
            <ActionTag status={liveFR.status} />
          </div>
          <div className="font-semibold text-ink">{liveFR.id}</div>
          <div className="text-[13px] text-muted">{liveFR.seller} · {formatSAR(liveFR.amt)}</div>
          {liveFR.status === 'approved' && (
            <button
              onClick={() => navigate('/buyer/mdr-consent')}
              className="mt-3 w-full py-2.5 rounded-xl text-white font-semibold text-[13px]"
              style={{ background: 'var(--color-danger)' }}
            >
              Confirm Delivery →
            </button>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-white rounded-2xl p-4 border border-black/5">
          <div className="eyebrow mb-1">Available Credit</div>
          <div className="display text-lg tabular text-ink">{formatSAR((user?.creditLimit || 500000) - (user?.creditUsed || 185000))}</div>
          <div className="text-[11px] text-muted mt-0.5">of {formatSAR(user?.creditLimit || 500000)}</div>
          <div className="progress-track h-1.5 mt-2">
            <div className="progress-fill h-full" style={{ width: `${Math.round(((user?.creditUsed||185000)/(user?.creditLimit||500000))*100)}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/5">
          <div className="eyebrow mb-1">Transactions</div>
          <div className="display text-lg tabular text-ink">{user?.tier === 2 ? 8 : 3}</div>
          <div className="text-[11px] text-muted mt-0.5">{user?.tier === 2 ? '6 paid · 2 active' : '2 paid · 1 active'}</div>
        </div>
      </div>
    </div>
  )
}

function ActionTag({ status }) {
  const MAP = {
    approved: { label: 'Confirm Delivery', bg: '#fff1f2', color: '#e5484d' },
    delivery_confirmed: { label: 'Disbursing…', bg: '#eff6ff', color: '#3b82f6' },
    disbursed: { label: 'Due in 58 days', bg: '#fffbeb', color: '#d97706' },
  }
  const cfg = MAP[status] || { label: status, bg: '#f3f4f6', color: '#6b7280' }
  return (
    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}
