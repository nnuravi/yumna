import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { formatSAR } from '../../data/mockData'

const STEPS = [
  { id: 'submitted', label: 'Submitted', labelAr: 'تم التقديم' },
  { id: 'approved', label: 'Approved', labelAr: 'تم الموافقة' },
  { id: 'delivery_confirmed', label: 'Delivery', labelAr: 'التسليم' },
  { id: 'disbursed', label: 'Disbursed', labelAr: 'تم الصرف' },
]

const STATUS_ORDER = ['submitted', 'approved', 'delivery_confirmed', 'disbursed', 'repaid']

export default function SubmissionStatus() {
  const navigate = useNavigate()
  const { state } = useApp()
  const fr = state.liveData
  const status = state.liveStatus

  if (!fr) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-5" style={{ background: 'var(--color-page)' }}>
        <p className="text-muted text-[14px] mb-4">No active finance request</p>
        <button onClick={() => navigate('/seller')} className="px-6 py-2.5 rounded-full text-white font-semibold text-[14px]" style={{ background: 'var(--color-primary)' }}>
          Go to Dashboard
        </button>
      </div>
    )
  }

  const statusIdx = STATUS_ORDER.indexOf(status)
  const stepIdx = STEPS.findIndex(s => s.id === status)

  const getStepState = (i) => {
    if (status === 'disbursed' || status === 'repaid') return 'done'
    const sIdx = STEPS.findIndex(s => s.id === status)
    if (i < sIdx) return 'done'
    if (i === sIdx) return 'active'
    return 'pending'
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--color-page)' }}>
      {/* Header */}
      <header className="px-5 pt-4 pb-3 flex items-center gap-3 bg-white border-b border-black/5">
        <button onClick={() => navigate('/seller')}
          className="w-9 h-9 rounded-full bg-card border border-black/5 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div>
          <div className="font-semibold text-ink text-[15px]">{fr.id}</div>
          <div className="text-[11px] text-muted">Finance Request Status</div>
        </div>
      </header>

      <div className="px-5 pt-5 pb-8">
        {/* Status Header */}
        <div className="bg-white rounded-3xl p-5 mb-5 border border-black/5">
          <div className="eyebrow mb-2">Finance Request</div>
          <div className="flex items-start justify-between">
            <div>
              <div className="display text-xl text-ink">{fr.id}</div>
              <div className="text-[13px] text-muted mt-0.5">{fr.buyer} · {formatSAR(fr.amt)}</div>
            </div>
            <StatusPill status={status} />
          </div>
        </div>

        {/* 4-Step Trail */}
        <div className="bg-white rounded-2xl border border-black/5 p-5 mb-4">
          <div className="eyebrow mb-4">Progress</div>
          <div className="flex items-center">
            {STEPS.map((step, i) => {
              const state = getStepState(i)
              const isLast = i === STEPS.length - 1
              return (
                <div key={step.id} className="flex items-center" style={{ flex: isLast ? 'none' : 1 }}>
                  {/* Circle */}
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                      style={{
                        background: state === 'done' ? '#10b981' : state === 'active' ? 'var(--color-primary)' : 'var(--color-line)',
                      }}
                    >
                      {state === 'done'
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                        : state === 'active'
                          ? <div className="w-2.5 h-2.5 rounded-full bg-white live-dot" />
                          : <div className="w-2 h-2 rounded-full bg-muted opacity-40" />
                      }
                    </div>
                    <span className="text-[9px] font-medium text-center leading-tight"
                      style={{ color: state === 'pending' ? 'var(--color-muted)' : 'var(--color-ink)' }}>
                      {step.label}
                    </span>
                  </div>
                  {/* Connector */}
                  {!isLast && (
                    <div className="flex-1 h-0.5 mx-1 transition-all"
                      style={{ background: getStepState(i) === 'done' ? '#10b981' : 'var(--color-line)' }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl border border-black/5 p-4 mb-4">
          <div className="eyebrow mb-3">Details</div>
          <InfoLine label="Buyer" value={fr.buyer} />
          <InfoLine label="Amount" value={formatSAR(fr.amt)} />
          <InfoLine label="Net payout" value={formatSAR(fr.amt * (1 - (fr.mdrRate||2.5)/100))} highlight />
          <InfoLine label="Tenure" value={`${fr.tenure} days`} />
          <InfoLine label="MDR Scenario" value={fr.mdr} />
          <InfoLine label="Risk Score" value={`${fr.riskScore} (${fr.riskScore < 30 ? 'Low' : fr.riskScore < 60 ? 'Medium' : 'High'})`} />
        </div>

        {/* Shortcuts */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => navigate('/admin')}
            className="w-full py-3 rounded-2xl border border-black/5 bg-white text-[13px] font-semibold text-ink flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            View in Admin FOMS
          </button>
          {(status === 'approved' || status === 'delivery_confirmed' || status === 'disbursed') && (
            <button
              onClick={() => navigate('/buyer')}
              className="w-full py-3 rounded-2xl border border-black/5 bg-white text-[13px] font-semibold flex items-center justify-center gap-2"
              style={{ color: 'var(--color-primary)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.55l1.65-7.45H6"/>
              </svg>
              Preview Buyer Experience
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusPill({ status }) {
  const MAP = {
    submitted: { label: 'Awaiting Review', bg: '#f3f4f6', color: '#6b7280' },
    approved: { label: 'Approved ✓', bg: '#ecfdf5', color: '#059669' },
    denied: { label: 'Denied', bg: '#fff1f2', color: '#e5484d' },
    stalled: { label: 'On Hold', bg: '#fffbeb', color: '#d97706' },
    delivery_confirmed: { label: 'Delivery Confirmed', bg: '#eff6ff', color: '#3b82f6' },
    disbursed: { label: 'Disbursed ✓', bg: '#ecfdf5', color: '#059669' },
    repaid: { label: 'Repaid ✓', bg: '#f3f4f6', color: '#374151' },
  }
  const cfg = MAP[status] || MAP.submitted
  return (
    <span className="px-3 py-1 rounded-full text-[11px] font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

function InfoLine({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-black/5 last:border-0">
      <span className="text-[12px] text-muted">{label}</span>
      <span className="text-[13px] font-semibold tabular" style={{ color: highlight ? 'var(--color-primary)' : 'var(--color-ink)' }}>
        {value}
      </span>
    </div>
  )
}
