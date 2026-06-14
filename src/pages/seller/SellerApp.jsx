import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import Avatar from '../../components/Avatar'
import ToastStack from '../../components/Toast'
import InvoiceRow from '../../components/InvoiceRow'
import RequestDetailDrawer from '../../components/RequestDetailDrawer'
import useDismissable from '../../hooks/useDismissable'
import YumnaiPanel from '../admin/YumnaiPanel'
import { MOCK_SELLERS, MOCK_BUYERS } from '../../data/mockData'
import { IF_STEPS, DF_STEPS, STAGE_BADGE, SELLER_ACTION_STAGES } from '../../data/stages'

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
  whatsapp: <span title="WhatsApp" className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ background: '#25D366' }}>W</span>,
  email:    <span title="Email"    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ background: '#4f6ef7' }}>E</span>,
  inapp:    <span title="In-App"   className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ background: 'var(--color-primary)' }}>Y</span>,
}

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
                      <div className="flex gap-1">{n.channels.map(ch => CHANNEL_ICONS[ch])}</div>
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

const SELLER_NAV = [
  {
    id: 'Overview', label: 'Overview',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  },
  {
    id: 'Buyers', label: 'Buyers',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  },
  {
    id: 'Finance Requests', label: 'Finance Requests',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  },
  {
    id: 'All Transactions', label: 'All Transactions',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  },
]

// ── Invite Buyer Modal ────────────────────────────────────────────────────

function InviteBuyerModal({ user, onClose }) {
  useDismissable(onClose)
  const { addToast } = useApp()
  const [copied, setCopied] = useState(false)
  const inviteLink = `https://yumna.finance/register?ref=${user.id}&type=buyer`

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleChannel = (ch) => {
    addToast(`Invite sent via ${ch}`, 'success')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[14px] font-semibold text-ink">Invite a Buyer</div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <p className="text-[12px] text-muted mb-4 leading-snug">Share your unique invite link with buyers to connect them to your Yumna account.</p>

        {/* Link copy */}
        <div className="flex items-center gap-2 p-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-page)] mb-4">
          <span className="flex-1 text-[11px] text-muted font-mono truncate">{inviteLink}</span>
          <button onClick={handleCopy}
            className="shrink-0 flex items-center gap-1.5 px-3 h-7 rounded-xl text-[11px] font-semibold transition-all"
            style={{ background: copied ? '#dcfce7' : 'var(--color-primary-soft)', color: copied ? '#16a34a' : 'var(--color-primary)' }}>
            {copied ? (
              <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!</>
            ) : (
              <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy</>
            )}
          </button>
        </div>

        {/* Send via channel */}
        <div className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-3">Or send directly via</div>
        <div className="flex gap-2">
          {[
            { label: 'WhatsApp', bg: '#25D366', icon: 'W' },
            { label: 'Email',    bg: '#4f6ef7', icon: 'E' },
            { label: 'In-App',   bg: 'var(--color-primary)', icon: 'Y' },
          ].map(ch => (
            <button key={ch.label} onClick={() => handleChannel(ch.label)}
              className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: ch.bg }}>
              <span className="text-[11px] font-bold">{ch.icon}</span> {ch.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Overview tab ──────────────────────────────────────────────────────────

function OverviewTab({ user, sellerData, onNewRequest, onInvite }) {
  const { state } = useApp()
  const [openCard, setOpenCard] = useState(null)
  const d = sellerData || {}
  const kpis = [
    { label: 'Volume MTD', value: fmtShort(d.volumeMTD || 8100000), sub: 'This month', color: 'var(--color-primary)' },
    { label: 'Invoice Count', value: String(d.invoiceCount || 34), sub: 'Total invoices', color: '#10b981' },
    { label: 'MDR Rate', value: `${d.mdrRate || user.mdrRate || 2.5}%`, sub: 'Merchant discount rate', color: '#f59e0b' },
    { label: 'Account Status', value: d.status || 'Active', sub: 'Current standing', color: '#6366f1' },
  ]

  const isAction = c => SELLER_ACTION_STAGES.has(c.stage)
  const invoices = [...state.invoiceFinance.filter(c => (c.sellerId || c.merchantId) === user.id)]
    .sort((a, b) =>
      (isAction(b) - isAction(a)) || (b.submittedAt || '').localeCompare(a.submittedAt || '')
    )
    .slice(0, 5)
  const actionCount = invoices.filter(isAction).length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-black/6 p-5 shadow-sm">
            <div className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-2">{k.label}</div>
            <div className="text-[20px] font-bold" style={{ color: k.color }}>{k.value}</div>
            <div className="text-[11px] text-muted mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <button onClick={onNewRequest}
          className="flex items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-white transition-colors shadow-sm"
          style={{ background: 'var(--color-primary)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Finance Request
        </button>
        <button onClick={onInvite}
          className="flex items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold border transition-colors"
          style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', background: 'var(--color-primary-soft)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          Invite a Buyer
        </button>
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
                  sub={`${c.buyer || '—'} · ${c.submittedAt || '—'}`}
                  amount={fmt(c.amount)}
                  badge={badge}
                  accent={isAction(c)}
                  onClick={() => setOpenCard(c)}
                  action={isAction(c) ? (
                    <span className="text-[11px] font-medium text-muted shrink-0">Awaiting Yumna Review</span>
                  ) : null}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Business Info */}
      <div className="bg-white rounded-2xl border border-black/6 p-5 shadow-sm">
        <div className="text-[12px] font-semibold text-ink mb-3">Business Info</div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Business', value: user.business },
            { label: 'CR Number', value: user.cr },
            { label: 'City', value: user.city },
            { label: 'Phone', value: user.phone },
            { label: 'Email', value: user.email },
            { label: 'IBAN', value: user.iban },
          ].map(row => (
            <div key={row.label} className="flex flex-col gap-0.5 px-3 py-2 rounded-xl bg-[var(--color-page)]">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wide">{row.label}</span>
              <span className="text-[12px] text-ink">{row.value || '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {openCard && (
        <RequestDetailDrawer
          card={openCard} role="seller"
          stageSteps={IF_STEPS} stageMap={STAGE_BADGE}
          onClose={() => setOpenCard(null)}
        />
      )}
    </div>
  )
}

// ── Buyers tab ────────────────────────────────────────────────────────────

function BuyersTab({ user }) {
  const { state } = useApp()
  const linkedBuyerIds = new Set(
    [...state.repayments, ...state.pipeline]
      .filter(c => (c.merchantId || c.sellerId) === user.id)
      .map(c => c.buyerId)
      .filter(Boolean)
  )
  const buyers = linkedBuyerIds.size > 0
    ? MOCK_BUYERS.filter(b => linkedBuyerIds.has(b.id))
    : MOCK_BUYERS.slice(0, 3)

  return (
    <div className="space-y-3">
      {buyers.length === 0 && (
        <div className="text-center py-12 text-muted text-[13px]">No linked buyers yet</div>
      )}
      {buyers.map(b => {
        const isRisk = b.risk === 'High'
        return (
          <div key={b.id} className="bg-white rounded-2xl border border-black/6 p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0"
              style={{ background: '#737373' }}>
              {b.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-ink truncate">{b.name}</div>
              <div className="text-[11px] text-muted mt-0.5">{b.city} · {b.txCount} transactions</div>
            </div>
            <div className="text-right shrink-0 space-y-1">
              <div className="text-[12px] font-semibold text-ink">{fmtShort(b.creditUsed)}</div>
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: isRisk ? '#fef2f2' : '#f0fdf4', color: isRisk ? '#b91c1c' : '#15803d' }}>
                {b.risk} Risk
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Stage badge helper ────────────────────────────────────────────────────

function RequestCard({ c, stageMap, onClick }) {
  const s = stageMap[c.stage] || { bg: '#f5f5f5', text: '#525252', label: c.stage || '—' }
  return (
    <div onClick={onClick}
      className="bg-white rounded-2xl border border-black/6 p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: '#f8f6ff' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-ink">{c.invoiceNumber || c.id}</div>
          <div className="text-[11px] text-muted mt-0.5">{c.buyer || '—'} · {c.submittedAt || '—'}</div>
        </div>
        <div className="text-right shrink-0 space-y-1">
          <div className="text-[13px] font-semibold text-ink">{fmt(c.amount)}</div>
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: s.bg, color: s.text }}>{s.label}</span>
        </div>
      </div>
    </div>
  )
}

// ── New Request Modal ─────────────────────────────────────────────────────

function NewRequestModal({ user, onClose }) {
  useDismissable(onClose)
  const { dispatch, addToast } = useApp()
  const [step, setStep] = useState(0)
  const [type, setType] = useState(null)
  const [form, setForm] = useState({
    buyerId: '', buyer: '',
    invoiceNumber: '', invoiceDate: '',
    amount: '', description: '',
    sector: 'ICT', tenure: '30', purpose: '',
  })
  const [buyerQuery, setBuyerQuery] = useState('')
  const [buyerOpen, setBuyerOpen] = useState(false)
  const [invoiceFile, setInvoiceFile] = useState(null)
  const [dragging, setDragging] = useState(false)

  const sectors = ['ICT', 'Consumer Staples', 'Manufacturing', 'Healthcare', 'Retail', 'Food & Beverage']

  const filteredBuyers = MOCK_BUYERS.filter(b =>
    b.name.toLowerCase().includes(buyerQuery.toLowerCase())
  )

  const selectedBuyer = form.buyerId ? MOCK_BUYERS.find(b => b.id === form.buyerId) : null

  const selectBuyer = (b) => {
    setForm(p => ({ ...p, buyerId: b.id, buyer: b.name }))
    setBuyerQuery(b.name)
    setBuyerOpen(false)
  }

  const clearBuyer = () => {
    setForm(p => ({ ...p, buyerId: '', buyer: '' }))
    setBuyerQuery('')
    setBuyerOpen(true)
  }

  const ts = () => {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')} ${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`
  }

  const handleSubmit = () => {
    const now = new Date()
    const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
    const id = type === 'invoice_finance'
      ? `INV-R${Date.now().toString().slice(-4)}`
      : `DF-R${Date.now().toString().slice(-4)}`
    const amt = parseFloat(form.amount.replace(/,/g, '')) || 0
    const fmtAmt = Number(amt).toLocaleString()
    const time = ts()

    dispatch({ type: 'ADD_FINANCE_REQUEST', payload: {
      id, type,
      seller: user.business || user.name, sellerId: user.id,
      buyer: form.buyer || null, buyerId: form.buyerId || null,
      amount: amt,
      invoiceNumber: type === 'invoice_finance' ? (form.invoiceNumber || id) : null,
      invoiceDate: form.invoiceDate || null,
      description: form.description || null,
      sector: form.sector,
      tenure: parseInt(form.tenure) || 30,
      purpose: form.purpose || null,
      stage: type === 'invoice_finance' ? 'if_new_invoice' : 'df_new_request',
      submittedAt: date,
      mdrRate: user.mdrRate || 2.5,
      documents: invoiceFile ? [{ name: invoiceFile.name, status: 'uploaded', uploadedAt: date }] : [], correspondence: [],
    }})

    if (type === 'invoice_finance' && form.buyerId) {
      dispatch({ type: 'SEND_NOTIFICATION', payload: {
        id: `n-${Date.now()}-b`,
        recipientId: form.buyerId, recipientRole: 'buyer',
        text: `New invoice finance request from ${user.business || user.name} for SAR ${fmtAmt}. Your Yumna team is reviewing it.`,
        channels: ['whatsapp', 'email', 'inapp'],
        read: false, time,
      }})
    }

    dispatch({ type: 'SEND_NOTIFICATION', payload: {
      id: `n-${Date.now() + 1}-s`,
      recipientId: user.id, recipientRole: 'seller',
      text: `Your ${type === 'invoice_finance' ? 'invoice finance' : 'direct finance'} request (${id}) for SAR ${fmtAmt} has been submitted. Yumna is reviewing.`,
      channels: ['whatsapp', 'email', 'inapp'],
      read: false, time,
    }})

    addToast('Finance request submitted successfully', 'success')
    onClose()
  }

  const isValid = step === 0 ? !!type
    : type === 'invoice_finance'
      ? !!form.buyerId && form.amount.trim()
      : form.amount.trim()

  const ChannelBadges = () => (
    <div className="flex gap-1 shrink-0 mt-0.5">
      {[['#25D366','W'],['#4f6ef7','E'],['var(--color-primary)','Y']].map(([bg, label]) => (
        <span key={label} className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[7px] font-bold" style={{ background: bg }}>{label}</span>
      ))}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90dvh]" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/6 shrink-0">
          <div>
            <div className="text-[14px] font-semibold text-ink">New Finance Request</div>
            {step === 1 && <div className="text-[11px] text-muted mt-0.5">{type === 'invoice_finance' ? 'Invoice Finance' : 'Direct Finance'}</div>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Step 0 — type selection */}
          {step === 0 && [
            { key: 'invoice_finance', title: 'Invoice Finance', desc: 'Finance an invoice raised to a buyer. Yumna pays you upfront; the buyer repays Yumna on the agreed tenure.' },
            { key: 'direct_finance',  title: 'Direct Finance',  desc: 'Access a direct credit line from Yumna without an underlying invoice. Use it to fulfil orders or manage cash flow.' },
          ].map(opt => (
            <button key={opt.key} onClick={() => setType(opt.key)}
              className="w-full text-left p-4 rounded-2xl border-2 transition-all"
              style={{ borderColor: type === opt.key ? 'var(--color-primary)' : 'rgba(0,0,0,0.08)', background: type === opt.key ? '#f8f6ff' : 'white' }}>
              <div className="text-[13px] font-semibold text-ink mb-1">{opt.title}</div>
              <div className="text-[11px] text-muted leading-snug">{opt.desc}</div>
            </button>
          ))}

          {/* Step 1 — Invoice Finance */}
          {step === 1 && type === 'invoice_finance' && (<>

            {/* Buyer combobox */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-ink-soft">Buyer *</label>
              <div className="relative">
                <div className="flex items-center gap-2 w-full h-10 rounded-xl border border-[var(--color-line)] px-3 focus-within:ring-2 focus-within:ring-[var(--color-primary)] focus-within:border-transparent transition-all"
                  style={{ background: form.buyerId ? '#f8f6ff' : 'white' }}>
                  {selectedBuyer && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0"
                      style={{ background: selectedBuyer.risk === 'High' ? '#e5484d' : 'var(--color-primary)' }}>
                      {selectedBuyer.initials}
                    </div>
                  )}
                  <input
                    value={buyerQuery}
                    onChange={e => { setBuyerQuery(e.target.value); setBuyerOpen(true); if (!e.target.value) setForm(p => ({ ...p, buyerId: '', buyer: '' })) }}
                    onFocus={() => setBuyerOpen(true)}
                    onBlur={() => setTimeout(() => setBuyerOpen(false), 150)}
                    placeholder="Search buyer…"
                    className="flex-1 bg-transparent text-[13px] outline-none"
                  />
                  {form.buyerId && (
                    <button onMouseDown={e => { e.preventDefault(); clearBuyer() }} className="shrink-0 text-muted hover:text-ink transition-colors">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                </div>

                {buyerOpen && !form.buyerId && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-black/8 shadow-lg overflow-hidden z-10">
                    {filteredBuyers.length === 0
                      ? <div className="px-4 py-3 text-[12px] text-muted text-center">No buyers found</div>
                      : filteredBuyers.map(b => (
                        <button key={b.id} onMouseDown={() => selectBuyer(b)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f8f6ff] transition-colors text-left border-b border-black/4 last:border-0">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                            style={{ background: b.risk === 'High' ? '#e5484d' : 'var(--color-primary)' }}>
                            {b.initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold text-ink">{b.name}</div>
                            <div className="text-[11px] text-muted">{b.city} · CR {b.cr}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[11px] font-semibold text-ink">{fmt(b.creditLimit - b.creditUsed)}</div>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                              style={{ background: b.risk === 'High' ? '#fef2f2' : '#f0fdf4', color: b.risk === 'High' ? '#b91c1c' : '#166534' }}>
                              {b.risk} Risk
                            </span>
                          </div>
                        </button>
                      ))
                    }
                  </div>
                )}
              </div>

              {selectedBuyer && (
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[#f8f6ff] border border-[var(--color-primary)]/20">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold text-ink">{selectedBuyer.name}</span>
                      <span className="text-[10px] text-muted">· {selectedBuyer.city}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ background: selectedBuyer.risk === 'High' ? '#fef2f2' : '#f0fdf4', color: selectedBuyer.risk === 'High' ? '#b91c1c' : '#166534' }}>
                        {selectedBuyer.risk} Risk
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-muted">Available: <span className="font-semibold text-ink">{fmt(selectedBuyer.creditLimit - selectedBuyer.creditUsed)}</span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Invoice Number */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-ink-soft">Invoice Number</label>
              <input value={form.invoiceNumber} onChange={e => setForm(p => ({ ...p, invoiceNumber: e.target.value }))}
                placeholder="e.g. INV-2026-001"
                className="w-full h-10 rounded-xl border border-[var(--color-line)] px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent" />
            </div>

            {/* Invoice upload */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-ink-soft">Invoice Document</label>
              {invoiceFile ? (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[var(--color-line)] bg-white">
                  <span className="text-[16px]">📄</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-ink truncate">{invoiceFile.name}</div>
                    <div className="text-[11px] text-muted">{(invoiceFile.size / 1024).toFixed(1)} KB</div>
                  </div>
                  <button type="button" onClick={() => setInvoiceFile(null)}
                    className="text-muted hover:text-ink text-[14px] shrink-0">✕</button>
                </div>
              ) : (
                <label
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) setInvoiceFile(f) }}
                  className="flex flex-col items-center justify-center gap-1 px-3 py-5 rounded-xl border border-dashed cursor-pointer text-center transition-colors"
                  style={{ borderColor: dragging ? 'var(--color-primary)' : 'var(--color-line)', background: dragging ? 'var(--color-primary-soft)' : 'transparent' }}>
                  <span className="text-[13px] text-ink-soft">Drag &amp; drop the invoice, or <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>browse</span></span>
                  <span className="text-[11px] text-muted">PDF, JPG or PNG</span>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                    onChange={e => { const f = e.target.files[0]; if (f) setInvoiceFile(f) }} />
                </label>
              )}
            </div>

            {/* Invoice Date */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-ink-soft">Invoice Date</label>
              <input type="date" value={form.invoiceDate} onChange={e => setForm(p => ({ ...p, invoiceDate: e.target.value }))}
                className="w-full h-10 rounded-xl border border-[var(--color-line)] px-3 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-ink-soft">Amount (SAR) *</label>
              <input value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="e.g. 150,000"
                className="w-full h-10 rounded-xl border border-[var(--color-line)] px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent" />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-ink-soft">Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Goods or services description…" rows={2}
                className="w-full rounded-xl border border-[var(--color-line)] px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent resize-none" />
            </div>

            {/* Sector + Tenure */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-ink-soft">Sector</label>
                <select value={form.sector} onChange={e => setForm(p => ({ ...p, sector: e.target.value }))}
                  className="w-full h-10 rounded-xl border border-[var(--color-line)] px-3 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                  {sectors.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-ink-soft">Tenure (days)</label>
                <input value={form.tenure} onChange={e => setForm(p => ({ ...p, tenure: e.target.value }))}
                  placeholder="30" type="number"
                  className="w-full h-10 rounded-xl border border-[var(--color-line)] px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
              </div>
            </div>

            {/* Notification notice */}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0]">
              <ChannelBadges />
              <p className="text-[11px] text-[#166534] leading-snug">On submit, the buyer and you will be notified via WhatsApp, Email &amp; In-App.</p>
            </div>
          </>)}

          {/* Step 1 — Direct Finance */}
          {step === 1 && type === 'direct_finance' && (<>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-ink-soft">Amount (SAR) *</label>
              <input value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="e.g. 200,000"
                className="w-full h-10 rounded-xl border border-[var(--color-line)] px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent" />
            </div>

            {/* Purpose */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-ink-soft">Purpose</label>
              <input value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))}
                placeholder="e.g. Order fulfilment"
                className="w-full h-10 rounded-xl border border-[var(--color-line)] px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent" />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-ink-soft">Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Use of funds / brief details…" rows={2}
                className="w-full rounded-xl border border-[var(--color-line)] px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent resize-none" />
            </div>

            {/* Sector + Tenure */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-ink-soft">Sector</label>
                <select value={form.sector} onChange={e => setForm(p => ({ ...p, sector: e.target.value }))}
                  className="w-full h-10 rounded-xl border border-[var(--color-line)] px-3 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                  {sectors.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-ink-soft">Tenure (days)</label>
                <input value={form.tenure} onChange={e => setForm(p => ({ ...p, tenure: e.target.value }))}
                  placeholder="30" type="number"
                  className="w-full h-10 rounded-xl border border-[var(--color-line)] px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
              </div>
            </div>

            {/* Notification notice */}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0]">
              <ChannelBadges />
              <p className="text-[11px] text-[#166534] leading-snug">On submit, you will be notified via WhatsApp, Email &amp; In-App.</p>
            </div>
          </>)}

        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 pb-5 pt-3 border-t border-black/6 shrink-0">
          {step === 1 && (
            <button onClick={() => setStep(0)} className="px-4 h-10 rounded-xl border border-[var(--color-line)] text-[13px] font-semibold text-muted hover:bg-[var(--color-page)] transition-colors">Back</button>
          )}
          <button onClick={() => step === 0 ? setStep(1) : handleSubmit()} disabled={!isValid}
            className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ background: 'var(--color-primary)' }}>
            {step === 0 ? 'Continue' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Finance Requests tab ──────────────────────────────────────────────────

function FinanceRequestsTab({ user, onNewRequest }) {
  const { state } = useApp()
  const [subTab, setSubTab] = useState('invoice')
  const [openCard, setOpenCard] = useState(null)

  const runtimeIF = state.pendingRequests.filter(c => c.type === 'invoice_finance' && c.sellerId === user.id)
  const runtimeDF = state.pendingRequests.filter(c => c.type === 'direct_finance'  && c.sellerId === user.id)

  const invoiceCards = [
    ...runtimeIF,
    ...state.invoiceFinance.filter(c => (c.sellerId || c.merchantId) === user.id),
  ]
  const directCards = [
    ...runtimeDF,
    ...state.directFinance.filter(c => (c.sellerId || c.merchantId) === user.id),
  ]
  // fallback for demo — show some cards even if seller id doesn't match
  const showIF = invoiceCards.length > 0 ? invoiceCards : state.invoiceFinance.slice(0, 3)
  const showDF = directCards.length > 0 ? directCards : state.directFinance.slice(0, 2)

  return (
    <div>
      {/* Sub-tab bar + New Request button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-[var(--color-page)] rounded-xl p-1">
          {[['invoice', 'Invoice Finance'], ['direct', 'Direct Finance']].map(([key, label]) => (
            <button key={key} onClick={() => setSubTab(key)}
              className="px-3 h-8 rounded-lg text-[12px] font-semibold transition-all"
              style={{
                background: subTab === key ? '#fff' : 'transparent',
                color: subTab === key ? 'var(--color-primary)' : 'var(--color-ink-soft)',
                boxShadow: subTab === key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={onNewRequest}
          className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-[12px] font-semibold text-white transition-colors"
          style={{ background: 'var(--color-primary)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Request
        </button>
      </div>

      <div className="space-y-3">
        {subTab === 'invoice' && (
          showIF.length === 0
            ? <div className="text-center py-12 text-muted text-[13px]">No invoice finance requests yet</div>
            : showIF.map(c => <RequestCard key={c.id} c={c} stageMap={STAGE_BADGE} onClick={() => setOpenCard({ c, kind: 'invoice' })} />)
        )}
        {subTab === 'direct' && (
          showDF.length === 0
            ? <div className="text-center py-12 text-muted text-[13px]">No direct finance requests yet</div>
            : showDF.map(c => <RequestCard key={c.id} c={c} stageMap={STAGE_BADGE} onClick={() => setOpenCard({ c, kind: 'direct' })} />)
        )}
      </div>

      {openCard && (
        <RequestDetailDrawer
          card={openCard.c} role="seller"
          stageSteps={openCard.kind === 'direct' ? DF_STEPS : IF_STEPS}
          stageMap={STAGE_BADGE}
          onClose={() => setOpenCard(null)}
        />
      )}
    </div>
  )
}

// ── All Transactions tab ──────────────────────────────────────────────────

function TransactionsTab({ user }) {
  const { state } = useApp()
  const repayments = state.repayments.filter(c => c.merchantId === user.id)
  const invoices   = state.invoiceFinance.filter(c => (c.sellerId || c.merchantId) === user.id)

  const all = [
    ...repayments.map(c => ({ ...c, _type: 'repayment', _date: c.disbursementDate })),
    ...invoices.map(c => ({ ...c, _type: 'invoice', _date: c.submittedAt })),
  ].sort((a, b) => (b._date || '').localeCompare(a._date || ''))

  const fallback = state.repayments.slice(0, 3).map(c => ({ ...c, _type: 'repayment', _date: c.disbursementDate }))
  const display = all.length > 0 ? all : fallback

  return (
    <div className="space-y-2">
      {display.map(tx => {
        const isOverdue = tx.stage === 'rp_overdue'
        return (
          <div key={tx.id} className="bg-white rounded-2xl border border-black/6 p-4 shadow-sm flex items-center gap-4">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: '#f8f6ff' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-ink">{tx.id}</div>
              <div className="text-[11px] text-muted mt-0.5">{tx.buyer || '—'} · {tx._date || '—'}</div>
            </div>
            <div className="text-right shrink-0 space-y-1">
              <div className="text-[13px] font-semibold text-ink">{fmt(tx.totalAmount || tx.amount)}</div>
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: isOverdue ? '#fef2f2' : '#f0fdf4', color: isOverdue ? '#b91c1c' : '#15803d' }}>
                {isOverdue ? 'Overdue' : 'Active'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Profile slide-over ────────────────────────────────────────────────────

function ProfilePanel({ user, sellerData, onSignOut, onClose }) {
  useDismissable(onClose)
  const d = sellerData || {}

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1" />
      <div className="w-full max-w-sm bg-white h-full overflow-y-auto shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
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
              style={{ background: user.avatar || '#404040' }}>
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
              { label: 'Volume MTD',     value: fmtShort(d.volumeMTD || 8100000) },
              { label: 'Invoice Count',  value: String(d.invoiceCount || 34) },
              { label: 'MDR Rate',       value: `${d.mdrRate || user.mdrRate || 2.5}%` },
              { label: 'Status',         value: d.status || 'Active' },
            ].map(k => (
              <div key={k.label} className="rounded-xl bg-[var(--color-page)] p-3">
                <div className="text-[10px] font-semibold text-muted uppercase tracking-wide">{k.label}</div>
                <div className="text-[15px] font-bold text-ink mt-1">{k.value}</div>
              </div>
            ))}
          </div>

          {/* Business info */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">Business Info</div>
            {[
              { label: 'CR Number', value: user.cr },
              { label: 'Phone',     value: user.phone },
              { label: 'Email',     value: user.email },
              { label: 'IBAN',      value: user.iban },
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

// ── Main SellerApp ─────────────────────────────────────────────────────────

export default function SellerApp({ onSignOut }) {
  const { state, dispatch } = useApp()
  const user = state.currentUser
  const [activeTab, setActiveTab] = useState('Overview')
  const [showProfile, setShowProfile] = useState(false)
  const [showNewRequest, setShowNewRequest] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [yumnaiOpen, setYumnaiOpen] = useState(false)
  const [yumnaiMinimized, setYumnaiMinimized] = useState(false)
  const [yumnaiWidth, setYumnaiWidth] = useState(400)

  const sellerData = useMemo(() => MOCK_SELLERS.find(s => s.id === user?.id), [user?.id])

  const myNotifs = useMemo(() => {
    const workflow = [
      ...state.invoiceFinance.filter(c => (c.sellerId || c.merchantId) === user?.id).map(c => ({
        id: `wf-${c.id}`, recipientId: user.id, recipientRole: 'seller',
        text: `Invoice ${c.invoiceNumber || c.id} — ${c.stage || 'submitted'}`,
        channels: ['inapp'], read: true, time: c.submittedAt || '2026-06-05',
      })),
      ...state.repayments.filter(c => c.merchantId === user?.id && c.stage === 'rp_overdue').map(c => ({
        id: `wf-${c.id}`, recipientId: user.id, recipientRole: 'seller',
        text: `Overdue repayment from ${c.buyer}: ${fmt(c.balanceDue)} on ${c.id}`,
        channels: ['inapp'], read: false, time: c.disbursementDate || '2026-06-01',
      })),
    ]
    const admin = state.notifications.filter(n => n.recipientId === user?.id)
    return [...admin, ...workflow].sort((a, b) => (b.time || '').localeCompare(a.time || ''))
  }, [state.notifications, user?.id])

  const handleReadNotif = (id) => dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id })

  if (!user) return null

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
              {SELLER_NAV.map(item => {
                const active = activeTab === item.id
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
                  <div className="text-[10px] text-muted truncate">{user.business || 'Seller'}</div>
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
          {activeTab === 'Overview'          && <OverviewTab user={user} sellerData={sellerData} onNewRequest={() => setShowNewRequest(true)} onInvite={() => setShowInvite(true)} />}
          {activeTab === 'Buyers'            && <BuyersTab user={user} />}
          {activeTab === 'Finance Requests'  && <FinanceRequestsTab user={user} onNewRequest={() => setShowNewRequest(true)} />}
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
      {showProfile && <ProfilePanel user={user} sellerData={sellerData} onSignOut={onSignOut} onClose={() => setShowProfile(false)} />}
      {showNewRequest && <NewRequestModal user={user} onClose={() => setShowNewRequest(false)} />}
      {showInvite && <InviteBuyerModal user={user} onClose={() => setShowInvite(false)} />}
    </div>
  )
}
