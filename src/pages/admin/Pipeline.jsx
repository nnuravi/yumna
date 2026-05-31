import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { PIPELINE_STAGES, PIPELINE_CARDS, USERS, formatSAR } from '../../data/mockData'

const ROLE_STAGE_MAP = {
  verifier:    ['submitted', 'kyc'],
  credit:      ['credit_score'],
  risk:        ['risk'],
  legal:       ['legal'],
  account_mgr: ['approved', 'disbursed'],
  collections: ['repayment', 'overdue'],
  super:       null,
}

function riskColor(score) {
  if (score === null) return { bg: '#f1f5f9', text: '#94a3b8' }
  if (score < 30) return { bg: '#ecfdf5', text: '#059669' }
  if (score < 60) return { bg: '#fffbeb', text: '#d97706' }
  return { bg: '#fef2f2', text: '#e5484d' }
}

function statusColor(status) {
  if (status === 'verified') return { color: '#10b981', bg: '#f0fdf4' }
  if (status === 'missing')  return { color: '#e5484d', bg: '#fef2f2' }
  return { color: '#f59e0b', bg: '#fffbeb' }
}

function buildTimeline(card) {
  const stageLabel = PIPELINE_STAGES.find(s => s.id === card.stage)?.label || card.stage
  const dayNum = Math.max(10, 30 - card.daysInStage)
  const dayStr = String(dayNum).padStart(2, '0')

  const entries = [
    { id: 'h1', type: 'history', icon: '📋', text: `Finance request submitted — ${card.seller} → ${card.buyer}`, date: '2026-05-28 08:00' },
    { id: 'h2', type: 'history', icon: '🤖', text: 'Automated intake check complete. CR and submission validated.', date: '2026-05-28 08:02' },
    { id: 'h3', type: 'history', icon: '👤', text: `Assigned to ${card.assignedTo}`, date: '2026-05-28 08:05' },
    { id: 'h4', type: 'history', icon: '📄', text: `Moved to ${stageLabel}`, date: `2026-05-${dayStr} 09:00` },
    ...card.correspondence.map((msg, i) => ({
      id: `c${i}`,
      type: 'correspondence',
      from: msg.from,
      message: msg.message,
      autoRead: msg.autoRead,
      date: msg.time,
    })),
  ]

  if (card.stage === 'repayment') {
    const perInstalment = Math.round(card.amount / 5)
    entries.push({ id: 'pay1', type: 'payment', amount: perInstalment, instalment: 1, date: '2026-05-15 10:22' })
  }
  if (card.stage === 'overdue') {
    const perInstalment = Math.round(card.amount / 4)
    entries.push(
      { id: 'pay1', type: 'payment', amount: perInstalment, instalment: 1, date: '2026-04-25 09:15' },
      { id: 'pay2', type: 'payment', amount: perInstalment, instalment: 2, date: '2026-05-02 11:30' },
    )
  }

  return entries
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function Section({ title, children, badge, badgeColor }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{title}</span>
        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: badgeColor }}>{badge}</span>
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

// ── Lane AI Action Popover ────────────────────────────────────────────────────

function LaneActions({ stage, onClose }) {
  const [applied, setApplied] = useState(null)
  const actions = [
    { id: 'chase',  label: 'Auto-chase missing documents',  desc: `Yumi will message all buyers in ${stage.label} with incomplete documents.` },
    { id: 'flag',   label: 'Flag stale cards (>3 days)',    desc: 'Yumi will mark cards sitting here longer than 3 days as overdue for review.' },
    { id: 'assign', label: 'Auto-assign unassigned cards',  desc: 'Yumi will distribute unassigned cards to available team members based on capacity.' },
  ]
  return (
    <div className="absolute top-10 left-0 z-30 w-72 bg-white rounded-2xl border border-black/5 shadow-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[13px]">✦</span>
        <span className="text-[12px] font-bold text-slate-800">Yumi · Lane Actions</span>
        <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-600">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div className="space-y-2">
        {actions.map(a => (
          <button key={a.id} onClick={() => setApplied(a.id)}
            className="w-full text-start p-3 rounded-xl border transition-colors"
            style={{
              borderColor: applied === a.id ? '#8f85ff' : '#f1f5f9',
              background: applied === a.id ? 'rgba(143,133,255,0.06)' : 'transparent',
            }}>
            <div className="text-[12px] font-semibold text-slate-800 mb-0.5">{a.label}</div>
            <div className="text-[11px] text-slate-400 leading-snug">{a.desc}</div>
            {applied === a.id && <div className="mt-2 text-[11px] font-semibold text-indigo-600">✓ Yumi is on it</div>}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Chatter Panel ─────────────────────────────────────────────────────────────

function ChatterPanel({ timeline, chatterMode, setChatterMode, draftText, setDraftText, onSend }) {
  return (
    <div className="flex flex-col border-l border-slate-100 bg-white shrink-0" style={{ width: 360 }}>
      {/* Action buttons */}
      <div className="px-4 py-3 border-b border-slate-100 flex gap-2 shrink-0">
        {[
          { id: 'message', label: 'Send message' },
          { id: 'note',    label: 'Log note' },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setChatterMode(m => m === id ? null : id)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all"
            style={{
              background: chatterMode === id ? (id === 'note' ? '#fffbeb' : 'rgba(143,133,255,0.08)') : 'white',
              borderColor: chatterMode === id ? (id === 'note' ? '#fcd34d' : 'rgba(143,133,255,0.4)') : '#e2e8f0',
              color: chatterMode === id ? (id === 'note' ? '#92400e' : 'var(--color-primary)') : '#64748b',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Composer */}
      {chatterMode && (
        <div className="px-4 py-3 border-b border-slate-100 shrink-0"
          style={{ background: chatterMode === 'note' ? '#fffdf0' : 'white' }}>
          <textarea
            value={draftText}
            onChange={e => setDraftText(e.target.value)}
            rows={4}
            autoFocus
            placeholder={chatterMode === 'note' ? 'Add an internal note…' : 'Write a message…'}
            className="w-full px-3 py-2.5 rounded-xl border text-[12px] outline-none resize-none leading-relaxed"
            style={{ borderColor: chatterMode === 'note' ? '#fcd34d' : 'rgba(143,133,255,0.3)', fontFamily: 'inherit' }}
          />
          <div className="flex gap-2 mt-2">
            <button onClick={onSend}
              className="px-4 py-1.5 rounded-lg text-white font-semibold text-[12px]"
              style={{ background: chatterMode === 'note' ? '#f59e0b' : 'var(--color-primary)' }}>
              {chatterMode === 'note' ? 'Add note' : 'Send'}
            </button>
            <button onClick={() => { setChatterMode(null); setDraftText('') }}
              className="px-4 py-1.5 rounded-lg font-semibold text-[12px] border border-slate-200 text-slate-500">
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {timeline.length === 0 && (
          <div className="text-center text-[13px] text-slate-400 py-8">No activity yet.</div>
        )}
        {timeline.map((entry, i) => {
          if (entry.type === 'history') return (
            <div key={entry.id || i} className="flex gap-3">
              <div className="w-7 h-7 rounded-full border-2 border-slate-100 bg-white flex items-center justify-center text-[12px] shrink-0 mt-0.5">
                {entry.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-slate-700 leading-snug">{entry.text}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{entry.date}</p>
              </div>
            </div>
          )
          if (entry.type === 'payment') return (
            <div key={entry.id || i} className="flex gap-3">
              <div className="w-7 h-7 rounded-full border-2 border-emerald-100 bg-emerald-50 flex items-center justify-center text-[12px] shrink-0 mt-0.5">
                💰
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12px] font-semibold text-emerald-700">Payment received</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 font-semibold tabular-nums">
                    {formatSAR(entry.amount)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Instalment {entry.instalment} · {entry.date}</p>
              </div>
            </div>
          )
          if (entry.type === 'note') return (
            <div key={entry.id || i} className="rounded-xl border border-amber-100 p-3" style={{ background: '#fffdf0' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-semibold text-amber-700">{entry.from}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 font-medium">Note</span>
                <span className="ml-auto text-[10px] text-slate-400">{entry.date}</span>
              </div>
              <p className="text-[12px] text-slate-600 leading-relaxed">{entry.message}</p>
            </div>
          )
          return (
            <div key={entry.id || i} className="rounded-xl border p-3"
              style={{
                borderColor: entry.autoRead ? 'rgba(143,133,255,0.2)' : '#f1f5f9',
                background: entry.autoRead ? 'rgba(143,133,255,0.04)' : '#fafafa',
              }}>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[12px] font-semibold text-slate-700">{entry.from}</span>
                {entry.autoRead && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: 'rgba(143,133,255,0.1)', color: 'var(--color-primary)' }}>
                    🤖 Yumi
                  </span>
                )}
                <span className="ml-auto text-[10px] text-slate-400 shrink-0">{entry.date}</span>
              </div>
              <p className="text-[12px] text-slate-600 leading-relaxed">{entry.message}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Card Detail Page ──────────────────────────────────────────────────────────

function CardDetailPage({ card, currentIdx, totalCards, onClose, onPrev, onNext, onNavigate, onCardUpdate }) {
  const [mdrPayer, setMdrPayer] = useState('split_50_50')
  const [emiFreq, setEmiFreq] = useState(card.emiFrequency || 'bimonthly')
  const [invoiceGenerated, setInvoiceGenerated] = useState(false)
  const [sent, setSent] = useState(false)
  const [chatterMode, setChatterMode] = useState(null)
  const [draftText, setDraftText] = useState('')
  const [timeline, setTimeline] = useState(() => buildTimeline(card))

  const { state: appState } = useApp()
  const currentUser = appState.currentUser

  const [cardStage,       setCardStage]       = useState(card.stage)
  const [showStageMenu,   setShowStageMenu]   = useState(false)
  const [showAssignPanel, setShowAssignPanel] = useState(false)
  const [assignTarget,    setAssignTarget]    = useState(null)
  const [assignNote,      setAssignNote]      = useState('')
  const [assignedTo,      setAssignedTo]      = useState(card.assignedTo)

  const stageInfo = PIPELINE_STAGES.find(s => s.id === cardStage)

  const EMI_FREQS       = { weekly: 7, bimonthly: 15, monthly: 30 }
  const EMI_FREQ_LABELS = { weekly: 'Weekly (7d)', bimonthly: 'Bi-Monthly (15d)', monthly: 'Monthly (30d)' }

  const mdrFee              = card.amount * (card.mdrRate / 100)
  const buyerFee            = mdrPayer === 'buyer_full' ? mdrFee : mdrPayer === 'split_50_50' ? mdrFee / 2 : 0
  const merchantMDR         = mdrPayer === 'merchant_full' ? mdrFee : mdrPayer === 'split_50_50' ? mdrFee / 2 : 0
  const totalBuyerRepayment = card.amount + buyerFee
  const merchantDisbursement = card.amount - merchantMDR
  const emiDays             = EMI_FREQS[emiFreq]
  const instalmentCount     = Math.ceil(card.tenure / emiDays)
  const perEMI              = totalBuyerRepayment / instalmentCount

  const missingDocs      = card.documents.filter(d => d.status === 'missing').length
  const paidInstalments  = card.stage === 'overdue' ? 2 : card.stage === 'repayment' ? 1 : 0
  const overdueInstalments = card.stage === 'overdue' ? 1 : 0

  const missingDocNames = card.documents.filter(d => d.status === 'missing').map(d => d.name)
  const pendingDocCount = card.documents.filter(d => d.status === 'pending').length
  const unreadMsgCount  = card.correspondence.filter(c => !c.autoRead).length
  const adminUsers      = Object.values(USERS).filter(u => u.role === 'admin')

  const yumiItems = [
    ...missingDocNames.length ? [{ icon: '📄', text: `${missingDocNames.length} missing doc${missingDocNames.length > 1 ? 's' : ''}: ${missingDocNames.join(', ')}`, urgency: 'red' }] : [],
    ...pendingDocCount        ? [{ icon: '⏳', text: `${pendingDocCount} document${pendingDocCount > 1 ? 's' : ''} pending verification`, urgency: 'amber' }] : [],
    ...card.daysInStage > 5   ? [{ icon: '🕐', text: `Stale — ${card.daysInStage} days in current stage (threshold: 5d)`, urgency: 'amber' }] : [],
    ...(card.riskScore !== null && card.riskScore > 60) ? [{ icon: '⚠️', text: `High risk score: ${card.riskScore} — manual review recommended`, urgency: 'red' }] : [],
    ...unreadMsgCount         ? [{ icon: '💬', text: `${unreadMsgCount} unread message${unreadMsgCount > 1 ? 's' : ''} in correspondence`, urgency: 'amber' }] : [],
  ]

  const ACTION_LABELS = {
    request_document: 'Request missing documents from buyer',
    escalate:         'Escalate to formal notice',
    suggest_template: 'Apply legal framework template',
    generate_invoice: 'Generate and share invoice',
    monitor:          'Monitor repayment schedule',
    score:            'Initiate credit scoring sequence',
  }

  const openComposerWithDraft = () => {
    setDraftText(card.yumiSuggestion.draftText)
    setChatterMode('message')
  }

  const handleChatterSend = () => {
    const text = draftText.trim() || (chatterMode === 'note' ? '(empty note)' : '')
    if (!text) return
    const newEntry = {
      id: `msg-${Date.now()}`,
      type: chatterMode === 'note' ? 'note' : 'correspondence',
      from: 'You',
      message: text,
      autoRead: false,
      date: 'Just now',
    }
    const yumiFollowUp = chatterMode === 'message' &&
      (card.yumiSuggestion.action === 'request_document' || card.yumiSuggestion.action === 'escalate')
      ? [{
          id: `yumi-${Date.now()}`,
          type: 'correspondence',
          from: 'Yumi AI',
          message: 'Message sent. I will monitor the reply and auto-attach any documents received from the client.',
          autoRead: true,
          date: 'Just now',
        }]
      : []
    setTimeline(prev => [...prev, newEntry, ...yumiFollowUp])
    if (yumiFollowUp.length > 0) setSent(true)
    setDraftText('')
    setChatterMode(null)
  }

  const canApprove = ['legal', 'approved'].includes(cardStage) &&
    ['super', 'legal', 'account_mgr'].includes(currentUser?.adminRole)

  const handleMoveStage = (newStageId) => {
    const label = PIPELINE_STAGES.find(s => s.id === newStageId)?.label || newStageId
    setCardStage(newStageId)
    setShowStageMenu(false)
    setTimeline(prev => [...prev, {
      id: `hist-${Date.now()}`, type: 'history', icon: '📋',
      text: `Stage moved to ${label} by ${currentUser?.name || 'You'}`,
      date: new Date().toLocaleString('en-SA', { dateStyle: 'short', timeStyle: 'short' }),
    }])
    onCardUpdate?.({ ...card, stage: newStageId, assignedTo })
  }

  const handleApprove = () => {
    const nextStage = cardStage === 'legal' ? 'approved' : 'disbursed'
    const label = cardStage === 'legal' ? 'APPROVED' : 'DISBURSED'
    setCardStage(nextStage)
    setShowStageMenu(false)
    setTimeline(prev => [...prev, {
      id: `approval-${Date.now()}`, type: 'history', icon: '✅',
      text: `Finance request ${label} by ${currentUser?.name || 'You'}`,
      date: new Date().toLocaleString('en-SA', { dateStyle: 'short', timeStyle: 'short' }),
    }])
    onCardUpdate?.({ ...card, stage: nextStage, assignedTo })
  }

  const handleAssignConfirm = () => {
    if (!assignTarget) return
    const targetUser = USERS[assignTarget]
    const note = assignNote.trim() || `Reassigned to ${targetUser.name}.`
    setAssignedTo(targetUser.name)
    setTimeline(prev => [...prev, {
      id: `assign-${Date.now()}`, type: 'note', from: currentUser?.name || 'Admin',
      message: `Reassigned to ${targetUser.name}. Note: ${note}`,
      autoRead: false,
      date: new Date().toLocaleString('en-SA', { dateStyle: 'short', timeStyle: 'short' }),
    }])
    setShowAssignPanel(false)
    setAssignTarget(null)
    setAssignNote('')
    onCardUpdate?.({ ...card, stage: cardStage, assignedTo: targetUser.name })
  }

  const handleYumiAction = () => {
    const text = card.yumiSuggestion.draftText
    if (!text) return
    setTimeline(prev => [...prev,
      { id: `msg-${Date.now()}`, type: 'correspondence', from: 'You', message: text, autoRead: false, date: 'Just now' },
      { id: `yumi-${Date.now()}`, type: 'correspondence', from: 'Yumi AI', message: 'Message sent. I will monitor the reply and auto-attach any documents received from the client.', autoRead: true, date: 'Just now' },
    ])
    setSent(true)
  }

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">

      {/* ── Top action bar ── */}
      <div className="px-5 py-3 border-b border-slate-100 bg-white flex items-center gap-3 shrink-0 flex-wrap">
        {/* Breadcrumb */}
        <button onClick={onClose}
          className="flex items-center gap-1.5 text-[13px] font-semibold"
          style={{ color: 'var(--color-primary)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Pipeline
        </button>
        <span className="text-slate-300">/</span>
        <span className="font-semibold text-slate-800 text-[13px]">{card.id}</span>
        {stageInfo && (
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
            style={{ background: stageInfo.color + '22', color: stageInfo.color }}>
            {stageInfo.label}
          </span>
        )}

        {/* Smart profile buttons */}
        <div className="flex gap-2 ml-2">
          <button onClick={() => onNavigate('sellers')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[12px] font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-100 transition-colors">
            🏪 {card.seller}
          </button>
          <button onClick={() => onNavigate('buyers')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[12px] font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-100 transition-colors">
            👤 {card.buyer}
          </button>
        </div>

        <div className="flex-1" />

        {/* Card counter + prev/next */}
        <span className="text-[12px] text-slate-400 tabular-nums">{currentIdx + 1} / {totalCards}</span>
        <div className="flex gap-1">
          <button onClick={onPrev} disabled={currentIdx === 0}
            className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </button>
          <button onClick={onNext} disabled={currentIdx === totalCards - 1}
            className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Body: form + chatter ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT — scrollable form */}
        <div className="flex-1 overflow-y-auto" style={{ background: '#f8fafc', position: 'relative' }}>
          <style>{`@keyframes yumi-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }`}</style>
          <div className="max-w-2xl mx-auto p-6 space-y-6">

            {/* YUMI BRIEFING */}
            <div style={{
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(139,92,246,0.07) 0%, rgba(59,130,246,0.05) 100%)',
              border: '1.5px solid rgba(139,92,246,0.22)',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '10px 16px',
                background: 'linear-gradient(90deg, rgba(139,92,246,0.11) 0%, rgba(59,130,246,0.07) 100%)',
                borderBottom: '1px solid rgba(139,92,246,0.14)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 12, color: '#7c3aed' }}>✦</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#6d28d9', letterSpacing: '0.02em' }}>Yumi Briefing</span>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', display: 'inline-block',
                  background: yumiItems.some(i => i.urgency === 'red') ? '#e5484d' : '#f59e0b',
                  animation: 'yumi-pulse 2s infinite',
                  boxShadow: yumiItems.some(i => i.urgency === 'red') ? '0 0 0 3px rgba(229,72,77,0.18)' : '0 0 0 3px rgba(245,158,11,0.18)',
                }} />
                <span style={{ marginLeft: 'auto', fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>
                  {yumiItems.length} item{yumiItems.length !== 1 ? 's' : ''} need attention
                </span>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {yumiItems.length === 0 && (
                  <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>No action items — this ticket looks healthy.</div>
                )}
                {yumiItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 13, marginTop: 1, flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.5, flex: 1 }}>{item.text}</span>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                      background: item.urgency === 'red' ? '#e5484d' : '#f59e0b',
                    }} />
                  </div>
                ))}
              </div>
              <div style={{
                padding: '12px 16px 14px',
                borderTop: '1px solid rgba(139,92,246,0.11)',
                background: 'rgba(139,92,246,0.03)',
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.5, margin: 0 }}>
                  {card.yumiSuggestion.message}
                </p>

                {(card.yumiSuggestion.action === 'request_document' || card.yumiSuggestion.action === 'escalate') && (
                  sent
                    ? <div style={{ padding: '8px 12px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>✓ Message sent — Yumi is monitoring the reply</span>
                      </div>
                    : <button onClick={handleYumiAction} style={{
                        alignSelf: 'flex-start', padding: '7px 16px', borderRadius: 20, border: 'none',
                        background: card.yumiSuggestion.action === 'escalate' ? '#e5484d' : 'var(--color-primary)',
                        color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      }}>
                        {card.yumiSuggestion.action === 'escalate' ? 'Send Formal Notice →' : 'Send Request →'}
                      </button>
                )}

                {card.yumiSuggestion.action === 'suggest_template' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(139,92,246,0.2)', background: 'white' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 2 }}>Standard ICT Credit Framework v2.1</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>ICT · Full Credit · SAR 50K–500K · ≤ 90 days</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{ padding: '7px 16px', borderRadius: 20, border: 'none', background: 'var(--color-primary)', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Apply Template ✓
                      </button>
                      <button style={{ padding: '7px 14px', borderRadius: 20, border: '1.5px solid #e2e8f0', background: 'none', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {card.yumiSuggestion.action === 'generate_invoice' && (
                  invoiceGenerated
                    ? <div style={{ display: 'flex', gap: 8 }}>
                        <button style={{ flex: 1, padding: '7px 0', borderRadius: 20, border: 'none', background: '#10b981', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Share with Buyer →</button>
                        <button style={{ padding: '7px 14px', borderRadius: 20, border: '1.5px solid #e2e8f0', background: 'none', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Hold</button>
                      </div>
                    : <button onClick={() => setInvoiceGenerated(true)} style={{ alignSelf: 'flex-start', padding: '7px 16px', borderRadius: 20, border: 'none', background: 'var(--color-primary)', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Generate Invoice Preview →
                      </button>
                )}

                {(card.yumiSuggestion.action === 'monitor' || card.yumiSuggestion.action === 'score') && (
                  <div style={{ padding: '8px 12px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>✓ Yumi is on it</span>
                  </div>
                )}
              </div>
            </div>

            {/* CUSTOMER & BASIC INFO */}
            <Section title="Customer & Basic Info">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Seller (Merchant)">
                  <button onClick={() => onNavigate('sellers')}
                    className="text-[13px] font-semibold text-left hover:underline"
                    style={{ color: 'var(--color-primary)' }}>
                    {card.seller} <span className="text-[11px] opacity-60">↗</span>
                  </button>
                </Field>
                <Field label="Buyer (Customer)">
                  <button onClick={() => onNavigate('buyers')}
                    className="text-[13px] font-semibold text-left hover:underline"
                    style={{ color: 'var(--color-primary)' }}>
                    {card.buyer} <span className="text-[11px] opacity-60">↗</span>
                  </button>
                </Field>
                <Field label="Assigned To">
                  <span className="text-[13px] text-slate-700">{assignedTo}</span>
                </Field>
                <Field label="Days in Stage">
                  <span className="text-[13px] text-slate-700">{card.daysInStage} days</span>
                </Field>
              </div>
            </Section>

            {/* FINANCE TERMS */}
            <Section title="Finance Terms">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Product Value">
                  <span className="text-[13px] font-bold text-slate-800 tabular-nums">{formatSAR(card.amount)}</span>
                </Field>
                <Field label="MDR Rate">
                  <span className="text-[13px] text-slate-700">{card.mdrRate}% per month</span>
                </Field>
                <Field label="Tenure">
                  <span className="text-[13px] text-slate-700">{card.tenure} days</span>
                </Field>
                <Field label="Sector">
                  <span className="text-[13px] text-slate-700">{card.sector}</span>
                </Field>
                <Field label="Risk Score">
                  {card.riskScore !== null
                    ? <span className="inline-block text-[12px] font-bold px-2.5 py-0.5 rounded-full"
                        style={{ background: riskColor(card.riskScore).bg, color: riskColor(card.riskScore).text }}>
                        {card.riskScore}
                      </span>
                    : <span className="text-[12px] text-slate-400 italic">Pending scoring</span>}
                </Field>
                <Field label="EMI Frequency">
                  <span className="text-[13px] text-slate-700 capitalize">{card.emiFrequency || '—'}</span>
                </Field>
              </div>
            </Section>

            {/* DOCUMENTS */}
            <Section title="Documents" badge={missingDocs > 0 ? `${missingDocs} missing` : null} badgeColor="#e5484d">
              <div className="space-y-2">
                {card.documents.map((doc, i) => {
                  const sc = statusColor(doc.status)
                  return (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border"
                      style={{ borderColor: '#f1f5f9', background: sc.bg + '40' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={sc.color} strokeWidth="1.8" strokeLinecap="round">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <span className="flex-1 text-[13px] text-slate-700">{doc.name}</span>
                      <span className="text-[11px] font-semibold capitalize" style={{ color: sc.color }}>{doc.status}</span>
                    </div>
                  )
                })}
              </div>
            </Section>

            {/* FEE STRUCTURE & DISTRIBUTION */}
            <Section title="Fee Structure & Distribution">
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Fee Sharing Model</div>
                  <div className="space-y-1.5">
                    {[
                      { id: 'merchant_full', label: 'Merchant Bears Full Cost',       desc: 'Buyer repays principal only — MDR deducted from merchant disbursement' },
                      { id: 'split_50_50',   label: 'Split 50/50 (Merchant & Buyer)', desc: 'Each party pays half the MDR' },
                      { id: 'buyer_full',    label: 'Buyer Bears Full Cost',          desc: 'Buyer repays principal + full MDR — merchant receives full disbursement' },
                    ].map(opt => (
                      <button key={opt.id} onClick={() => { setMdrPayer(opt.id); setInvoiceGenerated(false) }}
                        className="w-full text-start p-3 rounded-xl border transition-all"
                        style={{
                          borderColor: mdrPayer === opt.id ? 'var(--color-primary)' : '#e2e8f0',
                          background: mdrPayer === opt.id ? 'rgba(143,133,255,0.06)' : 'white',
                        }}>
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center"
                            style={{ borderColor: mdrPayer === opt.id ? 'var(--color-primary)' : '#cbd5e1' }}>
                            {mdrPayer === opt.id && <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-primary)' }} />}
                          </div>
                          <span className="text-[12px] font-semibold" style={{ color: mdrPayer === opt.id ? 'var(--color-primary)' : '#334155' }}>{opt.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 ml-5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">EMI Frequency</div>
                  <div className="flex gap-1.5">
                    {Object.entries(EMI_FREQ_LABELS).map(([key, lbl]) => (
                      <button key={key} onClick={() => { setEmiFreq(key); setInvoiceGenerated(false) }}
                        className="flex-1 py-2 rounded-xl text-[11px] font-semibold border transition-all"
                        style={{
                          background: emiFreq === key ? 'var(--color-primary)' : 'white',
                          color: emiFreq === key ? 'white' : '#64748b',
                          borderColor: emiFreq === key ? 'transparent' : '#e2e8f0',
                        }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            {/* FINANCIAL SUMMARY */}
            <Section title="Financial Summary">
              <div className="rounded-xl border border-slate-100 overflow-hidden bg-white">
                {[
                  { label: 'Merchant MDR Amount',   value: formatSAR(merchantMDR),          color: merchantMDR > 0 ? '#f59e0b' : '#94a3b8', bold: false },
                  { label: 'Buyer Fee Amount',       value: formatSAR(buyerFee),             color: buyerFee > 0 ? '#e5484d' : '#94a3b8',    bold: false },
                  { label: 'Merchant Disbursement',  value: formatSAR(merchantDisbursement), color: '#10b981',                                bold: true  },
                  { label: 'Buyer Total Repayment',  value: formatSAR(totalBuyerRepayment),  color: '#334155',                                bold: true  },
                  { label: 'Per EMI Amount',         value: `${formatSAR(perEMI)} × ${instalmentCount}`, color: '#334155',                   bold: false },
                ].map((row, i, arr) => (
                  <div key={row.label} className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? 'border-b border-slate-50' : ''}`}>
                    <span className="text-[13px] text-slate-500">{row.label}</span>
                    <span className={`text-[13px] tabular-nums ${row.bold ? 'font-bold' : 'font-semibold'}`} style={{ color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* INSTALMENT SCHEDULE */}
            <Section title="Instalment Schedule">
              <div className="rounded-xl border border-slate-100 overflow-hidden bg-white">
                {/* Summary stats */}
                <div className="grid grid-cols-4 border-b border-slate-100">
                  {[
                    { label: 'Total',   value: instalmentCount,                                                           danger: false },
                    { label: 'Paid',    value: paidInstalments,                                                           danger: false },
                    { label: 'Pending', value: Math.max(0, instalmentCount - paidInstalments - overdueInstalments),       danger: false },
                    { label: 'Overdue', value: overdueInstalments,                                                        danger: true  },
                  ].map((stat, i) => (
                    <div key={stat.label} className={`px-4 py-3 text-center ${i < 3 ? 'border-r border-slate-100' : ''}`}>
                      <div className={`text-[20px] font-bold ${stat.danger && stat.value > 0 ? 'text-red-500' : 'text-slate-800'}`}>{stat.value}</div>
                      <div className="text-[10px] text-slate-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
                {/* Schedule table */}
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-50" style={{ background: '#f8fafc' }}>
                      <th className="px-4 py-2 text-start text-[10px] font-semibold text-slate-400 uppercase tracking-wide">No.</th>
                      <th className="px-4 py-2 text-start text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Due Date</th>
                      <th className="px-4 py-2 text-end text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Amount</th>
                      <th className="px-4 py-2 text-end text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: instalmentCount }, (_, i) => {
                      const dueMs = new Date('2026-06-01').getTime() + (i + 1) * emiDays * 86400000
                      const dueDate = new Date(dueMs).toISOString().slice(0, 10)
                      const isPaid    = i < paidInstalments
                      const isOverdue = !isPaid && i < paidInstalments + overdueInstalments
                      return (
                        <tr key={i} className="border-b border-slate-50 last:border-0">
                          <td className="px-4 py-2.5 text-[12px] text-slate-400">{i + 1}</td>
                          <td className="px-4 py-2.5 text-[12px] text-slate-600">{dueDate}</td>
                          <td className="px-4 py-2.5 text-[12px] text-end tabular-nums font-medium text-slate-700">{formatSAR(perEMI)}</td>
                          <td className="px-4 py-2.5 text-end">
                            {isPaid
                              ? <span className="text-[11px] font-semibold text-emerald-600">✓ Paid</span>
                              : isOverdue
                              ? <span className="text-[11px] font-semibold text-red-500">Overdue</span>
                              : <span className="text-[11px] text-slate-400">Pending</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Section>

          </div>

          {/* STICKY ACTION BAR + ASSIGN PANEL */}
          <div style={{ position: 'sticky', bottom: 0, zIndex: 20 }}>

            {/* Assign panel — slides up above the action bar */}
            {showAssignPanel && (
              <div style={{
                background: 'white',
                borderTop: '1px solid #e2e8f0',
                boxShadow: '0 -8px 32px rgba(0,0,0,0.08)',
                padding: '16px 24px 20px',
                maxHeight: 340, overflowY: 'auto',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Reassign ticket</span>
                  <button
                    onClick={() => { setShowAssignPanel(false); setAssignTarget(null); setAssignNote('') }}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                  {adminUsers.map(user => (
                    <button key={user.id}
                      onClick={() => setAssignTarget(Object.keys(USERS).find(k => USERS[k].id === user.id))}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                        borderRadius: 10, border: '1.5px solid',
                        borderColor: assignTarget && USERS[assignTarget]?.id === user.id ? 'rgba(139,92,246,0.4)' : '#f1f5f9',
                        background: assignTarget && USERS[assignTarget]?.id === user.id ? 'rgba(139,92,246,0.05)' : 'transparent',
                        cursor: 'pointer', textAlign: 'left',
                      }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                        background: user.avatar, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white',
                      }}>
                        {user.initials}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{user.name}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>{user.title} · {user.adminRole}</div>
                      </div>
                      {user.name === assignedTo && (
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#10b981' }}>current</span>
                      )}
                    </button>
                  ))}
                </div>
                {assignTarget && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                      Note to assignee (optional)
                    </div>
                    <textarea
                      value={assignNote}
                      onChange={e => setAssignNote(e.target.value)}
                      rows={3}
                      placeholder="Explain why you're reassigning this ticket…"
                      style={{
                        width: '100%', padding: '8px 12px', borderRadius: 8,
                        border: '1.5px solid #e2e8f0', fontSize: 12, resize: 'none',
                        fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                        color: '#334155',
                      }}
                    />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleAssignConfirm} disabled={!assignTarget} style={{
                    flex: 1, padding: '8px 0', borderRadius: 10,
                    background: assignTarget ? '#8b5cf6' : '#e2e8f0',
                    border: 'none', fontSize: 12, fontWeight: 700,
                    color: assignTarget ? 'white' : '#94a3b8', cursor: assignTarget ? 'pointer' : 'default',
                  }}>
                    Confirm Reassignment
                  </button>
                  <button onClick={() => { setShowAssignPanel(false); setAssignTarget(null); setAssignNote('') }} style={{
                    padding: '8px 16px', borderRadius: 10, background: 'none',
                    border: '1.5px solid #e2e8f0', fontSize: 12, fontWeight: 600,
                    color: '#64748b', cursor: 'pointer',
                  }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Action bar */}
            <div style={{
              background: 'rgba(248,250,252,0.97)',
              backdropFilter: 'blur(8px)',
              borderTop: '1px solid #e2e8f0',
              padding: '10px 24px',
              display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
            }}>
              {/* Move Stage */}
              <div style={{ position: 'relative' }}>
                {showStageMenu && (
                  <div onClick={() => setShowStageMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                )}
                <button onClick={() => setShowStageMenu(v => !v)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 20,
                  background: 'white', border: '1.5px solid #e2e8f0',
                  fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer',
                }}>
                  <span>📋</span>
                  Move Stage
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {showStageMenu && (
                  <div style={{
                    position: 'absolute', bottom: '110%', left: 0, zIndex: 50,
                    background: 'white', borderRadius: 12, border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.12)', padding: '6px 0', minWidth: 200,
                  }}>
                    {PIPELINE_STAGES.map(s => (
                      <button key={s.id} onClick={() => handleMoveStage(s.id)} disabled={s.id === cardStage} style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '7px 14px', fontSize: 12, cursor: s.id === cardStage ? 'default' : 'pointer',
                        background: s.id === cardStage ? '#f8fafc' : 'transparent',
                        color: s.id === cardStage ? '#94a3b8' : '#334155',
                        fontWeight: s.id === cardStage ? 700 : 500, border: 'none',
                      }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: s.color, marginRight: 8 }} />
                        {s.label}{s.id === cardStage && ' ← current'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Approve (role-gated) */}
              {canApprove && (
                <button onClick={handleApprove} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 20,
                  background: '#10b981', border: 'none',
                  fontSize: 12, fontWeight: 700, color: 'white', cursor: 'pointer',
                }}>
                  ✓ {cardStage === 'legal' ? 'Approve Finance Request' : 'Confirm Disbursement'}
                </button>
              )}

              {/* Assign */}
              <button onClick={() => setShowAssignPanel(v => !v)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 20,
                background: showAssignPanel ? 'rgba(139,92,246,0.08)' : 'white',
                border: '1.5px solid',
                borderColor: showAssignPanel ? 'rgba(139,92,246,0.35)' : '#e2e8f0',
                fontSize: 12, fontWeight: 600,
                color: showAssignPanel ? '#7c3aed' : '#374151', cursor: 'pointer',
              }}>
                <span>👤</span> Assign
              </button>

              <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>
                Assigned: <strong style={{ color: '#374151' }}>{assignedTo}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT — Chatter */}
        <ChatterPanel
          timeline={timeline}
          chatterMode={chatterMode}
          setChatterMode={setChatterMode}
          draftText={draftText}
          setDraftText={setDraftText}
          onSend={handleChatterSend}
        />
      </div>
    </div>
  )
}

// ── Pipeline board ────────────────────────────────────────────────────────────

export default function Pipeline({ onNavigate }) {
  const { state } = useApp()
  const adminRole = state.currentUser?.adminRole
  const [selectedCard, setSelectedCard] = useState(null)
  const [filterRole, setFilterRole] = useState('mine')
  const [laneActionStage, setLaneActionStage] = useState(null)
  const [cards, setCards] = useState(PIPELINE_CARDS)

  const handleCardUpdate = (updated) => {
    setCards(prev => prev.map(c => c.id === updated.id ? updated : c))
    setSelectedCard(updated)
  }

  const myStages = ROLE_STAGE_MAP[adminRole] || PIPELINE_STAGES.map(s => s.id)
  const currentIdx = selectedCard ? cards.findIndex(c => c.id === selectedCard.id) : -1

  if (selectedCard) return (
    <CardDetailPage
      key={selectedCard.id}
      card={selectedCard}
      currentIdx={currentIdx}
      totalCards={cards.length}
      onClose={() => setSelectedCard(null)}
      onPrev={() => currentIdx > 0 && setSelectedCard(cards[currentIdx - 1])}
      onNext={() => currentIdx < cards.length - 1 && setSelectedCard(cards[currentIdx + 1])}
      onNavigate={onNavigate}
      onCardUpdate={handleCardUpdate}
    />
  )

  const visibleStages = adminRole === 'super'
    ? PIPELINE_STAGES
    : filterRole === 'mine'
    ? PIPELINE_STAGES.filter(s => myStages.includes(s.id))
    : PIPELINE_STAGES

  const cardsForStage = (stageId) => cards.filter(c => c.stage === stageId)
  const myCardCount = cards.filter(c => myStages.includes(c.stage)).length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Filter bar */}
      <div className="px-6 py-3 border-b border-slate-100 bg-white flex items-center gap-3 shrink-0">
        <span className="text-[12px] font-semibold text-slate-500">View:</span>
        {adminRole !== 'super' && (
          <button onClick={() => setFilterRole('mine')}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
            style={{ background: filterRole === 'mine' ? 'var(--color-primary)' : '#f1f5f9', color: filterRole === 'mine' ? 'white' : '#64748b' }}>
            My Lanes ({myCardCount})
          </button>
        )}
        <button onClick={() => setFilterRole('all')}
          className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
          style={{ background: filterRole === 'all' || adminRole === 'super' ? 'var(--color-primary)' : '#f1f5f9', color: filterRole === 'all' || adminRole === 'super' ? 'white' : '#64748b' }}>
          All Stages
        </button>
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{cards.length} active transactions</span>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 p-6 h-full" style={{ minWidth: `${visibleStages.length * 296}px` }}>
          {visibleStages.map(stage => {
            const stageCards = cardsForStage(stage.id)
            const isMyLane = myStages.includes(stage.id)
            return (
              <div key={stage.id} className="flex flex-col shrink-0" style={{ width: 280 }}>
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3 relative">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: stage.color }} />
                  <span className="font-semibold text-[13px] text-slate-700 flex-1">{stage.label}</span>
                  <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-white border border-slate-100 text-slate-500">{stageCards.length}</span>
                  {isMyLane && (
                    <button onClick={() => setLaneActionStage(laneActionStage === stage.id ? null : stage.id)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="AI Lane Actions">
                      ⚡
                    </button>
                  )}
                  {laneActionStage === stage.id && (
                    <LaneActions stage={stage} onClose={() => setLaneActionStage(null)} />
                  )}
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {stageCards.length === 0 && (
                    <div className="p-4 rounded-xl border-2 border-dashed border-slate-100 text-center text-[12px] text-slate-400">
                      No items
                    </div>
                  )}
                  {stageCards.map(card => {
                    const rc = riskColor(card.riskScore)
                    const missing = card.documents.filter(d => d.status === 'missing').length
                    const hasYumi = !!card.yumiSuggestion.message
                    return (
                      <button key={card.id}
                        onClick={() => { setSelectedCard(card); setLaneActionStage(null) }}
                        className="w-full text-start bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md hover:border-indigo-100 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-mono text-slate-400">{card.id}</span>
                          {card.riskScore !== null
                            ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: rc.bg, color: rc.text }}>Risk {card.riskScore}</span>
                            : <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-400">Scoring…</span>}
                        </div>
                        <div className="text-[13px] font-semibold text-slate-800 leading-tight mb-0.5 truncate">{card.seller}</div>
                        <div className="text-[11px] text-slate-400 mb-2">→ {card.buyer}</div>
                        <div className="text-[14px] font-bold tabular-nums text-slate-900 mb-3">{formatSAR(card.amount)}</div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {card.daysInStage > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 font-medium">{card.daysInStage}d here</span>
                          )}
                          {missing > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-semibold">{missing} doc{missing > 1 ? 's' : ''} missing</span>
                          )}
                          {hasYumi && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
                              style={{ background: 'rgba(143,133,255,0.1)', color: 'var(--color-primary)' }}>
                              ✦ Yumi
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
