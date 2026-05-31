import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import AddBuyerSheet from './AddBuyerSheet'
import { MOCK_BUYERS, MOCK_REQUESTS, MOCK_SELLERS, MOCK_SELLER_ALERTS, formatSAR } from '../../data/mockData'

const STATUS_STYLE = {
  approved:           { bg: 'rgba(143,133,255,0.14)', color: '#5b4fe0',            label: 'APPROVED' },
  submitted:          { bg: 'rgba(143,133,255,0.14)', color: '#5b4fe0',            label: 'SUBMITTED' },
  disbursed:          { bg: 'rgba(16,185,129,0.12)',  color: '#0a8f63',            label: 'DISBURSED' },
  delivery_confirmed: { bg: 'rgba(245,158,11,0.14)',  color: '#b45309',            label: 'DELIVERING' },
  repaid:             { bg: 'rgba(11,15,25,0.06)',    color: 'rgba(11,15,25,0.5)', label: 'REPAID' },
  denied:             { bg: 'rgba(229,72,77,0.12)',   color: '#c03539',            label: 'DENIED' },
  stalled:            { bg: 'rgba(11,15,25,0.06)',    color: 'rgba(11,15,25,0.5)', label: 'STALLED' },
}

function AlertIcon({ type }) {
  if (type === 'disbursement') return (
    <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 mt-px"
      style={{ background: 'rgba(16,185,129,0.12)' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0a8f63" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  )
  if (type === 'warning') return (
    <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 mt-px"
      style={{ background: 'rgba(245,158,11,0.14)' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d98a0b" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.3 3.9 1.8 18a1.5 1.5 0 001.3 2.3h17.8a1.5 1.5 0 001.3-2.3L13.7 3.9a1.5 1.5 0 00-2.6 0z"/>
        <path d="M12 9v4"/><path d="M12 17h.01"/>
      </svg>
    </div>
  )
  return (
    <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 mt-px"
      style={{ background: 'rgba(143,133,255,0.14)' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5b4fe0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  )
}

// Sort buyers by utilisation % descending
const sortedBuyers = [...MOCK_BUYERS].sort(
  (a, b) => b.creditUsed / b.creditLimit - a.creditUsed / a.creditLimit
)

export default function SellerHome({ onTabChange }) {
  const { state } = useApp()
  const navigate = useNavigate()
  const [showAddBuyerSheet, setShowAddBuyerSheet] = useState(false)
  const [balanceHidden, setBalanceHidden] = useState(false)
  const user = state.currentUser

  const unreadCount = state.notes.seller.filter(n => !n.read).length

  // Merge mock + live requests, dedup, sort newest first
  const allRequests = [
    ...MOCK_REQUESTS,
    ...state.requests.filter(r => !MOCK_REQUESTS.find(m => m.id === r.id)),
  ].sort((a, b) => new Date(b.submitted || 0) - new Date(a.submitted || 0))

  const activeRequests = allRequests.filter(r => !['repaid', 'denied'].includes(r.stage))
  const cashIncoming  = activeRequests.filter(r => r.stage === 'approved').reduce((s, r) => s + (r.amount || r.amt || 0), 0)
  const heroBalance   = activeRequests.reduce((s, r) => s + (r.amount || r.amt || 0), 0)
  const mdrRate       = user?.mdrRate ?? 2.5
  const mdrCost       = Math.round(
    allRequests
      .filter(r => r.stage === 'disbursed' && (r.mdr === 'A' || !r.mdr))
      .reduce((s, r) => s + (r.amount || r.amt || 0) * (mdrRate / 100), 0)
  )
  const volumeMTD     = MOCK_SELLERS[0]?.volumeMTD ?? 0

  const recentRequests = allRequests.slice(0, 5)

  const balanceDisplay = balanceHidden
    ? '•••,•••'
    : new Intl.NumberFormat('en-SA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(heroBalance)

  return (
    <div className="flex flex-col">

      {/* ──────────────────────────────────────────────
          HERO — full-bleed immersive dark section
      ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden"
        style={{ background: 'linear-gradient(168deg, #181d33 0%, #0b0f19 62%)' }}>

        {/* Lavender ambient glow */}
        <div className="absolute pointer-events-none"
          style={{ top: -100, right: -80, width: 300, height: 300,
            background: 'radial-gradient(circle, rgba(143,133,255,0.38), transparent 70%)' }} />

        <div className="relative z-10 px-5 pt-3 pb-8">

          {/* Header row: avatar + name | icon buttons */}
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center text-white font-semibold text-[17px] shrink-0"
                style={{
                  width: 42, height: 42, borderRadius: '50%',
                  fontFamily: 'var(--font-display)',
                  background: 'linear-gradient(150deg, #a79dff, #6f63f0)',
                  border: '1.5px solid rgba(255,255,255,0.22)',
                }}>
                خ
              </div>
              <div>
                <div className="text-white font-semibold text-[17px]"
                  style={{ fontFamily: 'var(--font-display)', direction: 'rtl' }}>
                  مرحباً، {user?.nameAr?.split(' ')[0]}
                </div>
                <div className="text-white/50 text-[11px] mt-0.5">Wholesaler · {user?.city}</div>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                className="flex items-center justify-center"
                style={{ width: 38, height: 38, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>
                </svg>
              </button>
              <button
                className="relative flex items-center justify-center"
                style={{ width: 38, height: 38, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={() => onTabChange('alerts')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.7 21a2 2 0 0 1-3.4 0"/>
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute rounded-full bg-red-500"
                    style={{ top: 8, right: 9, width: 7, height: 7, boxShadow: '0 0 0 2px #14182b' }} />
                )}
              </button>
            </div>
          </div>

          {/* Hero balance */}
          <div className="mt-6">
            <button
              className="flex items-center gap-1.5 bg-transparent border-0 p-0 cursor-pointer"
              onClick={() => setBalanceHidden(h => !h)}>
              <span className="text-white/45 font-semibold uppercase"
                style={{ fontSize: 10, letterSpacing: '1.4px' }}>
                RECEIVED CREDIT
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {balanceHidden
                  ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                  : <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>
                }
              </svg>
            </button>

            <div className="text-white font-bold leading-none mt-2"
              style={{ fontFamily: 'var(--font-display)', fontSize: 42, letterSpacing: -1.2 }}>
              <span className="text-white/70 mr-1" style={{ fontSize: 24, fontWeight: 600, letterSpacing: 0 }}>SAR</span>
              {balanceDisplay}
            </div>

            {!balanceHidden && cashIncoming > 0 && (
              <div className="inline-flex items-center gap-1.5 mt-3.5 px-3 py-1.5 rounded-full font-semibold"
                style={{ fontSize: 12, background: 'rgba(16,185,129,0.16)', color: '#4ade9e' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade9e" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17 17 7M9 7h8v8"/>
                </svg>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatSAR(cashIncoming)}</span> incoming
              </div>
            )}
          </div>

          {/* Hero action buttons */}
          <div className="flex gap-2.5 mt-6">
            <button
              onClick={() => navigate('/seller/invoice')}
              className="flex-1 flex items-center justify-center gap-1.5 text-white font-semibold rounded-full"
              style={{
                fontSize: 13.5, padding: '14px 12px', whiteSpace: 'nowrap',
                background: 'var(--color-primary)',
                boxShadow: '0 12px 26px -10px rgba(143,133,255,0.9)',
              }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              New Request
            </button>
            <button
              onClick={() => setShowAddBuyerSheet(true)}
              className="flex-1 flex items-center justify-center gap-1.5 text-white font-semibold rounded-full"
              style={{
                fontSize: 13.5, padding: '14px 12px', whiteSpace: 'nowrap',
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.14)',
              }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="8" r="3.4"/>
                <path d="M3.5 20a5.5 5.5 0 0 1 11 0"/>
                <path d="M18 8v6M21 11h-6"/>
              </svg>
              Invite Buyer
            </button>
            <button
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                width: 48, height: 48,
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.14)',
              }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                <circle cx="5" cy="12" r="1.8"/>
                <circle cx="12" cy="12" r="1.8"/>
                <circle cx="19" cy="12" r="1.8"/>
              </svg>
            </button>
          </div>

        </div>
      </div>

      {/* ──────────────────────────────────────────────
          PAGE SHEET — rounds up over hero
      ────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--color-page)',
        borderRadius: '24px 24px 0 0',
        marginTop: -24,
        padding: '8px 18px 32px',
      }}>

        {/* ── METRICS 2×2 (recessed flat readout) ── */}
        <div className="mt-3 rounded-[20px] overflow-hidden"
          style={{ background: 'rgba(11,15,25,0.025)', border: '1px solid rgba(11,15,25,0.06)' }}>
          <div className="grid grid-cols-2">
            <div className="p-[18px]" style={{ borderRight: '1px solid rgba(11,15,25,0.06)', borderBottom: '1px solid rgba(11,15,25,0.06)' }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.4px', color: 'rgba(11,15,25,0.45)' }}>
                Active Requests
              </div>
              <div className="font-bold mt-2" style={{ fontFamily: 'var(--font-display)', fontSize: 21, letterSpacing: -0.4, color: 'var(--color-ink)' }}>
                {activeRequests.length}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(11,15,25,0.45)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                Worth {cashIncoming.toLocaleString('en-SA')}
              </div>
            </div>

            <div className="p-[18px]" style={{ borderBottom: '1px solid rgba(11,15,25,0.06)' }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.4px', color: 'rgba(11,15,25,0.45)' }}>
                Cash Incoming
              </div>
              <div className="font-bold mt-2" style={{ fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: -0.4, color: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums' }}>
                {formatSAR(cashIncoming)}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(11,15,25,0.45)', marginTop: 4 }}>pending disbursement</div>
            </div>

            <div className="p-[18px]" style={{ borderRight: '1px solid rgba(11,15,25,0.06)' }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.4px', color: 'rgba(11,15,25,0.45)' }}>
                Volume (May)
              </div>
              <div className="font-bold mt-2" style={{ fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: -0.4, color: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums' }}>
                {formatSAR(volumeMTD)}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(11,15,25,0.45)', marginTop: 4 }}>month to date</div>
            </div>

            <div className="p-[18px]">
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.4px', color: 'rgba(11,15,25,0.45)' }}>
                MDR Cost (May)
              </div>
              <div className="font-bold mt-2" style={{ fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: -0.4, color: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums' }}>
                {formatSAR(mdrCost)}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(11,15,25,0.45)', marginTop: 4 }}>at {mdrRate}% rate</div>
            </div>
          </div>
        </div>

        {/* ── RECENT REQUESTS — horizontal carousel ── */}
        <div className="mt-5">
          <div className="flex items-baseline justify-between mb-3">
            <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.2 }}>Recent Requests</h2>
            <button style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}
              onClick={() => onTabChange('money')}>
              See All
            </button>
          </div>

          <div
            className="flex gap-3 overflow-x-auto"
            style={{
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
              paddingBottom: 6,
              paddingTop: 2,
              paddingRight: 18,
              marginRight: -18,
            }}>
            {recentRequests.map(req => {
              const s = STATUS_STYLE[req.stage] || STATUS_STYLE.repaid
              return (
                <div key={req.id}
                  className="flex-none flex flex-col"
                  style={{
                    width: 170, scrollSnapAlign: 'start',
                    background: '#fff', borderRadius: 18,
                    border: '1px solid rgba(11,15,25,0.05)',
                    boxShadow: '0 1px 2px rgba(11,15,25,0.03)',
                    padding: 16,
                  }}>
                  <span className="font-bold"
                    style={{ fontSize: 9.5, letterSpacing: '0.5px', padding: '3px 8px', borderRadius: 999,
                      background: s.bg, color: s.color, alignSelf: 'flex-start' }}>
                    {s.label}
                  </span>
                  <div className="font-bold mt-3.5" style={{ fontFamily: 'var(--font-display)', fontSize: 19, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' }}>
                    {formatSAR(req.amount || req.amt)}
                  </div>
                  <div className="font-bold mt-2.5" style={{ fontSize: 13 }}>{req.id}</div>
                  <div style={{ fontSize: 11, color: 'rgba(11,15,25,0.5)', marginTop: 3 }}>{req.buyer}</div>
                  <div style={{ fontSize: 10.5, color: 'rgba(11,15,25,0.4)', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
                    {(req.submitted || '').slice(0, 10)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── BUYER CREDIT — single consolidated card ── */}
        <div className="mt-5">
          <div className="flex items-baseline justify-between mb-3">
            <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.2 }}>Buyer Credit</h2>
            <button style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>See All</button>
          </div>

          <div className="rounded-[20px] overflow-hidden"
            style={{ background: '#fff', border: '1px solid rgba(11,15,25,0.05)', boxShadow: '0 1px 2px rgba(11,15,25,0.03)' }}>
            {sortedBuyers.map((b, i) => {
              const pct = Math.round((b.creditUsed / b.creditLimit) * 100)
              const high = pct > 80
              return (
                <div key={b.id} style={{ padding: '12px 16px', borderTop: i > 0 ? '1px solid rgba(11,15,25,0.05)' : 'none' }}>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center text-white font-semibold shrink-0"
                      style={{
                        width: 34, height: 34, borderRadius: '50%', fontSize: 12,
                        fontFamily: 'var(--font-display)',
                        background: high ? '#e5484d' : 'var(--color-primary)',
                      }}>
                      {b.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold" style={{ fontSize: 14 }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(11,15,25,0.5)', marginTop: 2 }}>{b.city} · {b.txCount} deals</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontVariantNumeric: 'tabular-nums', color: high ? '#e5484d' : 'var(--color-ink)' }}>
                        {pct}%
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(11,15,25,0.45)', marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
                        of {formatSAR(b.creditLimit)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 rounded-full overflow-hidden" style={{ height: 4, background: 'rgba(11,15,25,0.07)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: high ? '#e5484d' : 'var(--color-primary)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── ALERTS FEED ── */}
        <div className="mt-5">
          <h2 className="mb-3" style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.2 }}>Recent Alerts</h2>
          <div className="flex flex-col gap-3">
            {MOCK_SELLER_ALERTS.map(alert => (
              <div key={alert.id}
                className="flex items-start gap-3"
                style={{ background: '#fff', borderRadius: 20, padding: '14px 16px', border: '1px solid rgba(11,15,25,0.05)', boxShadow: '0 1px 2px rgba(11,15,25,0.03)' }}>
                <AlertIcon type={alert.type} />
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 12.5, lineHeight: 1.4, color: 'rgba(11,15,25,0.85)' }}>
                    {alert.bold && <b style={{ fontWeight: 700, color: 'var(--color-ink)' }}>{alert.bold}</b>}
                    {alert.text}
                  </p>
                  <p style={{ fontSize: 10.5, color: 'rgba(11,15,25,0.4)', marginTop: 4, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                    {alert.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>{/* /page sheet */}

      {showAddBuyerSheet && (
        <AddBuyerSheet seller={user} onClose={() => setShowAddBuyerSheet(false)} />
      )}
    </div>
  )
}
