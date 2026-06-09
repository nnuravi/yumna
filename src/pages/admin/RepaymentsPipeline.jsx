import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { REPAYMENTS_STAGES, REPAYMENTS_CARDS, formatSAR } from '../../data/mockData'

const ROLE_STAGE_MAP = {
  collections: ['rp_active', 'rp_overdue', 'rp_escalation_l1'],
  legal:       ['rp_escalation_l2', 'rp_escalation_l3'],
  super:       null,
  account_mgr: null,
}

const L1_OUTCOMES = [
  { value: 'answered_promised',  label: 'Answered — Promised payment' },
  { value: 'answered_disputed',  label: 'Answered — Disputed' },
  { value: 'no_answer',          label: 'No answer' },
  { value: 'voicemail',          label: 'Voicemail left' },
]
const L2_OUTCOMES = [
  { value: 'agreed_to_pay',       label: 'Agreed to pay' },
  { value: 'disputing',           label: 'Disputing' },
  { value: 'unresponsive',        label: 'Unresponsive' },
  { value: 'partial_received',    label: 'Partial payment received' },
]

const STAGE_LABELS = Object.fromEntries(REPAYMENTS_STAGES.map(s => [s.id, s.label]))

function stageIndex(id) { return REPAYMENTS_STAGES.findIndex(s => s.id === id) }

function dpd(card) {
  if (!['rp_overdue', 'rp_escalation_l1', 'rp_escalation_l2', 'rp_escalation_l3'].includes(card.stage)) return 0
  return card.daysInStage || 0
}

function outcomeLabel(outcome, level) {
  const list = level === 'L1' ? L1_OUTCOMES : L2_OUTCOMES
  return list.find(o => o.value === outcome)?.label || outcome
}

function feeModelLabel(fm) {
  if (fm === 'merchant_full') return 'Merchant pays fees'
  if (fm === 'split_50_50')   return '50/50 Split'
  if (fm === 'buyer_full')    return 'Buyer pays fees'
  return fm
}

function buildTimeline(card) {
  const entries = []
  entries.push({ id: 'h1', type: 'history', text: `Account disbursed · ${formatSAR(card.totalAmount)}`, date: card.disbursementDate })
  entries.push({ id: 'h2', type: 'history', text: `Assigned to ${card.assignedTo}`, date: card.disbursementDate })

  card.installmentSchedule.forEach(ins => {
    if (ins.status === 'paid') {
      entries.push({ id: `pay${ins.no}`, type: 'payment', text: `Instalment #${ins.no} received · ${formatSAR(ins.amount)}`, date: ins.dueDate, ref: ins.paymentConfirmation })
    }
  })

  card.escalationLog.forEach((e, i) => {
    entries.push({ id: `esc${i}`, type: 'escalation', text: `${e.level} call by ${e.contactedBy} · ${outcomeLabel(e.outcome, e.level)}`, notes: e.notes, date: e.date })
  })

  card.correspondence.forEach((c, i) => {
    entries.push({ id: `msg${i}`, type: c.from === 'System' ? 'system' : 'message', from: c.from, text: c.message, date: c.time })
  })

  if (card.closedAt) {
    entries.push({ id: 'closed', type: 'history', text: `Account closed — ${card.closureType === 'resolved' ? 'Resolved' : 'Written Off'} by ${card.closedBy}`, date: card.closedAt })
  }

  return entries.sort((a, b) => a.date.localeCompare(b.date))
}

function SARAmount({ amount }) {
  const num = new Intl.NumberFormat('en-SA', { minimumFractionDigits: 0 }).format(amount)
  return (
    <span>
      <span style={{ fontSize: '0.72em', color: '#a3a3a3', fontWeight: 500, marginRight: 2, letterSpacing: '0.02em' }}>SAR</span>{num}
    </span>
  )
}

// ── UI Primitives ─────────────────────────────────────────────────────────────

function Section({ title, children, badge, badgeColor }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{title}</span>
        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: badgeColor || '#525252' }}>{badge}</span>
        )}
        <div className="flex-1 h-px bg-slate-100" />
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-[10px] text-slate-400 mb-0.5 font-medium uppercase tracking-wide">{label}</div>
      {children}
    </div>
  )
}

function Btn({ onClick, disabled, variant = 'primary', children, className = '' }) {
  const base = 'px-4 py-2 rounded-xl text-[12px] font-semibold transition-all ' + className
  if (variant === 'primary') return (
    <button onClick={onClick} disabled={disabled}
      className={base + ' text-white'}
      style={{ background: disabled ? '#d4d4d4' : 'var(--color-primary)', cursor: disabled ? 'not-allowed' : 'pointer' }}>
      {children}
    </button>
  )
  if (variant === 'ghost') return (
    <button onClick={onClick} disabled={disabled}
      className={base + ' border border-black/10 bg-white text-slate-700 hover:bg-slate-50'}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
      {children}
    </button>
  )
  if (variant === 'danger') return (
    <button onClick={onClick} disabled={disabled}
      className={base + ' text-white'}
      style={{ background: disabled ? '#d4d4d4' : '#737373', cursor: disabled ? 'not-allowed' : 'pointer' }}>
      {children}
    </button>
  )
  return null
}

function StatusBadge({ status }) {
  const map = {
    paid:    { label: 'Paid',    bg: '#f5f5f5', color: '#262626' },
    pending: { label: 'Pending', bg: '#fafafa', color: '#a3a3a3' },
    overdue: { label: 'Overdue', bg: '#e5e5e5', color: '#525252' },
  }
  const s = map[status] || map.pending
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span>
  )
}

// ── Kanban Card ───────────────────────────────────────────────────────────────

function KanbanCard({ card, onClick, dimmed }) {
  const paidCount = card.installmentSchedule.filter(i => i.status === 'paid').length
  const total = card.installmentSchedule.length
  const progress = total > 0 ? (paidCount / total) * 100 : 0
  const dpdDays = dpd(card)
  const escLevel = card.stage === 'rp_escalation_l1' ? 'L1' : card.stage === 'rp_escalation_l2' ? 'L2' : card.stage === 'rp_escalation_l3' ? 'L3' : null

  return (
    <button onClick={onClick}
      className="w-full text-start rounded-2xl border bg-white p-3 mb-2 transition-all hover:shadow-sm"
      style={{ borderColor: '#e5e5e5', opacity: dimmed ? 0.45 : 1 }}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-[10px] font-mono text-slate-400">{card.id}</span>
        <div className="flex items-center gap-1">
          {dpdDays > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#e5e5e5', color: '#525252' }}>{dpdDays}d</span>
          )}
          {escLevel && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: '#404040' }}>{escLevel}</span>
          )}
        </div>
      </div>
      <div className="text-[12px] font-semibold text-slate-800 leading-tight mb-0.5 truncate">{card.buyer}</div>
      <div className="text-[10px] text-slate-400 mb-2 truncate">{card.merchant}</div>
      <div className="text-[13px] font-bold text-slate-800 mb-2"><SARAmount amount={card.totalOutstanding} /></div>
      <div className="flex items-center gap-1.5">
        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: '#404040' }} />
        </div>
        <span className="text-[9px] text-slate-400">{paidCount}/{total}</span>
      </div>
    </button>
  )
}

// ── Board View ────────────────────────────────────────────────────────────────

function ViewToggle({ viewMode, setViewMode }) {
  return (
    <div style={{ display: 'flex', gap: 2, marginLeft: 'auto' }}>
      <button onClick={() => setViewMode('kanban')}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
        style={{ background: viewMode === 'kanban' ? '#f1f5f9' : 'transparent', border: viewMode === 'kanban' ? '1px solid #e2e8f0' : '1px solid transparent', color: viewMode === 'kanban' ? '#262626' : '#a3a3a3' }}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <rect x="1" y="2" width="4" height="12" rx="0.8"/><rect x="6" y="2" width="4" height="12" rx="0.8"/><rect x="11" y="2" width="4" height="12" rx="0.8"/>
        </svg>
      </button>
      <button onClick={() => setViewMode('list')}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
        style={{ background: viewMode === 'list' ? '#f1f5f9' : 'transparent', border: viewMode === 'list' ? '1px solid #e2e8f0' : '1px solid transparent', color: viewMode === 'list' ? '#262626' : '#a3a3a3' }}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="14" y2="8"/><line x1="2" y1="12" x2="14" y2="12"/>
        </svg>
      </button>
    </div>
  )
}

function BoardView({ cards, adminRole, onSelect, search, setSearch, viewMode, setViewMode }) {
  const myStages = ROLE_STAGE_MAP[adminRole]
  const boardStages = REPAYMENTS_STAGES.filter(s => !s.terminal)

  const filtered = cards.filter(c => {
    const q = search.toLowerCase()
    return !q || c.buyer.toLowerCase().includes(q) || c.merchant.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
  })

  const stageCards = (stageId) => filtered.filter(c => c.stage === stageId)

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="px-6 py-3 border-b border-black/5 flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search buyer, merchant or ID…"
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border text-[12px] outline-none bg-white/70 backdrop-blur-sm focus:bg-white"
            style={{ borderColor: '#e5e5e5' }} />
        </div>
        <span className="text-[11px] text-slate-400">{filtered.filter(c => c.stage !== 'rp_closed').length} active</span>
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
      </div>

      {/* Columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full gap-0" style={{ minWidth: `${boardStages.length * 240}px` }}>
          {boardStages.map((stage, idx) => {
            const isOwned = !myStages || myStages.includes(stage.id)
            const colCards = stageCards(stage.id)
            return (
              <div key={stage.id} className="flex flex-col h-full shrink-0"
                style={{ width: 240, borderRight: idx < boardStages.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                {/* Lane header */}
                <div className="px-4 pt-4 pb-2 shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stage.label}</div>
                      <div className="text-[10px] text-slate-300 mt-0.5">{stage.assignedRole || '—'}</div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">{colCards.length}</span>
                  </div>
                </div>
                {/* Cards */}
                <div className="flex-1 overflow-y-auto px-3 pb-4">
                  {colCards.map(card => (
                    <KanbanCard key={card.id} card={card}
                      onClick={() => onSelect(card)}
                      dimmed={!isOwned} />
                  ))}
                  {colCards.length === 0 && (
                    <div className="text-center text-[11px] text-slate-300 py-8">No records</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── List View ─────────────────────────────────────────────────────────────────

function ListView({ cards, adminRole, onSelect, search, setSearch, viewMode, setViewMode }) {
  const [sortCol, setSortCol] = useState('daysInStage')
  const [sortDir, setSortDir] = useState('desc')

  const filtered = cards.filter(c => c.stage !== 'rp_closed').filter(c => {
    const q = search.toLowerCase()
    return !q || c.buyer.toLowerCase().includes(q) || c.merchant.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
  })

  const escLevel = (card) => card.stage === 'rp_escalation_l1' ? 'L1' : card.stage === 'rp_escalation_l2' ? 'L2' : card.stage === 'rp_escalation_l3' ? 'L3' : null

  const sortedCards = [...filtered].sort((a, b) => {
    let av = 0, bv = 0
    if (sortCol === 'outstanding') { av = a.totalOutstanding; bv = b.totalOutstanding }
    else if (sortCol === 'dpd') { av = dpd(a); bv = dpd(b) }
    else if (sortCol === 'daysInStage') { av = a.daysInStage; bv = b.daysInStage }
    else if (sortCol === 'progress') {
      const pct = c => c.installmentSchedule.length ? c.installmentSchedule.filter(i => i.status === 'paid').length / c.installmentSchedule.length : 0
      av = pct(a); bv = pct(b)
    }
    return sortDir === 'asc' ? av - bv : bv - av
  })

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  const COLS = [
    { key: 'id',          label: 'ID',           sortable: false },
    { key: 'buyer',       label: 'Buyer',         sortable: false },
    { key: 'merchant',    label: 'Merchant',      sortable: false },
    { key: 'outstanding', label: 'Outstanding',   sortable: true  },
    { key: 'stage',       label: 'Stage',         sortable: false },
    { key: 'dpd',         label: 'DPD',           sortable: true  },
    { key: 'progress',    label: 'Progress',      sortable: true  },
    { key: 'daysInStage', label: 'Days in Stage', sortable: true  },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-black/5 flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search buyer, merchant or ID…"
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border text-[12px] outline-none bg-white/70 backdrop-blur-sm focus:bg-white"
            style={{ borderColor: '#e5e5e5' }} />
        </div>
        <span className="text-[11px] text-slate-400">{filtered.length} active</span>
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="rounded-xl overflow-hidden border border-black/5">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-slate-50">
              <tr>
                {COLS.map(col => (
                  <th key={col.key}
                    onClick={() => col.sortable && toggleSort(col.key)}
                    className="text-start px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap"
                    style={{ cursor: col.sortable ? 'pointer' : 'default', userSelect: 'none' }}>
                    {col.label}
                    {col.sortable && sortCol === col.key && (
                      <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedCards.map(card => {
                const paid = card.installmentSchedule.filter(i => i.status === 'paid').length
                const tot = card.installmentSchedule.length
                const pct = tot ? Math.round(paid / tot * 100) : 0
                const esc = escLevel(card)
                const daysOverdue = dpd(card)
                const stg = REPAYMENTS_STAGES.find(s => s.id === card.stage)
                return (
                  <tr key={card.id}
                    onClick={() => onSelect(card)}
                    className="border-t border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors">
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400">{card.id}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-800">{card.buyer}</td>
                    <td className="px-4 py-2.5 text-slate-500">{card.merchant}</td>
                    <td className="px-4 py-2.5 font-bold tabular-nums text-slate-900"><SARAmount amount={card.totalOutstanding} /></td>
                    <td className="px-4 py-2.5">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                          style={{ background: stg?.color || '#525252' }}>
                          {stg?.label || card.stage}
                        </span>
                        {esc && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ background: '#404040' }}>{esc}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      {daysOverdue > 0
                        ? <span className="font-semibold tabular-nums" style={{ color: daysOverdue > 30 ? '#b91c1c' : '#c2410c' }}>{daysOverdue}d</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 60, height: 4, borderRadius: 20, background: '#f1f5f9', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 20, background: '#404040' }} />
                        </div>
                        <span className="text-slate-400 tabular-nums text-[11px]">{paid}/{tot}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 tabular-nums">{card.daysInStage}d</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {sortedCards.length === 0 && (
            <div className="text-center text-[12px] text-slate-400 py-10">No records match your search.</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Stage Bar ─────────────────────────────────────────────────────────────────

function StageBar({ currentStage }) {
  const idx = stageIndex(currentStage)
  return (
    <div className="flex items-center gap-0 overflow-x-auto py-1">
      {REPAYMENTS_STAGES.map((s, i) => {
        const done = i < idx
        const active = i === idx
        return (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border-2 transition-all"
                style={{
                  background: done ? '#262626' : active ? 'var(--color-primary)' : 'white',
                  borderColor: done ? '#262626' : active ? 'var(--color-primary)' : '#d4d4d4',
                  color: (done || active) ? 'white' : '#a3a3a3',
                }}>
                {done ? '✓' : i + 1}
              </div>
              <div className="text-[9px] mt-1 font-medium whitespace-nowrap"
                style={{ color: active ? 'var(--color-primary)' : done ? '#525252' : '#a3a3a3' }}>
                {s.label}
              </div>
            </div>
            {i < REPAYMENTS_STAGES.length - 1 && (
              <div className="w-8 h-px mx-1 mb-3" style={{ background: i < idx ? '#262626' : '#e5e5e5' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Installment Table ─────────────────────────────────────────────────────────

function InstallmentTable({ schedule }) {
  const paidCount = schedule.filter(i => i.status === 'paid').length
  const total = schedule.length
  const progress = total > 0 ? (paidCount / total) * 100 : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-slate-500">{paidCount} of {total} instalments paid</span>
        <span className="text-[11px] font-semibold text-slate-700">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 mb-3 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: '#262626' }} />
      </div>
      <div className="rounded-xl overflow-hidden border border-black/5">
        <table className="w-full text-[11px]">
          <thead>
            <tr style={{ background: '#fafafa' }}>
              <th className="text-left px-3 py-2 text-slate-400 font-semibold">#</th>
              <th className="text-left px-3 py-2 text-slate-400 font-semibold">Due Date</th>
              <th className="text-right px-3 py-2 text-slate-400 font-semibold">Amount</th>
              <th className="text-center px-3 py-2 text-slate-400 font-semibold">Status</th>
              <th className="text-right px-3 py-2 text-slate-400 font-semibold">Late Fee</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map(ins => (
              <tr key={ins.no} className="border-t border-black/5">
                <td className="px-3 py-2 text-slate-500">{ins.no}</td>
                <td className="px-3 py-2 text-slate-700 font-mono">{ins.dueDate}</td>
                <td className="px-3 py-2 text-right font-semibold text-slate-800"><SARAmount amount={ins.amount} /></td>
                <td className="px-3 py-2 text-center"><StatusBadge status={ins.status} /></td>
                <td className="px-3 py-2 text-right" style={{ color: ins.lateFee > 0 ? '#525252' : '#a3a3a3' }}>
                  {ins.lateFee > 0 ? <SARAmount amount={ins.lateFee} /> : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Stage Action Panels ───────────────────────────────────────────────────────

function ActivePanel({ card, onUpdate, addToast }) {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')

  const nextDue = card.installmentSchedule.find(i => i.status === 'pending' || i.status === 'overdue')
  const duesSoon = nextDue && nextDue.dueDate <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

  const logPayment = () => {
    if (!amount || !date) return
    const updated = {
      ...card,
      repaidAmount: card.repaidAmount + Number(amount),
      totalOutstanding: card.totalOutstanding - Number(amount),
      balanceDue: Math.max(0, card.balanceDue - Number(amount)),
      installmentSchedule: card.installmentSchedule.map((ins, idx) => {
        if (ins.no === nextDue?.no) return { ...ins, status: 'paid', paymentConfirmation: `TXN-${Date.now().toString().slice(-4)}` }
        return ins
      }),
      correspondence: [...card.correspondence, { from: 'System', message: `Payment of ${formatSAR(Number(amount))} logged for instalment #${nextDue?.no}.`, time: `${date} · Manual entry`, autoRead: true }],
    }
    onUpdate(updated)
    addToast(`Payment of ${formatSAR(Number(amount))} logged for ${card.id}.`, 'success')
    setAmount('')
    setDate('')
  }

  return (
    <div className="space-y-4">
      {nextDue ? (
        <div className="rounded-xl p-3 border" style={{ background: duesSoon ? '#fafafa' : 'white', borderColor: duesSoon ? '#d4d4d4' : '#f0f0f0' }}>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Next Instalment Due</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[18px] font-bold text-slate-800"><SARAmount amount={nextDue.amount} /></div>
              <div className="text-[11px] text-slate-500 mt-0.5">#{nextDue.no} · Due {nextDue.dueDate}</div>
            </div>
            {duesSoon && <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: '#e5e5e5', color: '#525252' }}>Due soon</span>}
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-3 border border-black/5 bg-slate-50 text-[12px] text-slate-500 text-center">All instalments paid</div>
      )}

      <Section title="Log Payment">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <div className="text-[10px] text-slate-400 mb-1">Amount (SAR)</div>
            <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="0"
              className="w-full px-3 py-2 rounded-xl border text-[12px] outline-none"
              style={{ borderColor: '#e5e5e5' }} />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 mb-1">Payment Date</div>
            <input value={date} onChange={e => setDate(e.target.value)} type="date"
              className="w-full px-3 py-2 rounded-xl border text-[12px] outline-none"
              style={{ borderColor: '#e5e5e5' }} />
          </div>
        </div>
        <Btn onClick={logPayment} disabled={!amount || !date}>Log Payment →</Btn>
      </Section>
    </div>
  )
}

function OverduePanel({ card, onUpdate, addToast }) {
  const [note, setNote] = useState('')
  const dpdDays = dpd(card)

  const initL1 = () => {
    const updated = {
      ...card,
      stage: 'rp_escalation_l1',
      daysInStage: 0,
      correspondence: [...card.correspondence, { from: 'System', message: `L1 Escalation initiated. Collections note: "${note}"`, time: new Date().toISOString().slice(0, 16).replace('T', ' ') + ' AST', autoRead: true }],
    }
    onUpdate(updated)
    addToast(`RP-${card.id.slice(3)} escalated to L1.`, 'success')
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 border" style={{ background: '#fafafa', borderColor: '#e5e5e5' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Days Past Due</span>
          <span className="text-[24px] font-black text-slate-800">{dpdDays}</span>
        </div>
        <div className="text-[11px] text-slate-500">Outstanding: <span className="font-semibold text-slate-800"><SARAmount amount={card.balanceDue} /></span></div>
      </div>

      <Section title="Collections Note">
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
          placeholder="Document contact attempts and buyer responses before escalating…"
          className="w-full px-3 py-2 rounded-xl border text-[12px] outline-none resize-none"
          style={{ borderColor: '#e5e5e5' }} />
        <div className="mt-3">
          <Btn onClick={initL1} disabled={!note.trim()}>Initiate L1 Escalation →</Btn>
        </div>
      </Section>
    </div>
  )
}

function EscalationL1Panel({ card, onUpdate, addToast }) {
  const [outcome, setOutcome] = useState('')
  const [callDate, setCallDate] = useState('')
  const [callNotes, setCallNotes] = useState('')
  const [showForm, setShowForm] = useState(false)

  const l1Entries = card.escalationLog.filter(e => e.level === 'L1')
  const assignedTo = card.assignedTo

  const addEntry = () => {
    if (!outcome || !callDate) return
    const entry = { level: 'L1', date: callDate, contactedBy: assignedTo, outcome, notes: callNotes }
    const updated = {
      ...card,
      escalationLog: [...card.escalationLog, entry],
      correspondence: [...card.correspondence, { from: 'System', message: `L1 call logged · ${outcomeLabel(outcome, 'L1')}`, time: `${callDate} · Manual entry`, autoRead: true }],
    }
    onUpdate(updated)
    addToast('Call entry added.', 'success')
    setOutcome(''); setCallDate(''); setCallNotes(''); setShowForm(false)
  }

  const escalateL2 = () => {
    const updated = {
      ...card,
      stage: 'rp_escalation_l2',
      daysInStage: 0,
      correspondence: [...card.correspondence, { from: 'System', message: 'Escalated to L2 — Legal team engagement.', time: new Date().toISOString().slice(0, 10) + ' · System', autoRead: true }],
    }
    onUpdate(updated)
    addToast(`${card.id} escalated to L2.`, 'success')
  }

  const resolveToActive = () => {
    const updated = {
      ...card,
      stage: 'rp_active',
      daysInStage: 0,
      correspondence: [...card.correspondence, { from: 'System', message: 'Resolved via L1. Account returned to Active.', time: new Date().toISOString().slice(0, 10) + ' · System', autoRead: true }],
    }
    onUpdate(updated)
    addToast(`${card.id} resolved — returned to Active.`, 'success')
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-3 border" style={{ background: '#fafafa', borderColor: '#e5e5e5' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#404040' }}>L1</span>
          <span className="text-[11px] text-slate-600">Collections escalation</span>
        </div>
        <div className="text-[11px] text-slate-500">DPD: <span className="font-semibold">{dpd(card)}</span> · Balance: <span className="font-semibold"><SARAmount amount={card.balanceDue} /></span></div>
      </div>

      <Section title={`Call Log (${l1Entries.length})`}>
        <div className="space-y-2 mb-3">
          {l1Entries.map((e, i) => (
            <div key={i} className="rounded-xl border p-3" style={{ background: '#fafafa', borderColor: '#f0f0f0' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-slate-700">{e.date}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: '#f0f0f0', color: '#525252' }}>{outcomeLabel(e.outcome, 'L1')}</span>
              </div>
              <div className="text-[10px] text-slate-500">{e.contactedBy}</div>
              {e.notes && <div className="text-[11px] text-slate-600 mt-1 leading-relaxed">{e.notes}</div>}
            </div>
          ))}
          {l1Entries.length === 0 && <div className="text-[11px] text-slate-400 py-2">No call entries yet.</div>}
        </div>

        {showForm ? (
          <div className="rounded-xl border p-3" style={{ borderColor: '#e5e5e5' }}>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <div className="text-[10px] text-slate-400 mb-1">Date</div>
                <input value={callDate} onChange={e => setCallDate(e.target.value)} type="date"
                  className="w-full px-2 py-1.5 rounded-lg border text-[11px] outline-none" style={{ borderColor: '#e5e5e5' }} />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 mb-1">Outcome</div>
                <select value={outcome} onChange={e => setOutcome(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border text-[11px] outline-none bg-white" style={{ borderColor: '#e5e5e5' }}>
                  <option value="">Select…</option>
                  {L1_OUTCOMES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <textarea value={callNotes} onChange={e => setCallNotes(e.target.value)} rows={2}
              placeholder="Call notes…"
              className="w-full px-2 py-1.5 rounded-lg border text-[11px] outline-none resize-none mb-2"
              style={{ borderColor: '#e5e5e5' }} />
            <div className="flex gap-2">
              <Btn onClick={addEntry} disabled={!outcome || !callDate}>Save Entry</Btn>
              <Btn onClick={() => setShowForm(false)} variant="ghost">Cancel</Btn>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowForm(true)}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1">
            + Add Call Entry
          </button>
        )}
      </Section>

      <div className="flex flex-col gap-2">
        <Btn onClick={escalateL2} disabled={l1Entries.length === 0}>Escalate to L2 — Legal →</Btn>
        <Btn onClick={resolveToActive} variant="ghost">Resolved — Return to Active</Btn>
      </div>
    </div>
  )
}

function EscalationL2Panel({ card, onUpdate, addToast }) {
  const [showL1, setShowL1] = useState(false)
  const [outcome, setOutcome] = useState('')
  const [callDate, setCallDate] = useState('')
  const [callNotes, setCallNotes] = useState('')
  const [showForm, setShowForm] = useState(false)

  const l1Entries = card.escalationLog.filter(e => e.level === 'L1')
  const l2Entries = card.escalationLog.filter(e => e.level === 'L2')
  const assignedTo = card.assignedTo

  const addEntry = () => {
    if (!outcome || !callDate) return
    const entry = { level: 'L2', date: callDate, contactedBy: assignedTo, outcome, notes: callNotes }
    const updated = {
      ...card,
      escalationLog: [...card.escalationLog, entry],
      correspondence: [...card.correspondence, { from: 'System', message: `L2 call logged · ${outcomeLabel(outcome, 'L2')}`, time: `${callDate} · Manual entry`, autoRead: true }],
    }
    onUpdate(updated)
    addToast('L2 call entry added.', 'success')
    setOutcome(''); setCallDate(''); setCallNotes(''); setShowForm(false)
  }

  const escalateL3 = () => {
    const updated = {
      ...card,
      stage: 'rp_escalation_l3',
      daysInStage: 0,
      correspondence: [...card.correspondence, { from: 'System', message: 'Escalated to L3 — Lawyer engagement.', time: new Date().toISOString().slice(0, 10) + ' · System', autoRead: true }],
    }
    onUpdate(updated)
    addToast(`${card.id} escalated to L3.`, 'success')
  }

  const resolveToActive = () => {
    const updated = {
      ...card,
      stage: 'rp_active',
      daysInStage: 0,
      correspondence: [...card.correspondence, { from: 'System', message: 'Resolved via L2. Account returned to Active.', time: new Date().toISOString().slice(0, 10) + ' · System', autoRead: true }],
    }
    onUpdate(updated)
    addToast(`${card.id} resolved — returned to Active.`, 'success')
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-3 border" style={{ background: '#fafafa', borderColor: '#e5e5e5' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#262626' }}>L2</span>
          <span className="text-[11px] text-slate-600">Legal escalation</span>
        </div>
        <div className="text-[11px] text-slate-500">Balance due: <span className="font-semibold"><SARAmount amount={card.balanceDue} /></span></div>
      </div>

      {l1Entries.length > 0 && (
        <div>
          <button onClick={() => setShowL1(v => !v)}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700 mb-2">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              style={{ transform: showL1 ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            L1 History ({l1Entries.length} entries)
          </button>
          {showL1 && (
            <div className="space-y-1.5 mb-3">
              {l1Entries.map((e, i) => (
                <div key={i} className="rounded-lg border px-3 py-2" style={{ background: '#fafafa', borderColor: '#f0f0f0' }}>
                  <div className="text-[10px] font-semibold text-slate-600">{e.date} · {e.contactedBy}</div>
                  <div className="text-[10px] text-slate-500">{outcomeLabel(e.outcome, 'L1')}</div>
                  {e.notes && <div className="text-[10px] text-slate-400 mt-0.5">{e.notes}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Section title={`Legal Call Log (${l2Entries.length})`}>
        <div className="space-y-2 mb-3">
          {l2Entries.map((e, i) => (
            <div key={i} className="rounded-xl border p-3" style={{ background: '#fafafa', borderColor: '#f0f0f0' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-slate-700">{e.date}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: '#f0f0f0', color: '#525252' }}>{outcomeLabel(e.outcome, 'L2')}</span>
              </div>
              <div className="text-[10px] text-slate-500">{e.contactedBy}</div>
              {e.notes && <div className="text-[11px] text-slate-600 mt-1 leading-relaxed">{e.notes}</div>}
            </div>
          ))}
          {l2Entries.length === 0 && <div className="text-[11px] text-slate-400 py-2">No L2 call entries yet.</div>}
        </div>

        {showForm ? (
          <div className="rounded-xl border p-3" style={{ borderColor: '#e5e5e5' }}>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <div className="text-[10px] text-slate-400 mb-1">Date</div>
                <input value={callDate} onChange={e => setCallDate(e.target.value)} type="date"
                  className="w-full px-2 py-1.5 rounded-lg border text-[11px] outline-none" style={{ borderColor: '#e5e5e5' }} />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 mb-1">Outcome</div>
                <select value={outcome} onChange={e => setOutcome(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border text-[11px] outline-none bg-white" style={{ borderColor: '#e5e5e5' }}>
                  <option value="">Select…</option>
                  {L2_OUTCOMES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <textarea value={callNotes} onChange={e => setCallNotes(e.target.value)} rows={2}
              placeholder="Legal call notes…"
              className="w-full px-2 py-1.5 rounded-lg border text-[11px] outline-none resize-none mb-2"
              style={{ borderColor: '#e5e5e5' }} />
            <div className="flex gap-2">
              <Btn onClick={addEntry} disabled={!outcome || !callDate}>Save Entry</Btn>
              <Btn onClick={() => setShowForm(false)} variant="ghost">Cancel</Btn>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowForm(true)}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1">
            + Add Call Entry
          </button>
        )}
      </Section>

      <div className="flex flex-col gap-2">
        <Btn onClick={escalateL3}>Escalate to L3 — Lawyer →</Btn>
        <Btn onClick={resolveToActive} variant="ghost">Resolved — Return to Active</Btn>
      </div>
    </div>
  )
}

function EscalationL3Panel({ card, onUpdate, addToast }) {
  const [showL1, setShowL1] = useState(false)
  const [showL2, setShowL2] = useState(false)
  const [pnServed, setPnServed] = useState(false)
  const [courtFiled, setCourtFiled] = useState(false)
  const [writeOffReason, setWriteOffReason] = useState('')
  const [showWriteOff, setShowWriteOff] = useState(false)

  const l1Entries = card.escalationLog.filter(e => e.level === 'L1')
  const l2Entries = card.escalationLog.filter(e => e.level === 'L2')
  const canClose = pnServed && courtFiled

  const close = (type) => {
    if (type === 'written_off' && !writeOffReason.trim()) return
    const updated = {
      ...card,
      stage: 'rp_closed',
      daysInStage: 0,
      closedBy: card.assignedTo,
      closedAt: new Date().toISOString().slice(0, 10),
      closureType: type,
      correspondence: [...card.correspondence, {
        from: 'System',
        message: `Account closed — ${type === 'resolved' ? 'Resolved' : 'Written Off'}. ${type === 'written_off' ? `Reason: ${writeOffReason}` : ''}`,
        time: new Date().toISOString().slice(0, 10) + ' · System',
        autoRead: true,
      }],
    }
    onUpdate(updated)
    addToast(`${card.id} closed — ${type === 'resolved' ? 'Resolved' : 'Written Off'}.`, 'success')
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-3 border" style={{ background: '#fafafa', borderColor: '#e5e5e5' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#171717' }}>L3</span>
          <span className="text-[11px] text-slate-600">Lawyer engagement</span>
        </div>
        <div className="text-[11px] text-slate-500">Balance due: <span className="font-semibold"><SARAmount amount={card.balanceDue} /></span></div>
      </div>

      {l1Entries.length > 0 && (
        <div>
          <button onClick={() => setShowL1(v => !v)}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700 mb-2">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              style={{ transform: showL1 ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            L1 History ({l1Entries.length} entries)
          </button>
          {showL1 && (
            <div className="space-y-1.5 mb-2">
              {l1Entries.map((e, i) => (
                <div key={i} className="rounded-lg border px-3 py-2" style={{ background: '#fafafa', borderColor: '#f0f0f0' }}>
                  <div className="text-[10px] font-semibold text-slate-600">{e.date} · {e.contactedBy}</div>
                  <div className="text-[10px] text-slate-500">{outcomeLabel(e.outcome, 'L1')}</div>
                  {e.notes && <div className="text-[10px] text-slate-400 mt-0.5">{e.notes}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {l2Entries.length > 0 && (
        <div>
          <button onClick={() => setShowL2(v => !v)}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700 mb-2">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              style={{ transform: showL2 ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            L2 History ({l2Entries.length} entries)
          </button>
          {showL2 && (
            <div className="space-y-1.5 mb-2">
              {l2Entries.map((e, i) => (
                <div key={i} className="rounded-lg border px-3 py-2" style={{ background: '#fafafa', borderColor: '#f0f0f0' }}>
                  <div className="text-[10px] font-semibold text-slate-600">{e.date} · {e.contactedBy}</div>
                  <div className="text-[10px] text-slate-500">{outcomeLabel(e.outcome, 'L2')}</div>
                  {e.notes && <div className="text-[10px] text-slate-400 mt-0.5">{e.notes}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Section title="Promissory Note">
        <div className="rounded-xl border p-3" style={{ background: '#fafafa', borderColor: '#f0f0f0' }}>
          <div className="text-[11px] text-slate-500 leading-relaxed">
            Promissory note on file for <span className="font-semibold text-slate-700">{card.buyer}</span>.
            Amount: <span className="font-semibold text-slate-700"><SARAmount amount={card.totalOutstanding} /></span>.
            Document is under legal enforcement by assigned lawyer.
          </div>
        </div>
      </Section>

      <Section title="Execution Checklist">
        <div className="space-y-2">
          {[
            { id: 'pn', label: 'Promissory note served to buyer', state: pnServed, set: setPnServed },
            { id: 'court', label: 'Court filing initiated', state: courtFiled, set: setCourtFiled },
          ].map(item => (
            <label key={item.id} className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => item.set(v => !v)}
                className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                style={{ borderColor: item.state ? '#262626' : '#d4d4d4', background: item.state ? '#262626' : 'white' }}>
                {item.state && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <span className="text-[12px] text-slate-700">{item.label}</span>
            </label>
          ))}
        </div>
      </Section>

      <div className="flex flex-col gap-2">
        <Btn onClick={() => close('resolved')} disabled={!canClose}>Close — Resolved ✓</Btn>
        {showWriteOff ? (
          <div className="space-y-2">
            <textarea value={writeOffReason} onChange={e => setWriteOffReason(e.target.value)} rows={2}
              placeholder="Reason for write-off…"
              className="w-full px-3 py-2 rounded-xl border text-[12px] outline-none resize-none"
              style={{ borderColor: '#e5e5e5' }} />
            <div className="flex gap-2">
              <Btn onClick={() => close('written_off')} disabled={!canClose || !writeOffReason.trim()} variant="danger">Confirm Write-Off</Btn>
              <Btn onClick={() => setShowWriteOff(false)} variant="ghost">Cancel</Btn>
            </div>
          </div>
        ) : (
          <Btn onClick={() => setShowWriteOff(true)} disabled={!canClose} variant="danger">Close — Written Off</Btn>
        )}
        {!canClose && <div className="text-[10px] text-slate-400">Complete the execution checklist to close this account.</div>}
      </div>
    </div>
  )
}

function ClosedPanel({ card }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 border" style={{ background: '#fafafa', borderColor: '#e5e5e5' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-bold px-3 py-1 rounded-full text-white"
            style={{ background: card.closureType === 'resolved' ? '#262626' : '#525252' }}>
            {card.closureType === 'resolved' ? 'Resolved' : 'Written Off'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div>
            <div className="text-slate-400 mb-0.5">Closed by</div>
            <div className="font-semibold text-slate-700">{card.closedBy}</div>
          </div>
          <div>
            <div className="text-slate-400 mb-0.5">Closed at</div>
            <div className="font-semibold text-slate-700">{card.closedAt}</div>
          </div>
          <div>
            <div className="text-slate-400 mb-0.5">Total amount</div>
            <div className="font-semibold text-slate-700"><SARAmount amount={card.totalAmount} /></div>
          </div>
          <div>
            <div className="text-slate-400 mb-0.5">Repaid</div>
            <div className="font-semibold text-slate-700"><SARAmount amount={card.repaidAmount} /></div>
          </div>
          <div>
            <div className="text-slate-400 mb-0.5">Outstanding</div>
            <div className="font-semibold" style={{ color: card.totalOutstanding > 0 ? '#525252' : '#262626' }}><SARAmount amount={card.totalOutstanding} /></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StageActions({ card, adminRole, onUpdate, addToast }) {
  const myStages = ROLE_STAGE_MAP[adminRole]
  const canAct = !myStages || myStages.includes(card.stage)

  if (!canAct) return (
    <div className="rounded-xl p-3 border border-black/5 bg-slate-50 text-[11px] text-slate-400 text-center">
      This stage is managed by another team.
    </div>
  )

  if (card.stage === 'rp_active')        return <ActivePanel card={card} onUpdate={onUpdate} addToast={addToast} />
  if (card.stage === 'rp_overdue')       return <OverduePanel card={card} onUpdate={onUpdate} addToast={addToast} />
  if (card.stage === 'rp_escalation_l1') return <EscalationL1Panel card={card} onUpdate={onUpdate} addToast={addToast} />
  if (card.stage === 'rp_escalation_l2') return <EscalationL2Panel card={card} onUpdate={onUpdate} addToast={addToast} />
  if (card.stage === 'rp_escalation_l3') return <EscalationL3Panel card={card} onUpdate={onUpdate} addToast={addToast} />
  if (card.stage === 'rp_closed')        return <ClosedPanel card={card} />
  return null
}

// ── Chatter Panel ─────────────────────────────────────────────────────────────

function ChatterPanel({ card, onUpdate, addToast }) {
  const [compose, setCompose] = useState('')
  const [mode, setMode] = useState('message')
  const timeline = buildTimeline(card)

  const send = () => {
    if (!compose.trim()) return
    const entry = { from: 'You', message: compose.trim(), time: new Date().toISOString().slice(0, 16).replace('T', ' ') + ' AST', autoRead: true }
    const updated = { ...card, correspondence: [...card.correspondence, entry] }
    onUpdate(updated)
    setCompose('')
    addToast('Message sent.', 'success')
  }

  function groupByDay(entries) {
    const today     = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const map = {}, order = []
    entries.forEach(e => {
      const key = (e.date || '').slice(0, 10)
      if (!map[key]) { map[key] = []; order.push(key) }
      map[key].push(e)
    })
    return order.map(key => {
      const d = new Date(key + 'T12:00:00')
      const label = key === today ? 'Today'
        : key === yesterday ? 'Yesterday'
        : `${d.getDate()} ${d.toLocaleString('en', { month: 'short' })}`
      return { key, label, entries: map[key] }
    })
  }

  function typeIcon(type, isLast = false) {
    const ring = isLast ? { outline: '2px solid var(--color-primary)', outlineOffset: '2px' } : {}
    if (type === 'payment')   return <div className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: '#525252', ...ring }}>₊</div>
    if (type === 'escalation') return <div className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2" style={{ borderColor: '#404040', background: 'white', ...ring }}><span className="text-[8px] font-black" style={{ color: '#404040' }}>!</span></div>
    if (type === 'system')    return <div className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: '#f0f0f0', ...ring }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
    if (type === 'message')   return <div className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: '#e5e5e5', ...ring }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div>
    return <div className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: '#f5f5f5', ...ring }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg></div>
  }

  return (
    <div className="flex flex-col h-full" style={{ width: 360, borderLeft: '1px solid rgba(0,0,0,0.05)' }}>
      <div className="px-4 py-3 border-b border-black/5 shrink-0">
        <div className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Activity</div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {(() => {
          const groups = groupByDay(timeline)
          const lastGi = groups.length - 1
          return (
            <div className="relative">
              <div className="absolute top-3 bottom-3 w-px bg-slate-100" style={{ left: '11px' }} />
              {groups.map((group, gi) => (
                <div key={group.key}>
                  <div className="relative z-10 flex items-center gap-2 mb-2.5 mt-1 pl-7" style={{ background: 'white' }}>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{group.label}</span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>
                  <div className="space-y-3 mb-2">
                    {group.entries.map((entry, ei) => {
                      const isLast = gi === lastGi && ei === group.entries.length - 1
                      return (
                        <div key={entry.id} className="flex gap-2.5">
                          {typeIcon(entry.type, isLast)}
                          <div className="flex-1 min-w-0">
                            {entry.from && <div className="text-[10px] font-semibold text-slate-600 mb-0.5">{entry.from}</div>}
                            <div className="text-[11px] text-slate-700 leading-relaxed">{entry.text}</div>
                            {entry.notes && <div className="text-[10px] text-slate-400 mt-0.5 italic">{entry.notes}</div>}
                            {entry.ref && <div className="text-[9px] font-mono text-slate-400 mt-0.5">{entry.ref}</div>}
                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                              {entry.date}
                              {isLast && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#ede9ff', color: 'var(--color-primary)' }}>Latest</span>}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )
        })()}
      </div>

      <div className="px-4 py-3 border-t border-black/5 shrink-0">
        <div className="flex gap-1 mb-2">
          {['message', 'note'].map(m => (
            <button key={m} onClick={() => setMode(m)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
              style={{ background: mode === m ? '#262626' : 'transparent', color: mode === m ? 'white' : '#a3a3a3' }}>
              {m === 'message' ? 'Send Message' : 'Log Note'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <textarea value={compose} onChange={e => setCompose(e.target.value)} rows={2}
            placeholder={mode === 'message' ? 'Send a message to buyer…' : 'Log an internal note…'}
            className="flex-1 px-3 py-2 rounded-xl border text-[11px] outline-none resize-none"
            style={{ borderColor: '#e5e5e5' }} />
          <button onClick={send}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white self-end shrink-0"
            style={{ background: compose.trim() ? 'var(--color-primary)' : '#d4d4d4' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Detail View ───────────────────────────────────────────────────────────────

function DetailView({ card, adminRole, onBack, onUpdate, cards, addToast }) {
  const idx = cards.findIndex(c => c.id === card.id)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 px-6 py-3 border-b border-black/5 flex items-center gap-3">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <div className="w-px h-4 bg-slate-200" />
        <span className="text-[13px] font-bold text-slate-800">{card.id}</span>
        <span className="text-[12px] text-slate-400">{card.buyer}</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
            style={{ background: '#f0f0f0', color: '#525252' }}>
            {STAGE_LABELS[card.stage]}
          </span>
          {card.assignedTo && (
            <span className="text-[11px] text-slate-400">{card.assignedTo}</span>
          )}
        </div>
      </div>

      {/* Stage bar */}
      <div className="shrink-0 px-6 py-3 border-b border-black/5 overflow-x-auto">
        <StageBar currentStage={card.stage} />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left scrollable form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Yumnai suggestion */}
          {card.yumnaiSuggestion?.message && (
            <div className="rounded-xl border px-4 py-3 flex gap-3" style={{ background: '#fafafa', borderColor: '#e5e5e5' }}>
              <span className="text-[14px] shrink-0">✦</span>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Yumnai</div>
                <p className="text-[12px] text-slate-600 leading-relaxed">{card.yumnaiSuggestion.message}</p>
              </div>
            </div>
          )}

          {/* Stage actions */}
          <Section title="Stage Actions">
            <StageActions card={card} adminRole={adminRole} onUpdate={onUpdate} addToast={addToast} />
          </Section>

          {/* Credit facility summary */}
          <Section title="Credit Facility">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Buyer">
                <div className="text-[13px] font-semibold text-slate-800">{card.buyer}</div>
              </Field>
              <Field label="Merchant">
                <div className="text-[13px] font-semibold text-slate-800">{card.merchant}</div>
              </Field>
              <Field label="Disbursement Date">
                <div className="text-[12px] text-slate-700">{card.disbursementDate}</div>
              </Field>
              <Field label="Fee Model">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#f0f0f0', color: '#525252' }}>{feeModelLabel(card.feeModel)}</span>
              </Field>
              <Field label="Credit Limit">
                <div className="text-[13px] font-semibold text-slate-800"><SARAmount amount={card.totalCreditLimit} /></div>
              </Field>
              <Field label="Available Credit">
                <div className="text-[13px] font-semibold text-slate-800"><SARAmount amount={card.availableCredit} /></div>
              </Field>
              <Field label="Total Amount">
                <div className="text-[13px] font-semibold text-slate-800"><SARAmount amount={card.totalAmount} /></div>
              </Field>
              <Field label="Repaid">
                <div className="text-[13px] font-semibold text-slate-800"><SARAmount amount={card.repaidAmount} /></div>
              </Field>
              <Field label="Outstanding">
                <div className="text-[13px] font-bold" style={{ color: card.totalOutstanding > 0 ? '#262626' : '#a3a3a3' }}><SARAmount amount={card.totalOutstanding} /></div>
              </Field>
              <Field label="Balance Due">
                <div className="text-[13px] font-bold" style={{ color: card.balanceDue > 0 ? '#404040' : '#a3a3a3' }}><SARAmount amount={card.balanceDue} /></div>
              </Field>
            </div>
          </Section>

          {/* Fee breakdown */}
          <Section title="Fee Breakdown">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Buyer Fees">
                <div className="text-[12px] font-semibold text-slate-700"><SARAmount amount={card.buyerFees} /></div>
              </Field>
              <Field label="Merchant Fees">
                <div className="text-[12px] font-semibold text-slate-700"><SARAmount amount={card.merchantFees} /></div>
              </Field>
              <Field label="Yumna Income">
                <div className="text-[12px] font-semibold text-slate-700"><SARAmount amount={card.yumnaIncome} /></div>
              </Field>
            </div>
          </Section>

          {/* Installment table */}
          <Section title="Instalment Schedule">
            <InstallmentTable schedule={card.installmentSchedule} />
          </Section>
        </div>

        {/* Right chatter */}
        <ChatterPanel card={card} onUpdate={onUpdate} addToast={addToast} />
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function RepaymentsPipeline({ onBreadcrumb }) {
  const { state, addToast } = useApp()
  const adminRole = state.currentUser?.adminRole || 'super'

  const [cards, setCards] = useState(REPAYMENTS_CARDS)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('kanban')

  useEffect(() => {
    onBreadcrumb?.(selected ? { label: selected.buyer, id: selected.id, onHome: () => setSelected(null) } : null)
    return () => onBreadcrumb?.(null)
  }, [selected])

  const updateCard = (updated) => {
    setCards(prev => prev.map(c => c.id === updated.id ? updated : c))
    if (selected?.id === updated.id) setSelected(updated)
  }

  const toast = (msg, type) => {
    if (addToast) addToast(msg, type)
  }

  if (selected) {
    return (
      <div className="h-full overflow-hidden">
        <DetailView
          card={selected}
          adminRole={adminRole}
          onBack={() => setSelected(null)}
          onUpdate={updateCard}
          cards={cards}
          addToast={toast}
        />
      </div>
    )
  }

  const viewProps = { cards, adminRole, onSelect: setSelected, search, setSearch, viewMode, setViewMode }

  return (
    <div className="h-full overflow-hidden">
      {viewMode === 'kanban'
        ? <BoardView {...viewProps} />
        : <ListView {...viewProps} />
      }
    </div>
  )
}
