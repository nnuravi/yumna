import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import Badge from '../../components/Badge'
import AddBuyerSheet from './AddBuyerSheet'
import { MOCK_BUYERS, formatSAR } from '../../data/mockData'

export default function SellerHome({ onTabChange }) {
  const { state } = useApp()
  const navigate = useNavigate()
  const [showCreditSheet, setShowCreditSheet] = useState(false)
  const [showAddBuyerSheet, setShowAddBuyerSheet] = useState(false)
  const user = state.currentUser

  const totalCredit = MOCK_BUYERS.reduce((s, b) => s + b.creditLimit, 0)
  const totalUsed = MOCK_BUYERS.reduce((s, b) => s + b.creditUsed, 0)
  const activeRequests = state.requests.filter(r => !['repaid', 'denied'].includes(r.stage)).length
  const liveReq = state.liveData && state.liveStatus && !['repaid', 'denied'].includes(state.liveStatus)
    ? { ...state.liveData, stage: state.liveStatus }
    : null

  const recentRequests = state.requests.slice(0, 3)

  return (
    <div className="px-5 pb-8">
      {/* Hero Banner */}
      <div className="mt-4 rounded-3xl p-5" style={{ background: 'var(--color-ink)' }}>
        <div className="eyebrow text-white/40 mb-1">Wholesaler</div>
        <div className="display text-white text-xl mb-0.5">مرحباً، {user?.nameAr}</div>
        <div className="text-white/60 text-[13px]">{user?.name}</div>
        {liveReq && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />
            <span className="text-white text-[11px] font-semibold">{liveReq.id} Active</span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-white rounded-2xl p-4 border border-black/5">
          <div className="eyebrow mb-1">Active Requests</div>
          <div className="display text-2xl tabular text-ink">{activeRequests}</div>
          <div className="text-[12px] text-muted mt-0.5">
            {formatSAR(state.requests.filter(r => !['repaid','denied'].includes(r.stage)).reduce((s,r) => s + (r.amt||0), 0))} outstanding
          </div>
        </div>
        <button
          onClick={() => setShowCreditSheet(true)}
          className="bg-white rounded-2xl p-4 border border-black/5 text-start hover:shadow-md transition-shadow"
        >
          <div className="eyebrow mb-1">Total Credit Given</div>
          <div className="display text-2xl tabular text-ink">{formatSAR(totalCredit)}</div>
          <div className="text-[12px] text-muted mt-0.5">{Math.round((totalUsed/totalCredit)*100)}% utilised</div>
        </button>
      </div>

      {/* Live Request Card */}
      {liveReq && (
        <div className="mt-4 bg-white rounded-2xl border-2 p-4" style={{ borderColor: 'var(--color-primary)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full live-dot" style={{ background: 'var(--color-primary)' }}/>
              <span className="text-[12px] font-semibold" style={{ color: 'var(--color-primary)' }}>Live Request</span>
            </div>
            <Badge stage={liveReq.stage} />
          </div>
          <div className="font-semibold text-ink">{liveReq.id}</div>
          <div className="text-[13px] text-muted">{liveReq.buyer} · {formatSAR(liveReq.amt)}</div>
          {(state.liveStatus === 'submitted' || state.liveStatus === 'approved') && (
            <button
              onClick={() => navigate('/seller/status')}
              className="mt-3 w-full py-2 rounded-xl text-[13px] font-semibold transition-colors text-center"
              style={{ background: 'rgba(143,133,255,0.1)', color: 'var(--color-primary)' }}
            >
              Track Status →
            </button>
          )}
        </div>
      )}

      {/* CTAs */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <button
          onClick={() => navigate('/seller/invoice')}
          className="py-3 rounded-2xl text-white font-semibold text-[14px] transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'var(--color-primary)' }}
        >
          + Finance Request
        </button>
        <button
          onClick={() => setShowAddBuyerSheet(true)}
          className="py-3 rounded-2xl font-semibold text-[14px] border border-black/5 bg-white transition-all hover:shadow-sm active:scale-[0.98] text-ink"
        >
          Add Buyer
        </button>
      </div>

      {/* Recent Requests */}
      {recentRequests.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-ink text-[15px]">Recent Requests</h2>
            <button onClick={() => onTabChange('money')} className="text-[12px] font-medium" style={{ color: 'var(--color-primary)' }}>
              See all
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {recentRequests.map(req => (
              <div key={req.id} className="bg-white rounded-2xl p-4 border border-black/5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-ink text-[14px]">{req.id}</div>
                    <div className="text-[12px] text-muted">{req.buyer} · {req.submitted?.slice(0,10)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-[14px] tabular">{formatSAR(req.amt || req.amount)}</div>
                    <Badge stage={req.stage} className="mt-0.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clients */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-ink text-[15px]">Buyers</h2>
        </div>
        <div className="flex flex-col gap-2">
          {MOCK_BUYERS.map(b => (
            <div key={b.id} className="bg-white rounded-2xl p-4 border border-black/5">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-semibold shrink-0"
                  style={{ background: b.risk === 'High' ? '#e5484d' : 'var(--color-primary)' }}
                >
                  {b.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[14px] text-ink">{b.name}</div>
                  <div className="text-[11px] text-muted">{b.city} · {b.txCount} deals</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[12px] font-semibold tabular">{formatSAR(b.creditUsed)}</div>
                  <div className="text-[10px] text-muted">of {formatSAR(b.creditLimit)}</div>
                </div>
              </div>
              {/* Utilisation bar */}
              <div className="mt-2.5 progress-track h-1.5">
                <div
                  className="progress-fill h-full"
                  style={{
                    width: `${Math.round((b.creditUsed / b.creditLimit) * 100)}%`,
                    background: (b.creditUsed / b.creditLimit) > 0.8 ? '#e5484d' : 'var(--color-primary)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Credit Breakdown Bottom Sheet */}
      {showCreditSheet && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end" style={{ background: 'rgba(11,15,25,0.5)' }}
          onClick={() => setShowCreditSheet(false)}>
          <div
            className="sheet-enter bg-white rounded-t-3xl px-5 pt-3 pb-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-line mx-auto mb-5" />
            <h3 className="font-semibold text-ink text-[16px] mb-4">Credit Breakdown</h3>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] text-muted">Total Limit</span>
              <span className="font-semibold tabular">{formatSAR(totalCredit)}</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[13px] text-muted">Utilised</span>
              <span className="font-semibold tabular">{formatSAR(totalUsed)}</span>
            </div>
            <div className="flex flex-col gap-3">
              {MOCK_BUYERS.map(b => {
                const pct = Math.round((b.creditUsed / b.creditLimit) * 100)
                const high = pct > 80
                return (
                  <div key={b.id}>
                    <div className="flex items-center gap-3 mb-1.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
                        style={{ background: high ? '#e5484d' : 'var(--color-primary)' }}>
                        {b.initials}
                      </div>
                      <div className="flex-1">
                        <div className="text-[13px] font-medium text-ink">{b.name}</div>
                      </div>
                      <div className="text-[12px] font-semibold tabular" style={{ color: high ? '#e5484d' : 'var(--color-ink-soft)' }}>
                        {pct}%
                      </div>
                    </div>
                    <div className="progress-track h-1.5 ms-10">
                      <div className="progress-fill h-full" style={{ width: `${pct}%`, background: high ? '#e5484d' : 'var(--color-primary)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {showAddBuyerSheet && (
        <AddBuyerSheet
          seller={user}
          onClose={() => setShowAddBuyerSheet(false)}
        />
      )}
    </div>
  )
}
