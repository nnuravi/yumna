import { useState, useMemo } from 'react'
import { useApp, selectCreditSummary } from '../../context/AppContext'
import Avatar from '../../components/Avatar'
import ToastStack from '../../components/Toast'
import InvoiceRow from '../../components/InvoiceRow'
import RequestDetailDrawer from '../../components/RequestDetailDrawer'
import useDismissable from '../../hooks/useDismissable'
import YumnaiPanel from '../admin/YumnaiPanel'
import { MOCK_SELLERS } from '../../data/mockData'
import { IF_STEPS as STAGE_STEPS, STAGE_BADGE, BUYER_ACTION_STAGES as ACTION_STAGES } from '../../data/stages'

// ── helpers ────────────────────────────────────────────────────────────────

function fmt(n) {
  if (!n && n !== 0) return '—'
  return 'SAR ' + Number(n).toLocaleString('en', { maximumFractionDigits: 0 })
}

function fmtShort(n) {
  if (!n && n !== 0) return '—'
  if (n >= 1000000) return 'SAR ' + (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return 'SAR ' + (n / 1000).toFixed(0) + 'K'
  return 'SAR ' + n
}

const CHANNEL_ICONS = {
  whatsapp: (
    <span title="WhatsApp" className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ background: '#25D366' }}>W</span>
  ),
  email: (
    <span title="Email" className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ background: '#4f6ef7' }}>E</span>
  ),
  inapp: (
    <span title="In-App" className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ background: 'var(--color-primary)' }}>Y</span>
  ),
}

const STEP_LABELS = ['Business Info', 'Documents', 'Sign Agreement']

// ── Notification dropdown ──────────────────────────────────────────────────

function NotificationDropdown({ notifs, onRead }) {
  const unread = notifs.filter(n => !n.read).length
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="w-9 h-9 rounded-full bg-white border border-black/8 flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
      </button>
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center pointer-events-none">
          {unread}
        </span>
      )}
      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-2xl border border-black/8 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-black/6 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-ink">Notifications</span>
            {unread > 0 && <span className="text-[11px] text-[var(--color-primary)] font-medium">{unread} unread</span>}
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-black/5">
            {notifs.length === 0 && (
              <div className="px-4 py-6 text-center text-[12px] text-muted">No notifications</div>
            )}
            {notifs.map(n => (
              <div key={n.id} onClick={() => { onRead(n.id); setOpen(false) }}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                style={{ background: n.read ? 'transparent' : '#f8f6ff' }}>
                <div className="flex items-start gap-2">
                  {!n.read && <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] mt-1.5 shrink-0" />}
                  {n.read && <span className="w-2 h-2 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-ink leading-snug">{n.text}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[10px] text-muted">{n.time}</span>
                      <span className="text-muted mx-1">·</span>
                      <div className="flex gap-1">
                        {n.channels.map(ch => CHANNEL_ICONS[ch])}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  )
}

// ── Nav definition ────────────────────────────────────────────────────────

const BUYER_NAV = [
  {
    id: 'Overview', label: 'Overview',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  },
  {
    id: 'Finance Requests', label: 'Finance Requests', badge: true,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  },
  {
    id: 'Sellers', label: 'Sellers',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
  {
    id: 'All Transactions', label: 'All Transactions',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  },
]

// ── Onboarding Wizard ────────────────────────────────────────────────────

function OnboardingWizard({ user, onComplete }) {
  const [step, setStep] = useState(0) // 0, 1, 2
  const [docs, setDocs] = useState({ cr: null, trade: null }) // null | 'uploading' | 'done'
  const [sig, setSig] = useState('')
  const [agreed, setAgreed] = useState(false)

  const canProceed = [
    true,
    docs.cr === 'done' && docs.trade === 'done',
    sig.trim().length > 0 && agreed,
  ]

  const mockUpload = (key) => {
    setDocs(d => ({ ...d, [key]: 'uploading' }))
    setTimeout(() => setDocs(d => ({ ...d, [key]: 'done' })), 1200)
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 overflow-y-auto">
      {/* Step indicator */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 z-0" />
          {STEP_LABELS.map((label, i) => {
            const done   = i < step
            const active = i === step
            return (
              <div key={i} className="relative z-10 flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold border-2 transition-all"
                  style={{
                    background: done ? 'var(--color-primary)' : active ? '#fff' : '#f5f5f5',
                    borderColor: done || active ? 'var(--color-primary)' : '#e5e5e5',
                    color: done ? '#fff' : active ? 'var(--color-primary)' : '#a3a3a3',
                  }}>
                  {done ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : i + 1}
                </div>
                <span className="text-[11px] font-medium whitespace-nowrap"
                  style={{ color: active ? 'var(--color-primary)' : done ? 'var(--color-ink-soft)' : '#a3a3a3' }}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-sm border border-black/6 p-7">

        {step === 0 && (
          <>
            <h2 className="text-[17px] font-semibold text-ink mb-1">Confirm your business details</h2>
            <p className="text-[13px] text-muted mb-6">Please review the information on file. Contact support if anything needs updating.</p>
            <div className="space-y-3">
              {[
                { label: 'Business Name', value: user.business },
                { label: 'CR Number', value: user.cr },
                { label: 'City', value: user.city },
                { label: 'Phone', value: user.phone },
                { label: 'Email', value: user.email },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[var(--color-page)]">
                  <span className="text-[12px] font-semibold text-muted w-32 shrink-0">{row.label}</span>
                  <span className="text-[13px] text-ink">{row.value || '—'}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-[17px] font-semibold text-ink mb-1">Upload required documents</h2>
            <p className="text-[13px] text-muted mb-6">Please upload clear scans or photos of the following documents.</p>
            <div className="space-y-3">
              {[
                { key: 'cr',    label: 'Commercial Registration (CR)', hint: 'Valid CR certificate' },
                { key: 'trade', label: 'Trade License', hint: 'Current trade license' },
              ].map(({ key, label, hint }) => (
                <div key={key} className="flex items-center gap-3 p-4 rounded-2xl border border-black/8 bg-[var(--color-page)]">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-ink">{label}</div>
                    <div className="text-[11px] text-muted mt-0.5">{hint}</div>
                  </div>
                  {docs[key] === 'done' ? (
                    <div className="flex items-center gap-1.5 text-green-600 text-[12px] font-medium">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Uploaded
                    </div>
                  ) : docs[key] === 'uploading' ? (
                    <span className="text-[12px] text-muted animate-pulse">Uploading…</span>
                  ) : (
                    <button onClick={() => mockUpload(key)}
                      className="px-3 h-8 rounded-xl border border-[var(--color-primary)] text-[12px] font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] transition-colors">
                      Upload
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-[17px] font-semibold text-ink mb-1">Sign the Financing Agreement</h2>
            <p className="text-[13px] text-muted mb-4">Read the agreement carefully before signing.</p>
            <div className="rounded-2xl border border-black/8 bg-[var(--color-page)] p-4 h-40 overflow-y-auto mb-5 text-[12px] text-ink-soft leading-relaxed">
              <p className="font-semibold text-ink mb-2">Yumna Buyer Financing Agreement</p>
              <p>This agreement is entered into between Yumna Financial Services ("Yumna") and the undersigned buyer ("Buyer"). By activating your Yumna credit account, you agree to the following terms:</p>
              <p className="mt-2">1. Credit Facility: Yumna grants the Buyer a revolving credit line as specified in the Buyer's profile, subject to Yumna's credit policies.</p>
              <p className="mt-2">2. Repayment: All financed amounts are due within the agreed repayment period. Late payments may incur fees as outlined in the fee schedule.</p>
              <p className="mt-2">3. Data Use: Buyer consents to Yumna accessing credit bureau data for ongoing credit assessment.</p>
              <p className="mt-2">4. Governing Law: This agreement is governed by the laws of the Kingdom of Saudi Arabia.</p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-ink-soft">Full name (as signature)</label>
                <input value={sig} onChange={e => setSig(e.target.value)} placeholder={user.name}
                  className="w-full h-10 rounded-xl border border-[var(--color-line)] px-3 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent" />
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 accent-[var(--color-primary)]" />
                <span className="text-[12px] text-ink-soft leading-snug">
                  I have read and agree to the Yumna Buyer Financing Agreement and Terms of Service.
                </span>
              </label>
            </div>
          </>
        )}

        <div className="flex gap-3 mt-7">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="px-5 h-10 rounded-xl border border-[var(--color-line)] text-[13px] font-semibold text-ink-soft hover:bg-[var(--color-page)] transition-colors">
              Back
            </button>
          )}
          <button
            onClick={() => step < 2 ? setStep(s => s + 1) : onComplete()}
            disabled={!canProceed[step]}
            className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--color-primary)' }}>
            {step < 2 ? 'Continue' : 'Activate My Account'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Overview tab ─────────────────────────────────────────────────────────

function OverviewTab({ user, buyerData, dfRequested, setDfRequested }) {
  const { state, dispatch, addToast } = useApp()
  const [openCard, setOpenCard] = useState(null)

  const activePipeline = state.pipeline.filter(c => c.buyerId === user.id)
  const activeInvoices = state.invoiceFinance.filter(c => c.buyerId === user.id)
  const totalBusiness = state.repayments
    .filter(c => c.buyerId === user.id)
    .reduce((sum, c) => sum + (c.totalAmount || 0), 0)

  const credit = selectCreditSummary(state, user.id)
  const limit = credit.limit || user.creditLimit || 0
  const used  = credit.used
  const pending = credit.pending
  const avail = credit.available
  const pct   = limit > 0 ? Math.round((used / limit) * 100) : 0
  const pendingPct = limit > 0 ? Math.round((pending / limit) * 100) : 0

  const handleApprove = (card) => {
    dispatch({ type: 'APPROVE_INVOICE', payload: { id: card.id, actor: user.name } })
    addToast(card.stage === 'if_delivery_notice'
      ? `Delivery confirmed for ${card.invoiceNumber || card.id}`
      : `Invoice ${card.invoiceNumber || card.id} approved`, 'success')
    setOpenCard(null)
  }

  const kpis = [
    { label: 'Total Credit Limit', value: fmtShort(limit), sub: 'Approved facility', color: 'var(--color-primary)' },
    { label: 'Total Business Done', value: fmtShort(totalBusiness || 1240000), sub: 'Lifetime volume', color: '#10b981' },
    { label: 'Active Invoices', value: String(activeInvoices.length || 0), sub: 'Open positions', color: '#f59e0b' },
    { label: 'Active Requests', value: String(activePipeline.length || 0), sub: 'In pipeline', color: '#6366f1' },
  ]

  const runtimeInvoices = state.pendingRequests.filter(
    c => c.type === 'invoice_finance' && (c.buyerId === user.id || c.buyer === user.name)
  )
  const isAction = c => ACTION_STAGES.has(c.stage)
  const invoices = [...runtimeInvoices, ...state.invoiceFinance.filter(c => c.buyerId === user.id)]
    .reduce((acc, c) => { if (!acc.find(x => x.id === c.id)) acc.push(c); return acc }, [])
    .sort((a, b) =>
      (isAction(b) - isAction(a)) || (b.submittedAt || '').localeCompare(a.submittedAt || '')
    )
    .slice(0, 5)
  const actionCount = invoices.filter(isAction).length

  return (
    <div className="space-y-5">
      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-black/6 p-5 shadow-sm">
            <div className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-2">{k.label}</div>
            <div className="text-[22px] font-bold" style={{ color: k.color }}>{k.value}</div>
            <div className="text-[11px] text-muted mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Row A: Available Credit + Direct Finance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* Available credit bar */}
        <div className="bg-white rounded-2xl border border-black/6 p-5 shadow-sm h-full">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[13px] font-semibold text-ink">Available Credit</div>
              <div className="text-[11px] text-muted mt-0.5">{pct}% of your limit used</div>
            </div>
            <div className="text-right">
              <div className="text-[20px] font-bold" style={{ color: 'var(--color-primary)' }}>{fmtShort(avail)}</div>
              <div className="text-[11px] text-muted">of {fmtShort(limit)}</div>
            </div>
          </div>
          <div className="h-3 rounded-full bg-gray-100 overflow-hidden flex">
            <div className="h-full transition-all"
              style={{ width: `${pct}%`, background: pct > 80 ? '#ef4444' : 'var(--color-primary)' }} />
            <div className="h-full transition-all" style={{ width: `${pendingPct}%`, background: '#f59e0b' }} />
          </div>
          <div className="flex justify-between text-[10px] text-muted mt-1.5">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-primary)' }} />Used {fmt(used)}</span>
            {pending > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} />Pending {fmt(pending)}</span>}
            <span className="font-semibold text-ink">Available {fmt(avail)}</span>
          </div>
        </div>

        {/* Direct Finance CTA */}
        <div className="rounded-2xl border p-5 flex items-start gap-4 h-full"
          style={{
            background: dfRequested === 'active' ? '#f0fdf4' : 'linear-gradient(135deg, #f8f6ff 0%, #ede9ff 100%)',
            borderColor: dfRequested === 'active' ? '#bbf7d0' : 'var(--color-primary)',
          }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: dfRequested === 'active' ? '#dcfce7' : 'var(--color-primary-soft)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={dfRequested === 'active' ? '#16a34a' : 'var(--color-primary)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            {dfRequested === 'active' ? (
              <>
                <div className="text-[13px] font-semibold text-green-700">Direct Finance — Active</div>
                <div className="text-[12px] text-green-600 mt-0.5">You have access to an expanded credit line. Pay any seller directly.</div>
              </>
            ) : dfRequested === 'pending' ? (
              <>
                <div className="text-[13px] font-semibold text-ink">Request Pending</div>
                <div className="text-[12px] text-muted mt-0.5">Our team is reviewing your direct finance request. We'll notify you within 24 hours.</div>
              </>
            ) : (
              <>
                <div className="text-[13px] font-semibold text-ink">Unlock a larger credit line</div>
                <div className="text-[12px] text-muted mt-0.5">Apply for Direct Finance to access an expanded credit limit and pay any seller — not just invoice-backed transactions.</div>
                <button onClick={() => setDfRequested('pending')}
                  className="mt-3 px-4 h-8 rounded-xl text-[12px] font-semibold text-white transition-colors"
                  style={{ background: 'var(--color-primary)' }}>
                  Request Direct Finance
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Invoices */}
      {invoices.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="text-[13px] font-semibold text-ink">Invoices</div>
            {actionCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: '#fef9c3', color: '#92400e' }}>
                {actionCount}
              </span>
            )}
          </div>
          <div className="space-y-2">
            {invoices.map(c => {
              const badge = STAGE_BADGE[c.stage] || { bg: '#f5f5f5', text: '#525252', label: c.stage }
              return (
                <InvoiceRow key={c.id}
                  number={c.invoiceNumber || c.id}
                  sub={`${c.seller} · ${c.submittedAt || '—'}`}
                  amount={fmt(c.amount)}
                  badge={badge}
                  accent={isAction(c)}
                  onClick={() => setOpenCard(c)}
                  action={isAction(c) ? (
                    <button onClick={() => handleApprove(c)}
                      className="px-3 h-8 rounded-xl text-[12px] font-semibold text-white shrink-0 transition-colors"
                      style={{ background: 'var(--color-primary)' }}>
                      {c.stage === 'if_buyer_approval' ? 'Approve' : 'Confirm'}
                    </button>
                  ) : null}
                />
              )
            })}
          </div>
        </div>
      )}

      {openCard && (
        <RequestDetailDrawer
          card={openCard} role="buyer"
          stageSteps={STAGE_STEPS} stageMap={STAGE_BADGE}
          creditSummary={credit}
          actionLabel={ACTION_STAGES.has(openCard.stage) ? (openCard.stage === 'if_buyer_approval' ? 'Approve Invoice' : 'Confirm Delivery') : null}
          onAction={ACTION_STAGES.has(openCard.stage) ? () => handleApprove(openCard) : null}
          onClose={() => setOpenCard(null)}
        />
      )}
    </div>
  )
}

// ── Sellers tab ───────────────────────────────────────────────────────────

function SellersTab({ user }) {
  const { state } = useApp()
  const linkedSellerIds = new Set(
    [...state.repayments, ...state.pipeline]
      .filter(c => c.buyerId === user.id)
      .map(c => c.merchantId || c.sellerId)
      .filter(Boolean)
  )
  const sellers = linkedSellerIds.size > 0
    ? MOCK_SELLERS.filter(s => linkedSellerIds.has(s.id))
    : MOCK_SELLERS.slice(0, 3)

  return (
    <div className="space-y-3">
      {sellers.length === 0 && (
        <div className="text-center py-12 text-muted text-[13px]">No linked sellers yet</div>
      )}
      {sellers.map(s => (
        <div key={s.id} className="bg-white rounded-2xl border border-black/6 p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0"
            style={{ background: '#404040' }}>
            {s.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-ink truncate">{s.business || s.name}</div>
            <div className="text-[11px] text-muted mt-0.5">{s.city} · CR {s.cr}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[12px] font-semibold text-ink">{fmtShort(s.volumeMTD)}</div>
            <div className="text-[10px] text-muted">MTD Volume</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Finance Requests tab ─────────────────────────────────────────────────

function FinanceRequestsTab({ user }) {
  const { state, dispatch, addToast } = useApp()
  const [openCard, setOpenCard] = useState(null)
  const credit = selectCreditSummary(state, user.id)

  const runtimeCards = state.pendingRequests.filter(
    c => c.type === 'invoice_finance' && (c.buyerId === user.id || c.buyer === user.name)
  )
  const cards = [
    ...runtimeCards,
    ...state.invoiceFinance.filter(c => c.buyerId === user.id),
  ]

  const sorted = [...cards].sort((a, b) => {
    const aAction = ACTION_STAGES.has(a.stage) ? 0 : 1
    const bAction = ACTION_STAGES.has(b.stage) ? 0 : 1
    if (aAction !== bAction) return aAction - bAction
    return (b.submittedAt || '').localeCompare(a.submittedAt || '')
  })

  const currentStepIdx = (stage) => STAGE_STEPS.findIndex(s => s.key === stage)

  const handleApprove = (card) => {
    dispatch({ type: 'APPROVE_INVOICE', payload: { id: card.id, actor: user.name } })
    addToast(card.stage === 'if_delivery_notice'
      ? `Delivery confirmed for ${card.invoiceNumber || card.id}`
      : `Invoice ${card.invoiceNumber || card.id} approved`, 'success')
    setOpenCard(null)
  }

  return (
    <div className="space-y-4">
      {sorted.length === 0 && (
        <div className="text-center py-12 text-muted text-[13px]">No finance requests yet</div>
      )}
      {sorted.map(card => {
        const stepIdx = currentStepIdx(card.stage)
        const badge = STAGE_BADGE[card.stage] || { bg: '#f5f5f5', text: '#525252', label: card.stage }
        const needsAction = ACTION_STAGES.has(card.stage)

        return (
          <div key={card.id} onClick={() => setOpenCard(card)}
            className="bg-white rounded-2xl border shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            style={{ borderColor: needsAction ? '#fbbf24' : 'rgba(0,0,0,0.06)' }}>
            {needsAction && (
              <div className="px-4 py-2 text-[11px] font-semibold flex items-center gap-1.5"
                style={{ background: '#fffbeb', color: '#92400e', borderBottom: '1px solid #fde68a' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Your action is required
              </div>
            )}

            <div className="p-5">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-ink">{card.invoiceNumber}</div>
                  <div className="text-[12px] text-muted mt-0.5">{card.seller} · {card.sector} · {card.tenure}d tenure</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[16px] font-bold text-ink">{fmt(card.amount)}</div>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: badge.bg, color: badge.text }}>
                    {badge.label}
                  </span>
                </div>
              </div>

              {/* Stage tracker */}
              <div className="relative flex items-center justify-between mb-4">
                <div className="absolute left-0 right-0 h-0.5 bg-gray-100 top-[11px] z-0" />
                {STAGE_STEPS.map((step, i) => {
                  const done    = i < stepIdx
                  const current = i === stepIdx
                  return (
                    <div key={step.key} className="relative z-10 flex flex-col items-center gap-1.5" style={{ flex: 1 }}>
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                        style={{
                          background:   done ? 'var(--color-primary)' : current ? '#fff' : '#f5f5f5',
                          borderColor:  done || current ? 'var(--color-primary)' : '#e5e5e5',
                          boxShadow:    current ? '0 0 0 3px rgba(144,132,253,0.2)' : 'none',
                        }}>
                        {done ? (
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : current ? (
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-primary)' }} />
                        ) : null}
                      </div>
                      <span className="text-[9px] font-semibold text-center leading-tight"
                        style={{ color: done || current ? 'var(--color-primary)' : '#a3a3a3', maxWidth: 52 }}>
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Action button */}
              {needsAction && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleApprove(card) }}
                  className="w-full h-9 rounded-xl text-[12px] font-semibold text-white transition-colors"
                  style={{ background: 'var(--color-primary)' }}>
                  {card.stage === 'if_buyer_approval' ? 'Approve Invoice' : 'Confirm Delivery'}
                </button>
              )}
              {!needsAction && (
                <div className="text-[11px] text-muted">Tap to view timeline &amp; details</div>
              )}
            </div>
          </div>
        )
      })}

      {openCard && (
        <RequestDetailDrawer
          card={openCard} role="buyer"
          stageSteps={STAGE_STEPS} stageMap={STAGE_BADGE}
          creditSummary={credit}
          actionLabel={ACTION_STAGES.has(openCard.stage) ? (openCard.stage === 'if_buyer_approval' ? 'Approve Invoice' : 'Confirm Delivery') : null}
          onAction={ACTION_STAGES.has(openCard.stage) ? () => handleApprove(openCard) : null}
          onClose={() => setOpenCard(null)}
        />
      )}
    </div>
  )
}

// ── All Transactions tab ──────────────────────────────────────────────────

function TransactionsTab({ user }) {
  const { state } = useApp()
  const repayments = state.repayments.filter(c => c.buyerId === user.id)
  const pipeline   = state.pipeline.filter(c => c.buyerId === user.id)

  const STAGE_COLORS = {
    rp_active:   { bg: '#f0fdf4', text: '#15803d', label: 'Active' },
    rp_overdue:  { bg: '#fef2f2', text: '#b91c1c', label: 'Overdue' },
    rp_closed:   { bg: '#f5f5f5', text: '#737373', label: 'Closed' },
  }

  const all = [
    ...repayments.map(c => ({ ...c, _type: 'repayment', _date: c.disbursementDate })),
    ...pipeline.map(c => ({ ...c, _type: 'pipeline', _date: c.submittedAt || c.date })),
  ].sort((a, b) => (b._date || '').localeCompare(a._date || ''))

  return (
    <div className="space-y-2">
      {all.length === 0 && (
        <div className="text-center py-12 text-muted text-[13px]">No transactions yet</div>
      )}
      {all.map(tx => {
        const stage = STAGE_COLORS[tx.stage] || { bg: '#f8f6ff', text: 'var(--color-primary)', label: tx.stage || tx.stageLabel || '—' }
        return (
          <div key={tx.id} className="bg-white rounded-2xl border border-black/6 p-4 shadow-sm flex items-center gap-4">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: '#f8f6ff' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-ink truncate">{tx.id}</div>
              <div className="text-[11px] text-muted mt-0.5">{tx.merchant || tx.seller || '—'} · {tx._date || '—'}</div>
            </div>
            <div className="text-right shrink-0 space-y-1">
              <div className="text-[13px] font-semibold text-ink">{fmt(tx.totalAmount || tx.amount)}</div>
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: stage.bg, color: stage.text }}>
                {stage.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Profile slide-over ────────────────────────────────────────────────────

function ProfilePanel({ user, buyerData, onSignOut, onClose }) {
  useDismissable(onClose)
  const d = buyerData || {}
  const limit = d.creditLimit || user.creditLimit || 0
  const used  = d.creditUsed  || user.creditUsed  || 0
  const avail = Math.max(0, limit - used)
  const pct   = limit > 0 ? Math.round((used / limit) * 100) : 0

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1" />
      <div className="w-full max-w-sm bg-white h-full overflow-y-auto shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/6 shrink-0">
          <h2 className="text-[15px] font-semibold text-ink">My Profile</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="flex-1 p-5 space-y-5">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-[16px] font-bold shrink-0"
              style={{ background: user.avatar || 'var(--color-primary)' }}>
              {user.initials}
            </div>
            <div>
              <div className="font-semibold text-ink text-[15px]">{user.name}</div>
              <div className="text-[12px] text-muted mt-0.5">{user.business}</div>
              <div className="text-[11px] text-muted">{user.city}</div>
            </div>
          </div>

          {/* KPI grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Credit Limit', value: fmtShort(limit) },
              { label: 'Credit Used',  value: fmtShort(used) },
              { label: 'Risk Tier',    value: d.risk || 'Low' },
            ].map(k => (
              <div key={k.label} className="rounded-xl bg-[var(--color-page)] p-3">
                <div className="text-[10px] font-semibold text-muted uppercase tracking-wide">{k.label}</div>
                <div className="text-[15px] font-bold text-ink mt-1">{k.value}</div>
              </div>
            ))}
          </div>

          {/* Credit utilisation */}
          <div>
            <div className="flex justify-between text-[11px] text-muted mb-1.5">
              <span>Credit utilisation</span><span>{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct > 80 ? '#ef4444' : 'var(--color-primary)' }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted mt-1">
              <span>Used {fmt(used)}</span><span>Available {fmt(avail)}</span>
            </div>
          </div>

          {/* Business info */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">Business Info</div>
            {[
              { label: 'CR Number', value: user.cr },
              { label: 'Phone', value: user.phone },
              { label: 'Email', value: user.email },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[var(--color-page)]">
                <span className="text-[11px] font-semibold text-muted w-24 shrink-0">{row.label}</span>
                <span className="text-[12px] text-ink truncate">{row.value || '—'}</span>
              </div>
            ))}
          </div>

          {/* Documents */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">Documents</div>
            {[
              { label: 'Commercial Registration (CR)', status: 'verified' },
              { label: 'Trade License', status: 'verified' },
            ].map(doc => (
              <div key={doc.label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--color-page)]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span className="flex-1 text-[12px] text-ink">{doc.label}</span>
                <span className="text-[10px] font-semibold text-green-600 flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Verified
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sign out */}
        <div className="p-5 border-t border-black/6 shrink-0">
          <button onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-[13px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main BuyerApp ─────────────────────────────────────────────────────────

export default function BuyerApp({ onSignOut }) {
  const { state, dispatch } = useApp()
  const user = state.currentUser
  const [activeTab, setActiveTab] = useState('Overview')
  const [showProfile, setShowProfile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [dfRequested, setDfRequested] = useState(null)
  const [yumnaiOpen, setYumnaiOpen] = useState(false)
  const [yumnaiMinimized, setYumnaiMinimized] = useState(false)
  const [yumnaiWidth, setYumnaiWidth] = useState(400)

  const actionRequiredCount = useMemo(() =>
    state.invoiceFinance.filter(c => c.buyerId === user?.id && ACTION_STAGES.has(c.stage)).length
  , [state.invoiceFinance, user?.id])

  const buyerData = useMemo(() => state.buyers.find(b => b.id === user?.id), [state.buyers, user?.id])

  const myNotifs = useMemo(() => {
    const workflow = [
      ...state.pipeline.filter(c => c.buyerId === user?.id).map(c => ({
        id: `wf-${c.id}`, recipientId: user.id, recipientRole: 'buyer',
        text: `Finance application ${c.id} — status: ${c.stageLabel || c.stage}`,
        channels: ['inapp'], read: true, time: c.date || '2026-06-05',
      })),
      ...state.repayments.filter(c => c.buyerId === user?.id && c.stage === 'rp_overdue').map(c => ({
        id: `wf-${c.id}`, recipientId: user.id, recipientRole: 'buyer',
        text: `Payment overdue: ${fmt(c.balanceDue)} on ${c.id}`,
        channels: ['inapp'], read: false, time: c.disbursementDate || '2026-06-01',
      })),
    ]
    const admin = state.notifications.filter(n => n.recipientId === user?.id)
    return [...admin, ...workflow].sort((a, b) => (b.time || '').localeCompare(a.time || ''))
  }, [state.notifications, user?.id])

  const handleReadNotif = (id) => dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id })

  if (!user) return null

  // Onboarding — simple centered layout without sidebar
  if (user.onboardingStatus !== 'active') {
    return (
      <div className="flex flex-col h-dvh overflow-hidden app-bg">
        <header className="shrink-0 h-16 flex items-center justify-between px-6 bg-white border-b border-black/6 z-30">
          <div dir="ltr" className="flex items-center gap-2">
            <img src="/logo-mark.svg" alt="Yumna" className="h-8 w-auto" />
            <img src="/assets/logotype.svg" alt="Yumna" className="h-7 w-auto" />
          </div>
          <NotificationDropdown notifs={myNotifs} onRead={handleReadNotif} />
        </header>
        <OnboardingWizard user={user} onComplete={() => dispatch({ type: 'COMPLETE_ONBOARDING' })} />
        {showProfile && <ProfilePanel user={user} buyerData={buyerData} onSignOut={onSignOut} onClose={() => setShowProfile(false)} />}
        <ToastStack />
      </div>
    )
  }

  return (
    <div className="app-bg flex flex-col h-dvh overflow-hidden">
      {/* Header bar */}
      <header className="shrink-0 h-16 flex items-center pe-5 z-40">
        <div className="shrink-0 flex items-center h-full ps-6 overflow-hidden"
          style={{ width: sidebarOpen ? '248px' : '92px', transition: 'width 0.32s var(--ease-entrance)' }}>
          <div dir="ltr" className="flex items-center">
            <img src="/logo-mark.svg" alt="Yumna" className="h-8 w-auto shrink-0" />
            <img src="/assets/logotype.svg" alt="Yumna" className="h-8 w-auto shrink-0 ms-2"
              style={{ opacity: sidebarOpen ? 1 : 0, maxWidth: sidebarOpen ? '120px' : '0px', transition: 'opacity 0.25s var(--ease-entrance), max-width 0.32s var(--ease-entrance)' }} />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-between min-w-0 ps-1">
          <h1 className="font-semibold text-ink text-[16px] truncate">{activeTab}</h1>
          <div className="flex items-center gap-2.5">
            <button onClick={() => { setYumnaiMinimized(false); setYumnaiOpen(o => !o) }}
              className="flex items-center gap-1.5 px-3.5 h-9 rounded-full border text-[12px] font-semibold shadow-sm transition-all"
              style={{ background: yumnaiOpen ? 'var(--color-primary-soft)' : 'white', color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}>
              <img src="/yumnai.svg" alt="" className="h-3.5 w-auto" /> Yumnai
            </button>
            <NotificationDropdown notifs={myNotifs} onRead={handleReadNotif} />
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="shrink-0 pb-3 ps-3 overflow-hidden"
          style={{ width: sidebarOpen ? '248px' : '92px', transition: 'width 0.32s var(--ease-entrance)' }}>
          <div className={`flex h-full flex-col bg-white border border-[var(--color-line)] overflow-hidden ${sidebarOpen ? 'rounded-3xl' : 'rounded-full'}`}
            style={{ boxShadow: 'var(--shadow-rail)' }}>
            <nav className="flex-1 overflow-y-auto px-3 pt-4 pb-2 flex flex-col gap-1.5">
              {BUYER_NAV.map(item => {
                const active = activeTab === item.id
                const badge = item.badge ? actionRequiredCount : 0
                return (
                  <button key={item.id} onClick={() => setActiveTab(item.id)} title={item.label}
                    className="group relative flex items-center h-12 self-center transition-colors"
                    style={{
                      width: sidebarOpen ? '100%' : '48px',
                      borderRadius: sidebarOpen ? '14px' : '9999px',
                      transition: 'width 0.32s var(--ease-entrance)',
                      background: active ? 'var(--color-primary)' : 'transparent',
                      color: active ? '#fff' : 'var(--color-ink-soft)',
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--color-page)' }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                    <span className="relative grid place-items-center h-7 shrink-0"
                      style={{ width: sidebarOpen ? '40px' : '100%', transition: 'width 0.32s var(--ease-entrance)' }}>
                      {item.icon}
                      {badge > 0 && (
                        <span className="absolute top-0 right-1.5 min-w-[15px] h-[15px] px-1 rounded-full border-2 border-white text-[8px] font-bold flex items-center justify-center"
                          style={{ background: active ? '#fff' : '#f59e0b', color: active ? '#f59e0b' : '#fff' }}>
                          {badge}
                        </span>
                      )}
                    </span>
                    <span className={`text-[13px] truncate ${active ? 'font-semibold' : 'font-medium'}`}
                      style={{ opacity: sidebarOpen ? 1 : 0, maxWidth: sidebarOpen ? '150px' : '0px', transition: 'opacity 0.22s var(--ease-entrance), max-width 0.32s var(--ease-entrance)' }}>
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </nav>

            {/* User + collapse + sign-out */}
            <div className="border-t border-[var(--color-line)] p-3">
              <div className={`flex items-center ${sidebarOpen ? 'gap-2.5' : 'flex-col gap-2'}`}>
                <button onClick={() => setShowProfile(true)} className="shrink-0 rounded-full hover:ring-2 hover:ring-[var(--color-primary)] transition-all">
                  <Avatar initials={user.initials} bg={user.avatar} size="sm" />
                </button>
                <div className="flex-1 min-w-0 overflow-hidden"
                  style={{ opacity: sidebarOpen ? 1 : 0, maxWidth: sidebarOpen ? '150px' : '0px', transition: 'opacity 0.22s var(--ease-entrance), max-width 0.32s var(--ease-entrance)' }}>
                  <div className="text-[12px] font-semibold text-ink truncate">{user.name}</div>
                  <div className="text-[10px] text-muted truncate">{user.business || 'Buyer'}</div>
                </div>
                <button onClick={() => setSidebarOpen(o => !o)} title={sidebarOpen ? 'Collapse' : 'Expand'}
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--color-page)] border border-[var(--color-line)] shrink-0 hover:bg-white transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    style={{ transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.32s var(--ease-entrance)' }}>
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
              </div>
              <div style={{ overflow: 'hidden', maxHeight: sidebarOpen ? '40px' : '0px', opacity: sidebarOpen ? 1 : 0, transition: 'max-height 0.3s var(--ease-entrance), opacity 0.22s var(--ease-entrance)', marginTop: sidebarOpen ? '8px' : '0' }}>
                <button onClick={onSignOut}
                  className="w-full flex items-center gap-2 px-3 h-8 rounded-xl text-[12px] font-medium text-red-600 hover:bg-red-50 transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === 'Overview'          && <OverviewTab user={user} buyerData={buyerData} dfRequested={dfRequested} setDfRequested={setDfRequested} />}
          {activeTab === 'Finance Requests'  && <FinanceRequestsTab user={user} />}
          {activeTab === 'Sellers'           && <SellersTab user={user} />}
          {activeTab === 'All Transactions'  && <TransactionsTab user={user} />}
        </main>

        {(yumnaiOpen || yumnaiMinimized) && (
          <YumnaiPanel
            activeSection={activeTab}
            width={yumnaiWidth}
            onWidth={setYumnaiWidth}
            hidden={yumnaiMinimized}
            onClose={(engaged) => { setYumnaiOpen(false); setYumnaiMinimized(engaged) }}
          />
        )}
      </div>

      <ToastStack />
      {yumnaiMinimized && (
        <button
          onClick={() => { setYumnaiMinimized(false); setYumnaiOpen(true) }}
          className="fixed bottom-24 right-5 z-50 w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
          style={{ background: 'var(--color-primary)' }}
          title="Open Yumnai">
          <img src="/yumnai.svg" alt="Yumnai" className="h-5 w-auto" />
        </button>
      )}
      {showProfile && <ProfilePanel user={user} buyerData={buyerData} onSignOut={onSignOut} onClose={() => setShowProfile(false)} />}
    </div>
  )
}
