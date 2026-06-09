import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { PIPELINE_STAGES, PIPELINE_CARDS, USERS, MOCK_BUYERS, MOCK_SELLERS, formatSAR } from '../../data/mockData'

const ROLE_STAGE_MAP = {
  verifier:    ['doc_collection'],
  credit:      ['credit_review', 'rejected'],
  account_mgr: ['agreement', 'onboarding'],
  super:       null,
}

const STAGE_GROUPS = [
  { label: 'SALES',  stages: ['doc_collection'] },
  { label: 'CREDIT', stages: ['credit_review'] },
  { label: 'LEGAL',  stages: ['agreement'] },
  { label: 'OPS',    stages: ['onboarding', 'closed', 'rejected'] },
]

const stageDept = {}
STAGE_GROUPS.forEach(g => g.stages.forEach(id => { stageDept[id] = g.label }))

function getDocChecklist(type, amount) {
  const base = ['Commercial Registration', 'Tax Certificate', 'National Address']
  if (type === 'merchant' || !amount) return base
  const buyerBase = [...base, 'Sales Ledger (6 months)', 'Manager / Owner Bank Account']
  if (Number(amount) < 50000) return buyerBase
  return [...buyerBase, 'SIMAH Credit Report', 'Tax Returns (4 Quarters)', 'Financial Statements (2 Years)']
}

function riskColor(score) {
  if (score === null) return { bg: '#f5f5f5', text: '#a3a3a3' }
  if (score < 30)     return { bg: '#f5f5f5', text: '#262626' }
  if (score < 60)     return { bg: '#f0f0f0', text: '#525252' }
  return               { bg: '#e5e5e5', text: '#737373' }
}

function statusColor(status) {
  if (status === 'ai_verified')         return { color: '#16a34a', bg: '#f0fdf4' }
  if (status === 'verified')            return { color: '#0369a1', bg: '#f0f9ff' }
  if (status === 'verification_failed') return { color: '#dc2626', bg: '#fef2f2' }
  if (status === 'missing')             return { color: '#737373', bg: '#f0f0f0' }
  return                                       { color: '#a3a3a3', bg: '#fafafa' }  // pending
}

function statusIcon(status) {
  if (status === 'ai_verified')         return '✓'
  if (status === 'verified')            return '✓'
  if (status === 'verification_failed') return '⚠'
  if (status === 'missing')             return '✗'
  return '○'  // pending
}

const STATUS_LABELS = {
  ai_verified:         'AI Verified',
  verified:            'Verified',
  verification_failed: 'Failed',
  missing:             'Missing',
  pending:             'Pending',
}

const AGREEMENT_MANDATORY_CONTRACTS = [
  { id: 'mandatory_agreement',       name: 'Agreement',                 desc: 'Formal agreement between both parties' },
  { id: 'mandatory_nafith',          name: 'Promissory Note "NAFITH"',  desc: 'NAFITH-registered promissory note' },
  { id: 'mandatory_corp_promissory', name: 'Corporate Promissory Note', desc: 'Corporate entity payment promise' },
  { id: 'mandatory_assignment',      name: 'Assignment of Rights',      desc: 'Transfer of receivables and rights' },
]

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
    { id: 'chase',  label: 'Auto-chase missing documents',  desc: `Yumnai will message all buyers in ${stage.label} with incomplete documents.` },
    { id: 'flag',   label: 'Flag stale cards (>3 days)',    desc: 'Yumnai will mark cards sitting here longer than 3 days as overdue for review.' },
    { id: 'assign', label: 'Auto-assign unassigned cards',  desc: 'Yumnai will distribute unassigned cards to available team members based on capacity.' },
  ]
  return (
    <div className="absolute top-10 left-0 z-30 w-72 bg-white rounded-2xl border border-black/5 shadow-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[13px]">✦</span>
        <span className="text-[12px] font-bold text-slate-800">Yumnai · Lane Actions</span>
        <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-600">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div className="space-y-2">
        {actions.map(a => (
          <button key={a.id} onClick={() => setApplied(a.id)}
            className="w-full text-start p-3 rounded-xl border transition-colors"
            style={{
              borderColor: applied === a.id ? 'rgba(0,0,0,0.15)' : '#e5e5e5',
              background: applied === a.id ? 'rgba(0,0,0,0.03)' : 'transparent',
            }}>
            <div className="text-[12px] font-semibold text-slate-800 mb-0.5">{a.label}</div>
            <div className="text-[11px] text-slate-400 leading-snug">{a.desc}</div>
            {applied === a.id && <div className="mt-2 text-[11px] font-semibold" style={{ color: '#525252' }}>✓ Yumnai is on it</div>}
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
      {/* Header */}
      <div style={{ padding: '13px 16px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#171717' }}>Activity Timeline</span>
      </div>
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
              <div className="w-7 h-7 rounded-full border-2 border-slate-200 bg-slate-50 flex items-center justify-center text-[12px] shrink-0 mt-0.5">
                💰
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12px] font-semibold text-slate-700">Payment received</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-semibold tabular-nums">
                    {formatSAR(entry.amount)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Instalment {entry.instalment} · {entry.date}</p>
              </div>
            </div>
          )
          if (entry.type === 'note') return (
            <div key={entry.id || i} className="rounded-xl border p-3" style={{ background: '#f5f5f5', borderColor: '#e5e5e5' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-semibold" style={{ color: '#262626' }}>{entry.from}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: '#e5e5e5', color: '#525252' }}>Note</span>
                <span className="ml-auto text-[10px] text-slate-400">{entry.date}</span>
              </div>
              <p className="text-[12px] text-slate-600 leading-relaxed">{entry.message}</p>
            </div>
          )
          const isYumnai = entry.from === 'Yumnai AI'
          return (
            <div key={entry.id || i} className="rounded-xl border p-3"
              style={isYumnai
                ? { borderColor: 'rgba(144,132,253,0.30)', background: 'linear-gradient(135deg, #efedff 0%, #e9edff 50%, #e6f4ff 100%)' }
                : { borderColor: '#e5e5e5', background: '#fafafa' }}>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                {isYumnai ? (
                  <span className="inline-flex items-center gap-1 text-[12px] font-bold" style={{ color: 'var(--color-primary)' }}>
                    <img src="/yumnai.svg" alt="" className="h-3.5 w-auto" /> Yumnai
                  </span>
                ) : (
                  <span className="text-[12px] font-semibold text-slate-700">{entry.from}</span>
                )}
                <span className="ml-auto text-[10px] text-slate-400 shrink-0">{entry.date}</span>
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: isYumnai ? '#262626' : '#475569' }}>{entry.message}</p>
            </div>
          )
        })}
      </div>

      {/* Bottom composer dock — chat-window style */}
      <div className="border-t border-slate-100 shrink-0">
        {/* Action buttons */}
        <div className="px-4 py-3 flex gap-2">
          {[
            { id: 'message', label: 'Send message' },
            { id: 'note',    label: 'Log note' },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => setChatterMode(m => m === id ? null : id)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all"
              style={{
                background: chatterMode === id ? '#f5f5f5' : 'white',
                borderColor: chatterMode === id ? (id === 'note' ? '#e5e5e5' : 'rgba(0,0,0,0.15)') : '#e5e5e5',
                color: chatterMode === id ? '#262626' : '#525252',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Composer */}
        {chatterMode && (
          <div className="px-4 pb-3" style={{ background: '#f5f5f5' }}>
            <textarea
              value={draftText}
              onChange={e => setDraftText(e.target.value)}
              rows={4}
              autoFocus
              placeholder={chatterMode === 'note' ? 'Add an internal note…' : 'Write a message…'}
              className="w-full px-3 py-2.5 rounded-xl border text-[12px] outline-none resize-none leading-relaxed"
              style={{ borderColor: chatterMode === 'note' ? '#e5e5e5' : 'rgba(0,0,0,0.15)', fontFamily: 'inherit' }}
            />
            <div className="flex gap-2 mt-2">
              <button onClick={onSend}
                className="px-4 py-1.5 rounded-lg text-white font-semibold text-[12px]"
                style={{ background: 'var(--color-primary)' }}>
                {chatterMode === 'note' ? 'Add note' : 'Send'}
              </button>
              <button onClick={() => { setChatterMode(null); setDraftText('') }}
                className="px-4 py-1.5 rounded-lg font-semibold text-[12px] border border-slate-200 text-slate-500">
                Discard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Card Detail Page ──────────────────────────────────────────────────────────

function CardDetailPage({ card, currentIdx, totalCards, onClose, onPrev, onNext, onNavigate, onCardUpdate, onPrevInLane, onNextInLane, laneIdx, laneTotal, laneLabel }) {
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
  const [showAssignPanel,      setShowAssignPanel]      = useState(false)
  const [showAssignDropdown,   setShowAssignDropdown]   = useState(false)
  const [ticketInfoCollapsed,  setTicketInfoCollapsed]  = useState(false)
  const [assignTarget,         setAssignTarget]         = useState(null)
  const [assignNote,      setAssignNote]      = useState('')
  const [assignedTo,      setAssignedTo]      = useState(card.assignedTo)
  const [converted,       setConverted]       = useState(false)
  const [extraDocs,       setExtraDocs]       = useState(0)
  const [extraMeetings,   setExtraMeetings]   = useState(0)
  const [extraQuotes,     setExtraQuotes]     = useState(0)
  const [custOpen,        setCustOpen]        = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadDocName,   setUploadDocName]   = useState('')
  const [uploadFile,      setUploadFile]      = useState(null)
  const [uploadDragging,  setUploadDragging]  = useState(false)
  const [uploadLoading,   setUploadLoading]   = useState(false)

  // Counter-proposal (risk stage)
  const [editingField,    setEditingField]    = useState(null)  // 'amount'|'tenure'|'mdr'|null
  const [propAmount,      setPropAmount]      = useState(String(card.proposedAmount || card.amount))
  const [propTenure,      setPropTenure]      = useState(String(card.proposedTenure || card.tenure))
  const [propMdrRate,     setPropMdrRate]     = useState(String(card.proposedMdrRate || card.mdrRate))
  const [counterProposal, setCounterProposal] = useState(
    card.proposedAmount ? { amount: card.proposedAmount, tenure: card.proposedTenure, mdrRate: card.proposedMdrRate, by: card.counterProposedBy, at: card.counterProposedAt } : null
  )

  // Stage brief editable state
  const [docStatuses,     setDocStatuses]     = useState(
    Object.fromEntries(card.documents.map(d => [d.name, d.status]))
  )
  const [showCreditDocsModal,  setShowCreditDocsModal]  = useState(false)
  const [creditDecision,       setCreditDecision]       = useState(null)
  const [proposedCreditAmount, setProposedCreditAmount] = useState(String(card.proposedAmount || card.amount || ''))
  const [nafathVerified,  setNafathVerified]  = useState(
    card.documents.some(d => d.name.toLowerCase().includes('nafath') && d.status === 'received')
  )
  const [crVerified,      setCrVerified]      = useState(
    card.documents.some(d => d.name.toLowerCase().includes('commercial') && d.status === 'received')
  )

  const [docAiChecks, setDocAiChecks] = useState(
    Object.fromEntries(card.documents.map(d => [d.name, { check: d.aiCheck ?? null, discrepancy: d.discrepancy ?? null }]))
  )
  // Contracts (legal stage) — mandatory contracts auto-injected when stage is agreement
  const [contracts, setContracts] = useState(() => {
    const existing = card.contracts || []
    if (card.stage !== 'agreement') return existing
    const existingIds = new Set(existing.map(c => c.id))
    const now = new Date().toLocaleString('en-SA', { dateStyle: 'short', timeStyle: 'short' })
    const toInject = AGREEMENT_MANDATORY_CONTRACTS
      .filter(m => !existingIds.has(m.id))
      .map(m => ({ id: m.id, name: m.name, status: 'Draft', mandatory: true, addedBy: 'System', addedAt: now }))
    return [...toInject, ...existing]
  })
  const [showContractAdd, setShowContractAdd] = useState(false)
  const [contractMode,    setContractMode]    = useState('template')
  const [selectedTpl,     setSelectedTpl]     = useState('')
  const [uploadName,      setUploadName]      = useState('')

  // Inject mandatory contracts whenever the stage transitions to agreement mid-session
  useEffect(() => {
    if (cardStage !== 'agreement') return
    const now = new Date().toLocaleString('en-SA', { dateStyle: 'short', timeStyle: 'short' })
    setContracts(prev => {
      const existingIds = new Set(prev.map(c => c.id))
      const toInject = AGREEMENT_MANDATORY_CONTRACTS
        .filter(m => !existingIds.has(m.id))
        .map(m => ({ id: m.id, name: m.name, status: 'Draft', mandatory: true, addedBy: 'System', addedAt: now }))
      return toInject.length > 0 ? [...toInject, ...prev] : prev
    })
  }, [cardStage])

  // Doc Collection editable amount (may be blank if not entered at ticket creation)
  const [editAmount, setEditAmount] = useState(String(card.amount || ''))

  const isBuyer      = !!card.buyer
  const routingPath  = !isBuyer ? 'merchant_only' : Number(editAmount) >= 50000 ? 'full' : 'standard'
  const activeDocList = getDocChecklist(isBuyer ? 'buyer' : 'merchant', editAmount ? Number(editAmount) : 999999)

  // Tabs
  const [activeTab,    setActiveTab]    = useState('overview')
  const [selectedDoc,  setSelectedDoc]  = useState(null)
  const [docNotes,     setDocNotes]     = useState({})

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
  const cardNum = parseInt(card.id.replace('OR-', ''))
  const smartCounts = {
    documents:  card.documents.length + extraDocs,
    meetings:   (cardNum * 7 % 5) + 1 + extraMeetings,
    quotations: (cardNum * 3 % 3) + 1 + extraQuotes,
    similar:    (cardNum * 11 % 8) + 2,
  }

  const missingDocNames = card.documents.filter(d => d.status === 'missing').map(d => d.name)
  const pendingDocCount = card.documents.filter(d => d.status === 'pending').length
  const unreadMsgCount  = card.correspondence.filter(c => !c.autoRead).length
  const adminUsers      = Object.values(USERS).filter(u => u.role === 'admin')

  const buyerInfo       = card.buyerId ? MOCK_BUYERS.find(b => b.id === card.buyerId) || null : null
  const remainingCredit = buyerInfo ? buyerInfo.creditLimit - buyerInfo.creditUsed : null
  const isAboveLimit    = remainingCredit !== null && card.amount > remainingCredit

  const yumnaiItems = [
    // Process-type context item (always first)
    ...(card.type === 'invoice_finance' && isAboveLimit ? [{
      icon: '🔴',
      text: `Amount (${formatSAR(card.amount)}) exceeds buyer's remaining credit limit (${formatSAR(remainingCredit)}) — escalated review required`,
      urgency: 'red',
    }] : []),
    ...missingDocNames.length ? [{ icon: '📄', text: `${missingDocNames.length} missing doc${missingDocNames.length > 1 ? 's' : ''}: ${missingDocNames.join(', ')}`, urgency: 'red' }] : [],
    ...(card.type === 'onboarding'
      ? [{ icon: '📥', text: '1 finance request raised', urgency: 'amber' }]
      : pendingDocCount
        ? [{ icon: '⏳', text: `${pendingDocCount} document${pendingDocCount > 1 ? 's' : ''} pending verification`, urgency: 'amber' }]
        : []),
    ...card.daysInStage > 5   ? [{ icon: '🕐', text: `Stale — ${card.daysInStage} days in current stage (threshold: 5d)`, urgency: 'amber' }] : [],
    ...(card.type !== 'onboarding' && card.riskScore !== null && card.riskScore > 60) ? [{ icon: '⚠️', text: `High risk score: ${card.riskScore} — manual review recommended`, urgency: 'red' }] : [],
    ...unreadMsgCount         ? [{ icon: '💬', text: `${unreadMsgCount} unread message${unreadMsgCount > 1 ? 's' : ''} in correspondence`, urgency: 'amber' }] : [],
  ]

  const ACTION_LABELS = {
    request_document:   'Request missing documents from buyer',
    request_signatures: 'Request buyer to sign mandatory contracts',
    escalate:           'Escalate to formal notice',
    suggest_template:   'Apply legal framework template',
    generate_invoice:   'Generate and share invoice',
    monitor:            'Monitor repayment schedule',
    score:              'Initiate credit scoring sequence',
  }

  const openComposerWithDraft = () => {
    setDraftText(card.yumnaiSuggestion.draftText)
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
    const yumnaiFollowUp = chatterMode === 'message' &&
      (card.yumnaiSuggestion.action === 'request_document' || card.yumnaiSuggestion.action === 'escalate' || card.yumnaiSuggestion.action === 'request_signatures')
      ? [{
          id: `yumnai-${Date.now()}`,
          type: 'correspondence',
          from: 'Yumnai AI',
          message: 'Message sent. I will monitor the reply and auto-attach any documents received from the client.',
          autoRead: true,
          date: 'Just now',
        }]
      : []
    setTimeline(prev => [...prev, newEntry, ...yumnaiFollowUp])
    if (yumnaiFollowUp.length > 0) setSent(true)
    setDraftText('')
    setChatterMode(null)
  }

  const canApprove = false

  const handleMoveStage = (newStageId) => {
    const label = PIPELINE_STAGES.find(s => s.id === newStageId)?.label || newStageId
    setCardStage(newStageId)
    setTimeline(prev => [...prev, {
      id: `hist-${Date.now()}`, type: 'history', icon: '📋',
      text: `Stage moved to ${label} by ${currentUser?.name || 'You'}`,
      date: new Date().toLocaleString('en-SA', { dateStyle: 'short', timeStyle: 'short' }),
    }])
    onCardUpdate?.({ ...card, stage: newStageId, assignedTo })
  }

  const handleDocStatusChange = (docName, newStatus) => {
    setDocStatuses(prev => {
      const updated = { ...prev, [docName]: newStatus }
      return updated
    })
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

  const handleYumnaiAction = () => {
    const text = card.yumnaiSuggestion.draftText
    if (!text) return
    setTimeline(prev => [...prev,
      { id: `msg-${Date.now()}`, type: 'correspondence', from: 'You', message: text, autoRead: false, date: 'Just now' },
      { id: `yumnai-${Date.now()}`, type: 'correspondence', from: 'Yumnai AI', message: 'Message sent. I will monitor the reply and auto-attach any documents received from the client.', autoRead: true, date: 'Just now' },
    ])
    setSent(true)
  }

  const handleConfirmCreditDecision = () => {
    const now = new Date().toLocaleString('en-SA', { dateStyle: 'short', timeStyle: 'short' })
    if (creditDecision === 'approve') {
      setTimeline(prev => [...prev, { id: `cr-${Date.now()}`, type: 'history', icon: '✅', text: `Credit approved by ${currentUser?.name || 'You'}. Proceeding to agreement.`, date: now }])
      handleMoveStage('agreement')
    } else if (creditDecision === 'reject') {
      setTimeline(prev => [...prev, { id: `cr-${Date.now()}`, type: 'history', icon: '❌', text: `Credit rejected by ${currentUser?.name || 'You'}.`, date: now }])
      handleMoveStage('rejected')
    } else if (creditDecision === 'propose_new') {
      const amt = Number(proposedCreditAmount)
      if (!amt) return
      setPropAmount(String(amt))
      onCardUpdate?.({ ...card, stage: 'agreement', assignedTo, proposedAmount: amt, proposedTenure: card.tenure, proposedMdrRate: card.mdrRate, counterProposedBy: currentUser?.name || 'You', counterProposedAt: now })
      setTimeline(prev => [...prev, { id: `cr-${Date.now()}`, type: 'history', icon: '⚖️', text: `Credit proposed at ${formatSAR(amt)} by ${currentUser?.name || 'You'}. Forwarding to agreement.`, date: now }])
      handleMoveStage('agreement')
    }
  }

  // ── Primary action per stage ──────────────────────────────────────────────
  const STAGE_PRIMARY = {
    doc_collection: { label: '✓ Docs Collected',   next: 'credit_review', msg: 'Documents collected. Forwarding to credit review.' },
    credit_review:  null,
    agreement:      { label: '✓ Agreement Signed', next: 'onboarding',    msg: 'Agreement signed. Proceeding to onboarding.' },
    onboarding:     { label: '✓ Complete Onboarding', next: 'closed',     msg: 'Onboarding complete. Account is live.' },
    rejected:       { label: '⚡ Acknowledge',     next: null,            msg: 'Application rejected by credit team.' },
    closed:         { label: null,                 next: null,            msg: null },
  }
  const primaryAction  = STAGE_PRIMARY[cardStage]
  const canPrimary     = primaryAction && (stageInfo?.assignedRole === currentUser?.adminRole || currentUser?.adminRole === 'super')

  const handlePrimaryAction = () => {
    if (!primaryAction) return
    const msg = typeof primaryAction.msg === 'function' ? primaryAction.msg() : primaryAction.msg
    setTimeline(prev => [...prev, {
      id: `primary-${Date.now()}`, type: 'history', icon: '✅',
      text: `${msg} — by ${currentUser?.name || 'You'}`,
      date: new Date().toLocaleString('en-SA', { dateStyle: 'short', timeStyle: 'short' }),
    }])
    if (primaryAction.next) handleMoveStage(primaryAction.next)
  }

  // ── Contract helpers ──────────────────────────────────────────────────────
  const CONTRACT_TEMPLATES = {
    invoice_finance: [
      { id: 'promissory_note',   label: 'Promissory Note',             desc: 'Binding payment promise from buyer' },
      { id: 'finance_agreement', label: 'Finance Agreement',           desc: 'Full terms of the credit facility' },
      { id: 'mdr_disclosure',    label: 'MDR Disclosure Letter',       desc: 'Fee structure disclosure to merchant' },
    ],
    onboarding: [
      { id: 'credit_facility',   label: 'Credit Facility Agreement',   desc: 'Master credit facility terms' },
      { id: 'merchant_toc',      label: 'Merchant Terms & Conditions', desc: 'Platform usage agreement' },
      { id: 'kyc_declaration',   label: 'KYC Declaration',             desc: 'Identity and beneficial owner declaration' },
    ],
  }
  const availableTemplates = CONTRACT_TEMPLATES[card.type] || CONTRACT_TEMPLATES.onboarding

  const addContractFromTemplate = () => {
    if (!selectedTpl) return
    const tpl = availableTemplates.find(t => t.id === selectedTpl)
    if (!tpl) return
    const newContract = { id: `c-${Date.now()}`, name: tpl.label, status: 'Draft', addedBy: currentUser?.name || 'You', addedAt: new Date().toLocaleString('en-SA', { dateStyle: 'short', timeStyle: 'short' }) }
    setContracts(prev => [...prev, newContract])
    setTimeline(prev => [...prev, { id: `contract-${Date.now()}`, type: 'history', icon: '📋', text: `${tpl.label} added (Draft) by ${currentUser?.name || 'You'}`, date: newContract.addedAt }])
    setSelectedTpl('')
    setShowContractAdd(false)
  }

  const addContractManual = () => {
    if (!uploadName.trim()) return
    const newContract = { id: `c-${Date.now()}`, name: uploadName.trim(), status: 'Draft', addedBy: currentUser?.name || 'You', addedAt: new Date().toLocaleString('en-SA', { dateStyle: 'short', timeStyle: 'short' }) }
    setContracts(prev => [...prev, newContract])
    setTimeline(prev => [...prev, { id: `contract-${Date.now()}`, type: 'history', icon: '📎', text: `${uploadName.trim()} uploaded by ${currentUser?.name || 'You'}`, date: newContract.addedAt }])
    setUploadName('')
    setShowContractAdd(false)
  }

  const sendContract = (contractId) => {
    setContracts(prev => prev.map(c => c.id === contractId ? { ...c, status: 'Sent' } : c))
    const c = contracts.find(x => x.id === contractId)
    if (c) setTimeline(prev => [...prev, { id: `send-${Date.now()}`, type: 'history', icon: '📤', text: `${c.name} sent to ${card.buyer} by ${currentUser?.name || 'You'}`, date: new Date().toLocaleString('en-SA', { dateStyle: 'short', timeStyle: 'short' }) }])
  }

  // ── Counter-proposal handler ──────────────────────────────────────────────
  const submitCounterProposal = () => {
    if (!propAmount || !propTenure || !propMdrRate) return
    const cp = {
      amount:   Number(propAmount),
      tenure:   Number(propTenure),
      mdrRate:  Number(propMdrRate),
      by: currentUser?.name || 'You',
      at: new Date().toLocaleString('en-SA', { dateStyle: 'short', timeStyle: 'short' }),
    }
    setCounterProposal(cp)
    setEditingField(null)
    setTimeline(prev => [...prev, {
      id: `cp-${Date.now()}`, type: 'history', icon: '⚖️',
      text: `Counter-proposal by ${cp.by}: Amount ${formatSAR(card.amount)} → ${formatSAR(cp.amount)}, Tenure ${card.tenure}d → ${cp.tenure}d, MDR ${card.mdrRate}% → ${cp.mdrRate}%. Pending buyer acceptance.`,
      date: cp.at,
    }])
    onCardUpdate?.({ ...card, stage: cardStage, assignedTo, proposedAmount: cp.amount, proposedTenure: cp.tenure, proposedMdrRate: cp.mdrRate, counterProposedBy: cp.by, counterProposedAt: cp.at })
  }

  const withdrawCounterProposal = () => {
    setCounterProposal(null)
    setTimeline(prev => [...prev, { id: `cpw-${Date.now()}`, type: 'history', icon: '↩️', text: `Counter-proposal withdrawn by ${currentUser?.name || 'You'}`, date: new Date().toLocaleString('en-SA', { dateStyle: 'short', timeStyle: 'short' }) }])
    onCardUpdate?.({ ...card, stage: cardStage, assignedTo, proposedAmount: null, proposedTenure: null, proposedMdrRate: null, counterProposedBy: null, counterProposedAt: null })
  }


  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Top action bar ── */}
      <div className="px-5 py-3 border-b border-black/5 flex items-center gap-3 shrink-0 flex-wrap">
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

        {/* Smart profile buttons */}
        <div className="flex gap-2 ml-2 flex-wrap">
          <button onClick={() => onNavigate('sellers')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[12px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-800 hover:border-slate-200 transition-colors">
            🏪 {card.seller}
          </button>
          {card.buyer && (
            <button onClick={() => onNavigate('buyers')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[12px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-800 hover:border-slate-200 transition-colors">
              👤 {card.buyer}
            </button>
          )}
          {card.amount > 0 && (
            <span className="flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[12px] font-bold text-slate-700">
              {formatSAR(card.amount)}
            </span>
          )}
          {card.riskScore !== null && card.riskScore !== undefined && card.type !== 'onboarding' && (
            <span className="flex items-center px-3 py-1.5 rounded-lg border text-[11px] font-bold"
              style={{ background: riskColor(card.riskScore).bg, borderColor: riskColor(card.riskScore).bg, color: riskColor(card.riskScore).text }}>
              Risk {card.riskScore}
            </span>
          )}
          {isAboveLimit && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold"
              style={{ background: '#fff7ed', borderColor: '#fed7aa', color: '#c2410c' }}>
              ⚠️ Above Limit
            </span>
          )}
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

      {/* ── Row 2: Pipeline Stage Bar ── */}
      <div className="px-5 py-2 border-b border-black/5 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-0" style={{ minWidth: 'max-content' }}>
          {STAGE_GROUPS.map((group, gi) => {
            const stageOrder = PIPELINE_STAGES.map(s => s.id)
            const currentIdx = stageOrder.indexOf(cardStage)
            return (
              <div key={group.label} className="flex items-center">
                {gi > 0 && <span style={{ color: '#d4d4d4', margin: '0 8px', fontSize: 18, lineHeight: 1 }}>|</span>}
                <div className="flex items-center gap-0">
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#a3a3a3', letterSpacing: '0.1em', marginRight: 6, textTransform: 'uppercase' }}>
                    {group.label}
                  </span>
                  {group.stages.map((stageId, si) => {
                    const s = PIPELINE_STAGES.find(p => p.id === stageId)
                    if (!s) return null
                    const sIdx = stageOrder.indexOf(stageId)
                    const isPast    = sIdx < currentIdx
                    const isCurrent = stageId === cardStage
                    const isFuture  = sIdx > currentIdx
                    return (
                      <div key={stageId} className="flex items-center">
                        {si > 0 && <span style={{ color: '#d4d4d4', fontSize: 10, margin: '0 4px' }}>›</span>}
                        <button
                          onClick={() => !isCurrent && handleMoveStage(stageId)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '4px 8px', borderRadius: 8,
                            border: isCurrent ? '1px solid #86d6a3' : '1px solid transparent',
                            background: isCurrent ? '#dcfce7' : 'transparent',
                            cursor: isCurrent ? 'default' : 'pointer',
                          }}>
                          <span style={{
                            width: 14, height: 14, borderRadius: '50%',
                            border: `1.5px solid ${isPast ? '#d4d4d4' : isCurrent ? '#16a34a' : '#e5e5e5'}`,
                            background: isPast ? '#f0f0f0' : isCurrent ? '#16a34a' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 8, color: isPast ? '#a3a3a3' : 'white',
                            flexShrink: 0,
                          }}>
                            {isPast ? '✓' : ''}
                          </span>
                          <span style={{
                            fontSize: 11,
                            fontWeight: isCurrent ? 700 : 400,
                            color: isCurrent ? '#15803d' : isPast ? '#a3a3a3' : '#525252',
                            whiteSpace: 'nowrap',
                          }}>
                            {s.label}
                          </span>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Body: form + chatter ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT — scrollable form */}
        <style>{`@keyframes yumnai-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }`}</style>
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Scroll container — customer info scrolls away; tabs stick */}
          <div className="flex-1 overflow-y-auto">

          {/* TICKET INFO CARD — collapsible, above tabs */}
          {(() => {
            const detailPriority = card.daysInStage >= 2 ? 'high' : card.daysInStage === 1 ? 'medium' : 'normal'
            const detailTatStyle = {
              high:   { background: '#fee2e2', color: '#b91c1c' },
              medium: { background: '#fef3c7', color: '#b45309' },
              normal: { background: '#f5f5f5', color: '#737373' },
            }[detailPriority]
            const detailTatLabel = card.daysInStage === 0 ? 'new' : `${card.daysInStage}d`
            const businessName = card.buyer || card.seller
            const assignedUserEntry = Object.values(USERS).find(u => u.name === assignedTo)
            return (
              <div style={{ margin: '12px 24px 0', background: 'white', borderRadius: 14, border: '1px solid #e5e5e5', overflow: 'visible' }}>
                {/* Collapse header — always visible */}
                <button
                  onClick={() => setTicketInfoCollapsed(v => !v)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 14px',
                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                    borderBottom: ticketInfoCollapsed ? 'none' : '1px solid #f0f0f0',
                    borderRadius: ticketInfoCollapsed ? 14 : '14px 14px 0 0',
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 700, background: '#f0f9ff', color: '#0369a1', borderRadius: 20, padding: '2px 8px', letterSpacing: 0.2, flexShrink: 0 }}>
                    {card.clientType === 'seller' ? '🏪 Merchant' : '🛒 Buyer'}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#171717', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{businessName}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#171717', background: '#f5f5f5', borderRadius: 20, padding: '2px 10px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {formatSAR(card.amount)}
                  </span>
                  {card.sector && <span style={{ fontSize: 11, color: '#a3a3a3', flexShrink: 0, whiteSpace: 'nowrap' }}>{card.sector}</span>}
                  <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '2px 8px', flexShrink: 0, marginLeft: 4, ...detailTatStyle }}>
                    {detailTatLabel}
                  </span>
                  <span style={{ fontSize: 10, color: '#a3a3a3', marginLeft: 2, flexShrink: 0, transition: 'transform 0.15s', display: 'inline-block', transform: ticketInfoCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▾</span>
                </button>

                {/* Expanded body — compact 2-row layout */}
                {!ticketInfoCollapsed && (
                  <div style={{ padding: '10px 14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>

                    {/* Row 1: contact details inline */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {card.contactPerson && (
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#262626' }}>{card.contactPerson}</span>
                      )}
                      {card.contactPhone && (
                        <>
                          <span style={{ color: '#d4d4d4', fontSize: 10 }}>·</span>
                          <span style={{ fontSize: 12, color: '#525252' }}>📞 {card.contactPhone}</span>
                        </>
                      )}
                      {card.contactEmail && (
                        <>
                          <span style={{ color: '#d4d4d4', fontSize: 10 }}>·</span>
                          <a href={`mailto:${card.contactEmail}`} style={{ fontSize: 12, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>✉ {card.contactEmail}</a>
                        </>
                      )}
                    </div>

                    {/* Row 2: amount + TAT + assignee dropdown */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: 0.6 }}>Requested Credit</span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#171717', lineHeight: 1.2 }}>{formatSAR(card.amount)}</span>
                      </div>
                      <span style={{ color: '#e5e5e5', fontSize: 10 }}>·</span>
                      <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '2px 8px', flexShrink: 0, ...detailTatStyle }}>TAT {detailTatLabel}</span>
                      <div style={{ flex: 1 }} />
                      {/* Assignee trigger */}
                      {stageInfo?.auto
                        ? (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            border: '1px solid #e5e5e5', borderRadius: 20, padding: '4px 12px',
                            background: 'rgba(0,0,0,0.02)', flexShrink: 0,
                          }}>
                            <span style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 700 }}>✦</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#262626' }}>Yumnai</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowAssignDropdown(v => !v)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              border: '1px solid #e5e5e5', borderRadius: 20, padding: '4px 10px 4px 6px',
                              background: showAssignDropdown ? 'rgba(0,0,0,0.03)' : 'white',
                              cursor: 'pointer', flexShrink: 0,
                            }}
                          >
                            <span style={{
                              width: 20, height: 20, borderRadius: '50%', background: 'var(--color-primary)',
                              color: 'white', fontSize: 9, fontWeight: 700,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>{assignedUserEntry?.initials || '?'}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#262626', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{assignedTo || '—'}</span>
                            <span style={{ fontSize: 9, color: '#a3a3a3' }}>▾</span>
                          </button>
                        )
                      }

                      {/* Dropdown — anchored to the right, overlays below */}
                      {!stageInfo?.auto && showAssignDropdown && (
                        <div style={{
                          position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 50,
                          border: '1px solid #e5e5e5', borderRadius: 12,
                          background: 'white', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                          minWidth: 220,
                        }}>
                          {adminUsers.map(user => (
                            <button
                              key={user.id}
                              onClick={() => {
                                setAssignedTo(user.name)
                                setTimeline(prev => [...prev, {
                                  id: `assign-${Date.now()}`, type: 'note', from: currentUser?.name || 'Admin',
                                  message: `Reassigned to ${user.name}.`, autoRead: false,
                                  date: new Date().toLocaleString('en-SA', { dateStyle: 'short', timeStyle: 'short' }),
                                }])
                                setShowAssignDropdown(false)
                                onCardUpdate?.({ ...card, stage: cardStage, assignedTo: user.name })
                              }}
                              style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                padding: '9px 12px', background: user.name === assignedTo ? 'rgba(0,0,0,0.03)' : 'transparent',
                                border: 'none', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', textAlign: 'left',
                              }}
                            >
                              <span style={{
                                width: 26, height: 26, borderRadius: '50%', background: 'var(--color-primary)',
                                color: 'white', fontSize: 10, fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                              }}>{user.initials}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#171717' }}>{user.name}</div>
                                {user.title && <div style={{ fontSize: 10, color: '#737373' }}>{user.title}</div>}
                              </div>
                              {user.name === assignedTo && <span style={{ fontSize: 10, color: 'var(--color-primary)', fontWeight: 700 }}>✓</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            )
          })()}

          {/* Tab bar — sticky under the stage tracker */}
          <div className="sticky top-0 z-20 flex items-end gap-0 px-6 pt-2 border-b border-black/5" style={{ background: 'var(--color-page)' }}>
            {[
              { id: 'overview',   label: 'Overview' },
              { id: 'documents',  label: `Documents (${card.documents.length})` },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: '7px 16px 8px',
                fontSize: 12, fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? 'var(--color-primary)' : '#525252',
                background: 'none', border: 'none',
                borderBottom: activeTab === tab.id ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Documents tab */}
          {activeTab === 'documents' && (
            <div className="flex" style={{ minHeight: 'calc(100vh - 200px)' }}>
              {/* Document list */}
              <div className="overflow-y-auto border-r border-slate-100 shrink-0" style={{ width: 300, background: '#fafafa', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 8px', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#737373', letterSpacing: 0.5 }}>
                    REQUIRED DOCS ({card.documents.length})
                  </span>
                  <button
                    onClick={() => { setUploadDocName(''); setUploadFile(null); setShowUploadModal(true) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, border: '1.5px solid var(--color-primary)', background: 'white', fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer' }}>
                    ↑ Upload
                  </button>
                </div>
                {/* List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {card.documents.map((doc, i) => {
                    const st = docStatuses[doc.name] || doc.status
                    const sc = statusColor(st)
                    const isSelected = selectedDoc?.name === doc.name
                    const needsUpload = st === 'pending' || st === 'missing'
                    return (
                      <button key={i} onClick={() => setSelectedDoc(doc)}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
                          borderRadius: 10, border: '1.5px solid',
                          borderColor: isSelected ? 'rgba(0,0,0,0.15)' : '#e5e5e5',
                          background: isSelected ? 'rgba(0,0,0,0.03)' : 'white',
                          borderLeft: isSelected ? '3px solid var(--color-primary)' : '1.5px solid #e5e5e5',
                          cursor: 'pointer', textAlign: 'left', width: '100%',
                        }}>
                        <span style={{ fontSize: 16, color: sc.color, marginTop: 1, flexShrink: 0 }}>
                          {statusIcon(st)}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#262626', marginBottom: 2 }}>{doc.name}</div>
                          <div style={{ fontSize: 10, color: '#a3a3a3' }}>{stageInfo?.label || cardStage}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.color, whiteSpace: 'nowrap' }}>
                            {STATUS_LABELS[st] || st}
                          </span>
                          {needsUpload && (
                            <span style={{ fontSize: 9, color: '#a3a3a3' }}>↑ upload</span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Document preview */}
              <div className="flex-1 overflow-y-auto p-6" style={{ background: '#f5f5f5' }}>
                {!selectedDoc ? (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: '#a3a3a3' }}>
                    <span style={{ fontSize: 40 }}>📄</span>
                    <span style={{ fontSize: 13 }}>Select a document to preview</span>
                  </div>
                ) : (() => {
                  const st = docStatuses[selectedDoc.name] || selectedDoc.status
                  const sc = statusColor(st)
                  const canEdit = currentUser?.adminRole === 'verifier' || currentUser?.adminRole === 'super'
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <span style={{ fontSize: 32, marginTop: 2 }}>📄</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#171717', marginBottom: 4 }}>{selectedDoc.name}</div>
                          {canEdit ? (
                            <select value={st} onChange={e => handleDocStatusChange(selectedDoc.name, e.target.value)}
                              style={{ border: '1.5px solid #e5e5e5', borderRadius: 8, padding: '4px 10px', fontSize: 12, outline: 'none', fontFamily: 'inherit', color: sc.color, background: sc.bg, fontWeight: 600, cursor: 'pointer' }}>
                              {[
                                { value: 'pending',             label: 'Pending' },
                                { value: 'ai_verified',         label: 'AI Verified' },
                                { value: 'verification_failed', label: 'Verification Failed' },
                                { value: 'verified',            label: 'Verified (Human)' },
                                { value: 'missing',             label: 'Missing' },
                              ].map(s => <option key={s.value} value={s.value} style={{ color: '#262626', background: 'white' }}>{s.label}</option>)}
                            </select>
                          ) : (
                            <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.color, textTransform: 'capitalize' }}>{st}</span>
                          )}
                        </div>
                      </div>

                      {/* Yumnai AI Check — doc_collection stage only */}
                      {cardStage === 'doc_collection' && (() => {
                        const ac = docAiChecks[selectedDoc.name]
                        const aiCheck = ac?.check
                        const discrepancy = ac?.discrepancy
                        if (!aiCheck && st !== 'missing') return null
                        const label = aiCheck === 'pass' ? '✓ AI Check: Pass'
                          : aiCheck === 'flagged' ? '⚠ AI Check: Flagged'
                          : 'AI Check: N/A (missing)'
                        const labelColor = aiCheck === 'pass' ? '#262626' : aiCheck === 'flagged' ? '#737373' : '#a3a3a3'
                        return (
                          <div style={{ padding: '10px 14px', borderRadius: 10, background: '#f5f5f5', border: `1.5px solid ${aiCheck === 'flagged' ? '#d4d4d4' : '#e5e5e5'}` }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Yumnai AI Check</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: labelColor }}>{label}</div>
                            {discrepancy && (
                              <div style={{ fontSize: 11, color: '#525252', lineHeight: 1.5, marginTop: 6 }}>{discrepancy}</div>
                            )}
                          </div>
                        )
                      })()}

                      {/* Meta */}
                      <div style={{ padding: '12px 16px', borderRadius: 10, background: 'white', border: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {[
                          ['Finance Request', card.id],
                          ['Buyer', card.buyer],
                          ['Stage', stageInfo?.label || cardStage],
                          ['Days in Stage', `${card.daysInStage}d`],
                        ].map(([label, value]) => (
                          <div key={label}>
                            <div style={{ fontSize: 10, color: '#a3a3a3', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
                            <div style={{ fontSize: 12, color: '#262626', fontWeight: 500 }}>{value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Notes */}
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Notes</div>
                        <textarea
                          value={docNotes[selectedDoc.name] || ''}
                          onChange={e => setDocNotes(prev => ({ ...prev, [selectedDoc.name]: e.target.value }))}
                          rows={3}
                          placeholder="Add a note about this document…"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12, resize: 'none', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#262626' }}
                        />
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {st === 'missing' && (
                          <button onClick={handleYumnaiAction} style={{ padding: '7px 16px', borderRadius: 10, background: 'var(--color-primary)', border: 'none', fontSize: 12, fontWeight: 700, color: 'white', cursor: 'pointer' }}>
                            Request from buyer →
                          </button>
                        )}
                        {(st === 'pending' || st === 'missing') && (
                          <button onClick={() => { setUploadDocName(selectedDoc.name); setUploadFile(null); setShowUploadModal(true) }}
                            style={{ padding: '7px 16px', borderRadius: 10, background: '#171717', border: 'none', fontSize: 12, fontWeight: 700, color: 'white', cursor: 'pointer' }}>
                            ↑ Upload Document
                          </button>
                        )}
                        {canEdit && st === 'verification_failed' && (
                          <button onClick={() => handleDocStatusChange(selectedDoc.name, 'verified')}
                            style={{ padding: '7px 16px', borderRadius: 10, background: '#0369a1', border: 'none', fontSize: 12, fontWeight: 700, color: 'white', cursor: 'pointer' }}>
                            ✓ Mark Verified
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}

          {/* Overview tab */}
          {activeTab === 'overview' && (
          <div className="p-6 space-y-6">

            {/* YUMNAI BRIEFING */}
            {/* Gradient-border wrapper */}
            <div style={{
              background: 'linear-gradient(135deg, #9084fd 0%, #6a7bff 50%, #3da4ff 100%)',
              padding: '1.5px',
              borderRadius: 18,
            }}>
              <div style={{ borderRadius: 17, overflow: 'hidden', background: 'white' }}>

                {/* Branded header */}
                <div style={{
                  padding: '11px 16px',
                  background: 'linear-gradient(135deg, #9084fd 0%, #6a7bff 50%, #3da4ff 100%)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <img src="/yumnai.svg" alt="Yumnai" style={{ height: 16, width: 'auto', filter: 'brightness(0) invert(1)', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'white', letterSpacing: '0.01em' }}>Yumnai</span>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', display: 'inline-block',
                    background: 'rgba(255,255,255,0.7)',
                    animation: 'yumnai-pulse 2s infinite',
                    flexShrink: 0,
                  }} />
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>
                    Deal Briefing
                  </span>
                </div>

                {/* Info chips */}
                {yumnaiItems.length > 0 ? (
                  <div style={{ padding: '7px 12px', background: 'rgba(144,132,253,0.04)', borderBottom: '1px solid rgba(144,132,253,0.10)', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {yumnaiItems.map((item, idx) => {
                      const isRed = item.urgency === 'red'
                      return (
                        <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: isRed ? 'rgba(239,68,68,0.10)' : 'rgba(144,132,253,0.10)', color: isRed ? '#dc2626' : 'rgba(90,78,210,0.85)', fontSize: 11, fontWeight: 600 }}>
                          <span style={{ fontSize: 11 }}>{item.icon}</span>
                          {item.text}
                        </span>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '6px 12px', background: 'rgba(144,132,253,0.04)', borderBottom: '1px solid rgba(144,132,253,0.10)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: 'rgba(144,132,253,0.08)', color: 'rgba(90,78,210,0.7)', fontSize: 11, fontWeight: 600 }}>
                      ✓ No issues detected — ticket looks healthy
                    </span>
                  </div>
                )}

                {/* One-liner + Action */}
                <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

                  {/* Yumnai one-liner */}
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(144,132,253,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Yumnai</div>
                    <p style={{ fontSize: 12, color: '#262626', lineHeight: 1.5, margin: 0 }}>
                      {card.type === 'onboarding'
                        ? 'This merchant has not yet drawn on their credit line. No active facility or transaction in progress.'
                        : card.yumnaiSuggestion.message}
                    </p>
                  </div>

                  {card.type !== 'onboarding' && <div style={{ height: 1, background: 'rgba(144,132,253,0.08)' }} />}

                  {/* Action section */}
                  {card.type !== 'onboarding' &&
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(144,132,253,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>Action</span>
                      <span style={{ fontSize: 11, color: '#737373', fontWeight: 500, lineHeight: 1.3 }}>
                        {ACTION_LABELS[card.yumnaiSuggestion.action] || ''}
                      </span>
                    </div>

                    {(card.yumnaiSuggestion.action === 'request_document' || card.yumnaiSuggestion.action === 'escalate' || card.yumnaiSuggestion.action === 'request_signatures') && (
                      sent
                        ? <div style={{ padding: '7px 12px', borderRadius: 10, background: 'rgba(144,132,253,0.06)', border: '1px solid rgba(144,132,253,0.15)' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-primary)' }}>✓ Signing request sent — Yumnai is monitoring replies</span>
                          </div>
                        : <button onClick={handleYumnaiAction} style={{ alignSelf: 'flex-start', padding: '7px 18px', borderRadius: 20, border: 'none', background: 'linear-gradient(135deg, #9084fd 0%, #6a7bff 50%, #3da4ff 100%)', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(144,132,253,0.30)' }}>
                            {card.yumnaiSuggestion.action === 'escalate' ? 'Send Formal Notice →' : 'Send Request →'}
                          </button>
                    )}

                    {card.yumnaiSuggestion.action === 'suggest_template' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        <div style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(144,132,253,0.18)', background: 'rgba(144,132,253,0.04)' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#262626', marginBottom: 1 }}>Standard ICT Credit Framework v2.1</div>
                          <div style={{ fontSize: 10, color: '#a3a3a3' }}>ICT · Full Credit · SAR 50K–500K · ≤ 90 days</div>
                        </div>
                        <div style={{ display: 'flex', gap: 7 }}>
                          <button style={{ padding: '7px 16px', borderRadius: 20, border: 'none', background: 'linear-gradient(135deg, #9084fd 0%, #6a7bff 50%, #3da4ff 100%)', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(144,132,253,0.30)' }}>Apply Template ✓</button>
                          <button style={{ padding: '7px 12px', borderRadius: 20, border: '1.5px solid #e5e5e5', background: 'none', color: '#525252', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Dismiss</button>
                        </div>
                      </div>
                    )}

                    {card.yumnaiSuggestion.action === 'generate_invoice' && (
                      invoiceGenerated
                        ? <div style={{ display: 'flex', gap: 7 }}>
                            <button style={{ flex: 1, padding: '7px 0', borderRadius: 20, border: 'none', background: '#171717', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Share with Buyer →</button>
                            <button style={{ padding: '7px 12px', borderRadius: 20, border: '1.5px solid #e5e5e5', background: 'none', color: '#525252', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Hold</button>
                          </div>
                        : <button onClick={() => setInvoiceGenerated(true)} style={{ alignSelf: 'flex-start', padding: '7px 18px', borderRadius: 20, border: 'none', background: 'linear-gradient(135deg, #9084fd 0%, #6a7bff 50%, #3da4ff 100%)', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(144,132,253,0.30)' }}>
                            Generate Invoice Preview →
                          </button>
                    )}

                    {(card.yumnaiSuggestion.action === 'monitor' || card.yumnaiSuggestion.action === 'score') && (
                      <div style={{ padding: '7px 12px', borderRadius: 10, background: 'rgba(144,132,253,0.06)', border: '1px solid rgba(144,132,253,0.15)' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-primary)' }}>✓ Yumnai is on it</span>
                      </div>
                    )}
                  </div>}

                </div>

              </div>
            </div>

            {/* STAGE BRIEF — editable, role-gated */}
            {(currentUser?.adminRole === stageInfo?.assignedRole || currentUser?.adminRole === 'super') && (() => {
              const fieldStyle = { border: '1px solid #e5e5e5', borderRadius: 8, padding: '5px 10px', fontSize: 12, outline: 'none', fontFamily: 'inherit', color: '#262626', background: 'white' }

              const verifiedCount = activeDocList.filter(n => (docStatuses[n] || 'pending') === 'received').length
              const allVerified   = verifiedCount === activeDocList.length

              const docStatusColor = { received: '#262626', pending: '#525252', missing: '#737373' }
              return (
                <Section title={`${stageInfo?.label || ''} — Stage Actions`}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                    {/* SALES — doc_collection */}
                    {cardStage === 'doc_collection' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                        {/* Finance Request (invoice_finance only) */}
                        {isBuyer && card.type !== 'onboarding' && (
                          <>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Finance Request</div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, border: '1px solid #e5e5e5', borderRadius: 10, padding: '7px 12px', background: 'white' }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3' }}>SAR</span>
                                <input
                                  type="number"
                                  value={editAmount}
                                  onChange={e => setEditAmount(e.target.value)}
                                  placeholder="Finance amount"
                                  style={{ border: 'none', outline: 'none', flex: 1, fontSize: 13, color: '#262626', fontFamily: 'inherit', background: 'transparent' }}
                                />
                              </div>
                              <span style={{
                                fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20, whiteSpace: 'nowrap',
                                background: routingPath === 'full' ? '#262626' : '#f0f0f0',
                                color: routingPath === 'full' ? 'white' : '#525252',
                                border: '1px solid', borderColor: routingPath === 'full' ? '#262626' : '#e5e5e5',
                              }}>
                                {routingPath === 'full' ? 'Full Financing' : 'Standard'}
                              </span>
                            </div>
                            <div style={{ height: 1, background: '#f0f0f0' }} />
                          </>
                        )}

                        {/* Document Checklist */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Required Documents</div>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                            background: allVerified ? '#262626' : '#f0f0f0',
                            color: allVerified ? 'white' : '#737373' }}>
                            {verifiedCount} / {activeDocList.length}
                          </span>
                        </div>
                        {activeDocList.map(docName => {
                          const status = docStatuses[docName] || 'pending'
                          const sc = statusColor(status)
                          const docObj = card.documents.find(d => d.name === docName)
                          return (
                            <button key={docName}
                              onClick={() => { if (docObj) { setSelectedDoc(docObj); setActiveTab('documents') } }}
                              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10,
                                border: '1.5px solid', borderColor: sc.bg === '#fafafa' ? '#f0f0f0' : sc.bg,
                                background: 'white', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                              <span style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${sc.color}`,
                                background: (status === 'ai_verified' || status === 'verified' || status === 'verification_failed') ? sc.color : 'transparent',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                fontSize: 9, color: 'white', fontWeight: 700 }}>
                                {(status === 'ai_verified' || status === 'verified') && '✓'}
                                {status === 'verification_failed' && '!'}
                              </span>
                              <span style={{ fontSize: 12, flex: 1, color: '#262626', textAlign: 'left' }}>{docName}</span>
                              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.color, whiteSpace: 'nowrap' }}>
                                {STATUS_LABELS[status] || status}
                              </span>
                            </button>
                          )
                        })}

                        {allVerified && (
                          <div style={{ padding: '8px 12px', borderRadius: 10, background: '#f0f0f0', border: '1px solid #e5e5e5', fontSize: 12, fontWeight: 600, color: '#262626' }}>
                            ✓ All documents received — ready to advance to Credit Review
                          </div>
                        )}
                      </div>
                    )}

                    {/* CREDIT — credit_review */}
                    {cardStage === 'credit_review' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                        {/* Credit summary card */}
                        <div style={{ borderRadius: 14, border: '1.5px solid #e5e5e5', background: '#fafafa', overflow: 'hidden' }}>
                          <div style={{ padding: '12px 14px', borderBottom: '1px solid #f0f0f0' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Credit Summary</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
                              <div>
                                <div style={{ fontSize: 10, color: '#a3a3a3', fontWeight: 600 }}>Requested Amount</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#171717' }}>{formatSAR(card.amount)}</div>
                              </div>
                              {buyerInfo && (
                                <div>
                                  <div style={{ fontSize: 10, color: '#a3a3a3', fontWeight: 600 }}>Buyer Remaining Limit</div>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: isAboveLimit ? '#dc2626' : '#171717' }}>{formatSAR(remainingCredit)}</div>
                                </div>
                              )}
                              {card.tenure > 0 && (
                                <div>
                                  <div style={{ fontSize: 10, color: '#a3a3a3', fontWeight: 600 }}>Tenor</div>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: '#171717' }}>{card.tenure}d</div>
                                </div>
                              )}
                              {card.mdrRate > 0 && (
                                <div>
                                  <div style={{ fontSize: 10, color: '#a3a3a3', fontWeight: 600 }}>MDR Rate</div>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: '#171717' }}>{card.mdrRate}%</div>
                                </div>
                              )}
                            </div>
                            {isAboveLimit && (
                              <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 11, fontWeight: 600, color: '#dc2626' }}>
                                ⚠️ Exceeds buyer limit by {formatSAR(card.amount - remainingCredit)}
                              </div>
                            )}
                          </div>
                          {/* Document access */}
                          <div style={{ padding: '10px 14px', display: 'flex', gap: 8 }}>
                            <a href="/CREDIT MODEL.xlsm" target="_blank" rel="noreferrer"
                              style={{ flex: 1, padding: '7px 0', borderRadius: 10, border: '1.5px solid #e5e5e5', background: 'white', fontSize: 11, fontWeight: 600, color: '#525252', textDecoration: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                              📊 Credit Model ↗
                            </a>
                            <button onClick={() => setShowCreditDocsModal(true)}
                              style={{ flex: 1, padding: '7px 0', borderRadius: 10, border: '1.5px solid #e5e5e5', background: 'white', fontSize: 11, fontWeight: 600, color: '#525252', cursor: 'pointer' }}>
                              🏗️ Architecture
                            </button>
                          </div>
                        </div>

                        {/* Decision section */}
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Decision</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {[
                              { value: 'approve',     label: 'Approve',           desc: 'Credit approved — proceed to agreement', icon: '✅' },
                              { value: 'reject',      label: 'Reject',            desc: 'Credit declined — move to rejected',      icon: '❌' },
                              { value: 'propose_new', label: 'Propose New Limit', desc: 'Suggest a revised credit amount',         icon: '⚖️' },
                            ].map(opt => (
                              <label key={opt.value} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 12,
                                border: `1.5px solid ${creditDecision === opt.value ? '#171717' : '#e5e5e5'}`,
                                background: creditDecision === opt.value ? '#f5f5f5' : 'white', cursor: 'pointer', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%' }}>
                                  <input type="radio" name="creditDecision" value={opt.value}
                                    checked={creditDecision === opt.value}
                                    onChange={() => setCreditDecision(opt.value)}
                                    style={{ marginTop: 2, accentColor: '#171717', flexShrink: 0 }} />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#171717' }}>{opt.icon} {opt.label}</div>
                                    <div style={{ fontSize: 11, color: '#a3a3a3', marginTop: 1 }}>{opt.desc}</div>
                                  </div>
                                </div>
                                {opt.value === 'propose_new' && creditDecision === 'propose_new' && (
                                  <input
                                    type="number" min="0"
                                    value={proposedCreditAmount}
                                    onChange={e => setProposedCreditAmount(e.target.value)}
                                    placeholder={`e.g. ${formatSAR(card.amount)}`}
                                    onClick={e => e.preventDefault()}
                                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d4d4d4', fontSize: 13, fontFamily: 'inherit', color: '#171717', outline: 'none', boxSizing: 'border-box', background: 'white', marginTop: 8 }}
                                    autoFocus
                                  />
                                )}
                              </label>
                            ))}
                          </div>
                        </div>

                      </div>
                    )}

                    {/* ONBOARDING — onboarding stage */}
                    {cardStage === 'onboarding' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                          { label: 'Transaction completion pending', done: false },
                        ].map((item, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: '1.5px solid #e5e5e5', background: 'white' }}>
                            <div style={{ width: 16, height: 16, borderRadius: 4, border: '1.5px solid #d4d4d4', background: item.done ? '#171717' : 'white', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {item.done && <span style={{ color: 'white', fontSize: 10, fontWeight: 700 }}>✓</span>}
                            </div>
                            <span style={{ fontSize: 12, color: item.done ? '#a3a3a3' : '#262626', fontWeight: 500, textDecoration: item.done ? 'line-through' : 'none' }}>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                </Section>
              )
            })()}

            {/* ── FINANCE REQUEST ── */}
            {card.type !== 'onboarding' && card.amount > 0 && cardStage !== 'doc_collection' && (() => {
              const canEditCore   = cardStage === 'credit_review' && ['credit', 'super'].includes(currentUser?.adminRole)
              const canEditFee    = cardStage === 'agreement'     && ['account_mgr', 'super'].includes(currentUser?.adminRole)
              const activeAmount  = Number(propAmount)  || card.amount
              const activeTenure  = Number(propTenure)  || card.tenure
              const activeMdr     = Number(propMdrRate) || card.mdrRate
              const hasChanges    = activeAmount !== card.amount || activeTenure !== card.tenure || activeMdr !== card.mdrRate
              const mdrFeeCalc    = activeAmount * (activeMdr / 100)
              const buyerFeeCalc  = mdrPayer === 'buyer_full' ? mdrFeeCalc : mdrPayer === 'split_50_50' ? mdrFeeCalc / 2 : 0
              const merchantMDRCalc = mdrPayer === 'merchant_full' ? mdrFeeCalc : mdrPayer === 'split_50_50' ? mdrFeeCalc / 2 : 0
              const totalRepayCalc  = activeAmount + buyerFeeCalc
              const disbursementCalc = activeAmount - merchantMDRCalc
              const emiDaysCalc   = EMI_FREQS[emiFreq]
              const instCountCalc = Math.ceil(activeTenure / emiDaysCalc)
              const perEMICalc    = totalRepayCalc / instCountCalc

              const EditableField = ({ id, label, value, original, unit, setter }) => {
                const changed = String(value) !== String(original)
                return editingField === id ? (
                  <input
                    type="number" autoFocus value={value}
                    onChange={e => setter(e.target.value)}
                    onBlur={() => setEditingField(null)}
                    onKeyDown={e => e.key === 'Enter' && setEditingField(null)}
                    style={{ width: '100%', border: 'none', borderBottom: '2px solid #525252', background: 'transparent', fontSize: 20, fontWeight: 700, color: '#262626', outline: 'none', fontFamily: 'inherit', padding: '2px 0' }}
                  />
                ) : (
                  <div
                    onClick={() => canEditCore && setEditingField(id)}
                    style={{ display: 'flex', alignItems: 'baseline', gap: 4, cursor: canEditCore ? 'pointer' : 'default', borderBottom: changed ? '2px solid #525252' : '2px solid transparent', paddingBottom: 1 }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: changed ? '#525252' : '#171717', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
                    <span style={{ fontSize: 11, color: '#525252' }}>{unit}</span>
                    {canEditCore && <span style={{ fontSize: 11, color: '#d4d4d4', marginLeft: 4 }}>✎</span>}
                  </div>
                )
              }

              return (
                <div style={{ borderRadius: 14, background: 'white', border: '1px solid #e5e5e5', borderLeft: `4px solid ${stageInfo?.color || '#525252'}`, overflow: 'hidden' }}>

                  {/* Counter-proposal banner */}
                  {counterProposal && (
                    <div style={{ padding: '10px 16px', background: '#f5f5f5', borderBottom: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14 }}>⚖️</span>
                      <span style={{ fontSize: 12, color: '#404040', flex: 1 }}>Counter-proposal by <strong>{counterProposal.by}</strong> — pending buyer acceptance</span>
                      {(currentUser?.adminRole === 'credit' || currentUser?.adminRole === 'super') && (
                        <button onClick={withdrawCounterProposal} style={{ fontSize: 11, fontWeight: 600, color: '#737373', background: 'none', border: '1px solid #d4d4d4', borderRadius: 8, padding: '3px 10px', cursor: 'pointer' }}>Withdraw</button>
                      )}
                    </div>
                  )}

                  {/* Header: Finance Request + sector/risk badges */}
                  <div style={{ padding: '12px 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.08em', flex: 1 }}>Finance Request</span>
                    <span style={{ fontSize: 11, color: '#525252' }}>{card.sector}</span>
                    {card.riskScore !== null && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: riskColor(card.riskScore).bg, color: riskColor(card.riskScore).text }}>
                        Risk {card.riskScore}
                      </span>
                    )}
                  </div>

                  {/* Headline: Amount / Tenure / MDR */}
                  <div style={{ padding: '10px 16px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Amount</div>
                      <EditableField id="amount" value={propAmount || card.amount} original={card.amount} unit="SAR" setter={v => setPropAmount(v)} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Tenure</div>
                      <EditableField id="tenure" value={propTenure || card.tenure} original={card.tenure} unit="days" setter={v => setPropTenure(v)} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>MDR Rate</div>
                      <EditableField id="mdr" value={propMdrRate || card.mdrRate} original={card.mdrRate} unit="% / mo" setter={v => setPropMdrRate(v)} />
                    </div>
                  </div>

                  {/* Fee Structure */}
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Fee Structure</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10, ...(!canEditFee ? { pointerEvents: 'none', opacity: 0.65 } : {}) }}>
                      {[
                        { id: 'merchant_full', label: 'Merchant Bears Full Cost',       desc: 'MDR deducted from merchant disbursement' },
                        { id: 'split_50_50',   label: 'Split 50/50 (Merchant & Buyer)', desc: 'Each party pays half the MDR' },
                        { id: 'buyer_full',    label: 'Buyer Bears Full Cost',          desc: 'Buyer repays principal + full MDR' },
                      ].map(opt => (
                        <button key={opt.id} onClick={() => { setMdrPayer(opt.id); setInvoiceGenerated(false) }}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, border: '1.5px solid', borderColor: mdrPayer === opt.id ? 'var(--color-primary)' : '#e5e5e5', background: mdrPayer === opt.id ? 'rgba(0,0,0,0.03)' : 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                          <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid', borderColor: mdrPayer === opt.id ? 'var(--color-primary)' : '#d4d4d4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {mdrPayer === opt.id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)' }} />}
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: mdrPayer === opt.id ? 'var(--color-primary)' : '#262626' }}>{opt.label}</div>
                            <div style={{ fontSize: 10, color: '#a3a3a3' }}>{opt.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 6, ...(!canEditFee ? { pointerEvents: 'none', opacity: 0.65 } : {}) }}>
                      {Object.entries(EMI_FREQ_LABELS).map(([key, lbl]) => (
                        <button key={key} onClick={() => { setEmiFreq(key); setInvoiceGenerated(false) }}
                          style={{ flex: 1, padding: '6px 0', borderRadius: 10, fontSize: 11, fontWeight: 600, border: '1.5px solid', background: emiFreq === key ? 'var(--color-primary)' : 'white', color: emiFreq === key ? 'white' : '#525252', borderColor: emiFreq === key ? 'transparent' : '#e5e5e5', cursor: 'pointer' }}>
                          {lbl}
                        </button>
                      ))}
                    </div>
                    {!canEditFee && <div style={{ fontSize: 10, color: '#a3a3a3', marginTop: 6, fontStyle: 'italic' }}>Fee structure finalised by Account Manager at approval stage.</div>}
                  </div>

                  {/* Deal Outcomes */}
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Deal Outcomes</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        { label: 'Merchant MDR',   value: formatSAR(merchantMDRCalc),   color: merchantMDRCalc > 0 ? '#525252' : '#a3a3a3' },
                        { label: 'Buyer Fee',       value: formatSAR(buyerFeeCalc),      color: buyerFeeCalc > 0 ? '#737373' : '#a3a3a3' },
                        { label: 'Disbursement',    value: formatSAR(disbursementCalc),  color: '#262626' },
                        { label: 'Total Repayment', value: formatSAR(totalRepayCalc),    color: '#171717' },
                      ].map(row => (
                        <div key={row.label} style={{ padding: '8px 10px', borderRadius: 10, background: '#f5f5f5', border: '1px solid #f1f5f9' }}>
                          <div style={{ fontSize: 10, color: '#a3a3a3', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{row.label}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: row.color, fontVariantNumeric: 'tabular-nums' }}>{row.value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 8, background: '#f5f5f5', fontSize: 12, color: '#525252' }}>
                      Per instalment: <strong style={{ color: '#262626' }}>{formatSAR(perEMICalc)}</strong> × {instCountCalc}
                    </div>
                  </div>

                  {/* Repayment Schedule */}
                  <div>
                    <div style={{ padding: '10px 16px 6px', fontSize: 10, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Repayment Schedule</div>
                    <div className="grid grid-cols-4 border-b border-slate-100">
                      {[
                        { label: 'Total',   value: instCountCalc,                                                        danger: false },
                        { label: 'Paid',    value: 0,                                                      danger: false },
                        { label: 'Pending', value: Math.max(0, instCountCalc - 0 - 0),   danger: false },
                        { label: 'Overdue', value: 0,                                                   danger: true  },
                      ].map((stat, i) => (
                        <div key={stat.label} className={`px-4 py-2.5 text-center ${i < 3 ? 'border-r border-slate-100' : ''}`}>
                          <div className={`text-[18px] font-bold ${stat.danger && stat.value > 0 ? 'text-slate-500' : 'text-slate-800'}`}>{stat.value}</div>
                          <div className="text-[10px] text-slate-400">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-50" style={{ background: '#f5f5f5' }}>
                          {['No.','Due Date','Amount','Status'].map((h, i) => (
                            <th key={h} className={`px-4 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wide ${i >= 2 ? 'text-end' : 'text-start'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: instCountCalc }, (_, i) => {
                          const dueMs = new Date('2026-06-01').getTime() + (i + 1) * emiDaysCalc * 86400000
                          const dueDate = new Date(dueMs).toISOString().slice(0, 10)
                          const isPaid    = i < 0
                          const isOverdue = !isPaid && i < 0 + 0
                          return (
                            <tr key={i} className="border-b border-slate-50 last:border-0">
                              <td className="px-4 py-2.5 text-[12px] text-slate-400">{i + 1}</td>
                              <td className="px-4 py-2.5 text-[12px] text-slate-600">{dueDate}</td>
                              <td className="px-4 py-2.5 text-[12px] text-end tabular-nums font-medium text-slate-700">{formatSAR(perEMICalc)}</td>
                              <td className="px-4 py-2.5 text-end">
                                {isPaid ? <span className="text-[11px] font-semibold text-slate-600">✓ Paid</span>
                                  : isOverdue ? <span className="text-[11px] font-semibold text-slate-500">Overdue</span>
                                  : <span className="text-[11px] text-slate-400">Pending</span>}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Submit counter-proposal (only when values changed, risk stage) */}
                  {canEditCore && hasChanges && !counterProposal && (
                    <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e5e5', background: '#f5f5f5', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: '#404040', flex: 1 }}>Changes detected — submit as counter-proposal?</span>
                      <button onClick={submitCounterProposal} style={{ padding: '6px 14px', borderRadius: 10, background: '#525252', border: 'none', fontSize: 12, fontWeight: 700, color: 'white', cursor: 'pointer' }}>
                        ⚖️ Submit Counter-Proposal
                      </button>
                      <button onClick={() => { setPropAmount(String(card.amount)); setPropTenure(String(card.tenure)); setPropMdrRate(String(card.mdrRate)) }}
                        style={{ padding: '6px 12px', borderRadius: 10, background: 'none', border: '1.5px solid #e5e5e5', fontSize: 12, fontWeight: 600, color: '#525252', cursor: 'pointer' }}>
                        Reset
                      </button>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* CONTRACTS (agreement stage, account_mgr/super only) */}
            {cardStage === 'agreement' && (currentUser?.adminRole === 'account_mgr' || currentUser?.adminRole === 'super') && (() => {
              const mandatorySent = contracts.filter(c => c.mandatory && (c.status === 'Sent' || c.status === 'Signed')).length
              const mandatoryTotal = AGREEMENT_MANDATORY_CONTRACTS.length
              return (
              <Section title="Contracts" badge={`${mandatorySent} / ${mandatoryTotal} required sent`} badgeColor={mandatorySent === mandatoryTotal ? '#16a34a' : '#737373'}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {contracts.map(c => {
                    const statusColor = { Draft: '#a3a3a3', Sent: '#525252', Signed: '#262626' }
                    return (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, border: `1px solid ${c.mandatory ? '#e2e8f0' : '#f1f5f9'}`, background: c.mandatory ? '#fafafa' : 'white' }}>
                        <span style={{ fontSize: 16 }}>📄</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#262626' }}>{c.name}</span>
                            {c.mandatory && (
                              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: '#f0f0f0', color: '#737373', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Required</span>
                            )}
                          </div>
                          <div style={{ fontSize: 10, color: '#a3a3a3' }}>
                            {c.mandatory ? 'Mandatory — must be sent before proceeding' : `Added by ${c.addedBy} · ${c.addedAt}`}
                          </div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: statusColor[c.status] + '18', color: statusColor[c.status] }}>{c.status}</span>
                        {c.status === 'Draft' && (
                          <button onClick={() => sendContract(c.id)} style={{ padding: '4px 12px', borderRadius: 8, background: 'var(--color-primary)', border: 'none', fontSize: 11, fontWeight: 700, color: 'white', cursor: 'pointer' }}>Send →</button>
                        )}
                      </div>
                    )
                  })}
                  {contracts.length === 0 && <div style={{ fontSize: 12, color: '#a3a3a3', fontStyle: 'italic' }}>No contracts added yet.</div>}
                  {/* Add Contract */}
                  {showContractAdd ? (
                    <div style={{ padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f5f5f5', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {['template', 'upload'].map(m => (
                          <button key={m} onClick={() => setContractMode(m)} style={{ padding: '4px 14px', borderRadius: 8, border: '1.5px solid', borderColor: contractMode === m ? 'var(--color-primary)' : '#e5e5e5', background: contractMode === m ? 'rgba(0,0,0,0.03)' : 'white', fontSize: 11, fontWeight: 600, color: contractMode === m ? 'var(--color-primary)' : '#64748b', cursor: 'pointer' }}>
                            {m === 'template' ? '📋 From Template' : '📎 Upload'}
                          </button>
                        ))}
                        <button onClick={() => setShowContractAdd(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#a3a3a3', fontSize: 16 }}>×</button>
                      </div>
                      {contractMode === 'template' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {availableTemplates.map(t => (
                            <button key={t.id} onClick={() => setSelectedTpl(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: '1.5px solid', borderColor: selectedTpl === t.id ? 'var(--color-primary)' : '#e5e5e5', background: selectedTpl === t.id ? 'rgba(0,0,0,0.03)' : 'white', cursor: 'pointer', textAlign: 'left' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#262626' }}>{t.label}</div>
                                <div style={{ fontSize: 10, color: '#a3a3a3' }}>{t.desc}</div>
                              </div>
                              {selectedTpl === t.id && <span style={{ color: 'var(--color-primary)', fontSize: 13 }}>✓</span>}
                            </button>
                          ))}
                          <button onClick={addContractFromTemplate} disabled={!selectedTpl} style={{ alignSelf: 'flex-start', padding: '6px 16px', borderRadius: 10, background: selectedTpl ? 'var(--color-primary)' : '#e5e5e5', border: 'none', fontSize: 12, fontWeight: 700, color: selectedTpl ? 'white' : '#94a3b8', cursor: selectedTpl ? 'pointer' : 'default' }}>
                            Add from Template
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input value={uploadName} onChange={e => setUploadName(e.target.value)} placeholder="Contract name…" style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
                          <button onClick={addContractManual} disabled={!uploadName.trim()} style={{ padding: '6px 14px', borderRadius: 10, background: uploadName.trim() ? 'var(--color-primary)' : '#e5e5e5', border: 'none', fontSize: 12, fontWeight: 700, color: uploadName.trim() ? 'white' : '#94a3b8', cursor: uploadName.trim() ? 'pointer' : 'default' }}>
                            Add
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button onClick={() => setShowContractAdd(true)} style={{ alignSelf: 'flex-start', padding: '6px 14px', borderRadius: 10, border: '1.5px dashed #e2e8f0', background: 'white', fontSize: 12, fontWeight: 600, color: '#525252', cursor: 'pointer' }}>
                      + Add Contract
                    </button>
                  )}
                </div>
              </Section>
            )
          })()}

            {/* (Finance Model section removed — merged into Finance Request chunk above) */}
            {false && (() => {
              return (
                <Section title="Finance Model (deprecated)">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Fee Sharing + EMI Frequency */}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      {/* Fee sharing */}
                      <div style={{ flex: 1, minWidth: 200, ...lockStyle }}>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Fee Sharing Model</div>
                        <div className="space-y-1.5">
                          {[
                            { id: 'merchant_full', label: 'Merchant Bears Full Cost',       desc: 'MDR deducted from disbursement' },
                            { id: 'split_50_50',   label: 'Split 50/50 (Merchant & Buyer)', desc: 'Each party pays half the MDR' },
                            { id: 'buyer_full',    label: 'Buyer Bears Full Cost',          desc: 'Buyer repays principal + full MDR' },
                          ].map(opt => (
                            <button key={opt.id} onClick={() => { setMdrPayer(opt.id); setInvoiceGenerated(false) }}
                              className="w-full text-start p-2.5 rounded-xl border transition-all"
                              style={{ borderColor: mdrPayer === opt.id ? 'var(--color-primary)' : '#e5e5e5', background: mdrPayer === opt.id ? 'rgba(0,0,0,0.03)' : 'white' }}>
                              <div className="flex items-center gap-2">
                                <div className="w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center"
                                  style={{ borderColor: mdrPayer === opt.id ? 'var(--color-primary)' : '#d4d4d4' }}>
                                  {mdrPayer === opt.id && <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-primary)' }} />}
                                </div>
                                <span className="text-[11px] font-semibold" style={{ color: mdrPayer === opt.id ? 'var(--color-primary)' : '#334155' }}>{opt.label}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5 ml-5">{opt.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* EMI Frequency */}
                      <div style={{ flex: '0 0 160px', ...lockStyle }}>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">EMI Frequency</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {Object.entries(EMI_FREQ_LABELS).map(([key, lbl]) => (
                            <button key={key} onClick={() => { setEmiFreq(key); setInvoiceGenerated(false) }}
                              className="py-2 rounded-xl text-[11px] font-semibold border transition-all"
                              style={{ background: emiFreq === key ? 'var(--color-primary)' : 'white', color: emiFreq === key ? 'white' : '#64748b', borderColor: emiFreq === key ? 'transparent' : '#e5e5e5' }}>
                              {lbl}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary — compact 2-col grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        { label: 'Merchant MDR',   value: formatSAR(merchantMDR),          color: merchantMDR > 0 ? '#525252' : '#a3a3a3' },
                        { label: 'Buyer Fee',       value: formatSAR(buyerFee),             color: buyerFee > 0 ? '#737373' : '#a3a3a3' },
                        { label: 'Disbursement',    value: formatSAR(merchantDisbursement), color: '#262626' },
                        { label: 'Total Repayment', value: formatSAR(totalBuyerRepayment),  color: '#262626' },
                      ].map(row => (
                        <div key={row.label} style={{ padding: '10px 12px', borderRadius: 10, background: 'white', border: '1px solid #f1f5f9' }}>
                          <div style={{ fontSize: 10, color: '#a3a3a3', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{row.label}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: row.color, fontVariantNumeric: 'tabular-nums' }}>{row.value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: '8px 12px', borderRadius: 10, background: 'white', border: '1px solid #f1f5f9', fontSize: 12, color: '#525252' }}>
                      Per EMI: <strong style={{ color: '#262626' }}>{formatSAR(perEMI)}</strong> × {instalmentCount} instalments
                    </div>

                    {/* Instalment Schedule */}
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Instalment Schedule</div>
                      <div className="rounded-xl border border-slate-100 overflow-hidden bg-white">
                        <div className="grid grid-cols-4 border-b border-slate-100">
                          {[
                            { label: 'Total',   value: instalmentCount,                                                         danger: false },
                            { label: 'Paid',    value: 0,                                                         danger: false },
                            { label: 'Pending', value: Math.max(0, instalmentCount - 0 - 0),     danger: false },
                            { label: 'Overdue', value: 0,                                                      danger: true  },
                          ].map((stat, i) => (
                            <div key={stat.label} className={`px-4 py-3 text-center ${i < 3 ? 'border-r border-slate-100' : ''}`}>
                              <div className={`text-[20px] font-bold ${stat.danger && stat.value > 0 ? 'text-slate-500' : 'text-slate-800'}`}>{stat.value}</div>
                              <div className="text-[10px] text-slate-400">{stat.label}</div>
                            </div>
                          ))}
                        </div>
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-50" style={{ background: '#f5f5f5' }}>
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
                              const isPaid    = i < 0
                              const isOverdue = !isPaid && i < 0 + 0
                              return (
                                <tr key={i} className="border-b border-slate-50 last:border-0">
                                  <td className="px-4 py-2.5 text-[12px] text-slate-400">{i + 1}</td>
                                  <td className="px-4 py-2.5 text-[12px] text-slate-600">{dueDate}</td>
                                  <td className="px-4 py-2.5 text-[12px] text-end tabular-nums font-medium text-slate-700">{formatSAR(perEMI)}</td>
                                  <td className="px-4 py-2.5 text-end">
                                    {isPaid ? <span className="text-[11px] font-semibold text-slate-600">✓ Paid</span>
                                      : isOverdue ? <span className="text-[11px] font-semibold text-slate-500">Overdue</span>
                                      : <span className="text-[11px] text-slate-400">Pending</span>}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {!canEditModel && <div style={{ fontSize: 11, color: '#a3a3a3', fontStyle: 'italic' }}>Fee structure is finalised by the Account Manager.</div>}
                  </div>
                </Section>
              )
            })()}

          </div>
          )} {/* end overview tab */}

          </div>{/* end scroll container */}
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



      {/* SUPPORTING DOCS VIEWER */}
      {showCreditDocsModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)' }}
          onClick={() => setShowCreditDocsModal(false)}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: 660, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Obligor Rating Model Design</div>
                <div style={{ fontSize: 11, color: '#737373', marginTop: 2 }}>Financial Ratios Assessment</div>
              </div>
              <button onClick={() => setShowCreditDocsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#a3a3a3', lineHeight: 1, flexShrink: 0 }}>✕</button>
            </div>

            {/* Architecture diagram */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28, padding: '20px 16px', border: '1.5px dashed #d4d4d4', borderRadius: 14, background: '#fafafa', overflowX: 'auto' }}>

              {/* Column 1: Input factors */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, flexShrink: 0 }}>
                {/* Financial Risk inputs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {['Financial Operations', 'Debt Coverage', 'Liquidity', 'Leverage'].map(f => (
                    <div key={f} style={{ padding: '6px 12px', background: '#d4d4d4', borderRadius: 4, fontSize: 11, fontWeight: 700, color: '#171717', whiteSpace: 'nowrap', textAlign: 'center' }}>{f}</div>
                  ))}
                </div>
                {/* QA inputs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {['Status', 'Conduct', 'Industry'].map(f => (
                    <div key={f} style={{ padding: '6px 12px', background: '#d4d4d4', borderRadius: 4, fontSize: 11, fontWeight: 700, color: '#171717', whiteSpace: 'nowrap', textAlign: 'center' }}>{f}</div>
                  ))}
                </div>
              </div>

              {/* Connector lines col 1→2 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center', padding: '0 8px', flexShrink: 0 }}>
                <div style={{ width: 32, height: 1, background: '#a3a3a3' }} />
                <div style={{ width: 32, height: 1, background: '#a3a3a3' }} />
              </div>

              {/* Column 2: Intermediate */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, flexShrink: 0 }}>
                <div style={{ padding: '10px 18px', background: '#6b8fbd', color: 'white', borderRadius: 6, fontSize: 12, fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>Financial Risk (FR)</div>
                <div style={{ padding: '10px 18px', background: '#6b8fbd', color: 'white', borderRadius: 6, fontSize: 12, fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>Qualitative Analysis (QA)</div>
              </div>

              {/* Connector lines col 2→3 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center', padding: '0 8px', flexShrink: 0 }}>
                <div style={{ width: 32, height: 1, background: '#a3a3a3' }} />
                <div style={{ width: 32, height: 1, background: '#a3a3a3' }} />
              </div>

              {/* Column 3: Final */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0, alignItems: 'flex-start' }}>
                <div style={{ padding: '8px 16px', background: '#4a80b8', color: 'white', borderRadius: 6, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>Owner's Additional Support</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 24, height: 1, background: '#a3a3a3' }} />
                  <div style={{ padding: '10px 18px', background: '#525252', color: 'white', borderRadius: 6, fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>Final Obligor Rating</div>
                </div>
              </div>

            </div>

            {/* Summary Risk Score Sheet table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ padding: '9px 14px', background: '#4a80b8', color: 'white', textAlign: 'left', fontWeight: 700, borderRadius: '6px 0 0 0' }}>Summary Risk Score Sheet</th>
                  <th style={{ padding: '9px 14px', background: '#4a80b8', color: 'white', textAlign: 'center', fontWeight: 700, borderRadius: '0 6px 0 0' }}>Final Score</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Financial Risk Score',                  value: '90',   style: 'normal' },
                  { label: 'Status of Account Risk Score',          value: '578',  style: 'normal' },
                  { label: 'Conduct of Account Risk Score',         value: '470',  style: 'normal' },
                  { label: 'Industry Risk Score',                   value: '278',  style: 'normal' },
                  { label: 'Total Obligor Risk Score (ORS)',        value: '286',  style: 'bold' },
                  { label: 'Intermediate Rating Grade',             value: '4.0',  style: 'bold' },
                  { label: "Owner's Additional Support Notch Up",   value: '1.0',  style: 'bold' },
                  { label: 'Final Rating Grade',                    value: '3.0',  style: 'bold' },
                  { label: 'Override Grade',                        value: '3',    style: 'pink' },
                  { label: 'Override Reason',                       value: 'Yes',  style: 'pink' },
                  { label: 'Final Grade (After Override, if any)',  value: '3.0',  style: 'bold' },
                ].map(({ label, value, style }, i) => (
                  <tr key={label} style={{
                    background: style === 'pink' ? '#fce4e4' : style === 'bold' ? '#d4d4d4' : i % 2 === 0 ? 'white' : '#f9f9f9',
                    borderBottom: '1px solid #e5e5e5',
                  }}>
                    <td style={{ padding: '7px 14px', fontWeight: style !== 'normal' ? 700 : 400, color: style === 'pink' ? '#dc2626' : '#171717' }}>{label}</td>
                    <td style={{ padding: '7px 14px', textAlign: 'center', fontWeight: style !== 'normal' ? 700 : 400, color: style === 'pink' ? '#dc2626' : '#171717' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)' }}
          onClick={() => { if (!uploadLoading) { setShowUploadModal(false); setUploadFile(null) } }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: 440, maxWidth: '90vw', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#171717' }}>Upload Document</span>
              <button onClick={() => { setShowUploadModal(false); setUploadFile(null) }} disabled={uploadLoading}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#a3a3a3', lineHeight: 1 }}>✕</button>
            </div>

            {/* Document type selector */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#737373', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Document Type</div>
              <select
                value={uploadDocName}
                onChange={e => setUploadDocName(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid #e5e5e5', fontSize: 13, fontFamily: 'inherit', color: uploadDocName ? '#171717' : '#a3a3a3', outline: 'none', background: 'white', cursor: 'pointer' }}>
                <option value="">Select document…</option>
                {card.documents.map(doc => {
                  const st = docStatuses[doc.name] || doc.status
                  return (
                    <option key={doc.name} value={doc.name}>
                      {doc.name} — {STATUS_LABELS[st] || st}
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Drag-drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setUploadDragging(true) }}
              onDragLeave={() => setUploadDragging(false)}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setUploadFile(f); setUploadDragging(false) }}
              style={{
                border: `2px dashed ${uploadDragging ? 'var(--color-primary)' : '#d4d4d4'}`,
                borderRadius: 14, padding: '28px 20px', textAlign: 'center', marginBottom: 20,
                background: uploadDragging ? 'rgba(var(--color-primary-rgb,144,132,253),0.04)' : uploadFile ? '#f0fdf4' : '#fafafa',
                transition: 'all 0.15s',
              }}>
              {uploadFile ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24 }}>📄</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#171717' }}>{uploadFile.name}</div>
                    <div style={{ fontSize: 11, color: '#a3a3a3' }}>{(uploadFile.size / 1024).toFixed(1)} KB</div>
                  </div>
                  <button onClick={() => setUploadFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a3a3a3', fontSize: 16, marginLeft: 8 }}>✕</button>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>☁</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#525252', marginBottom: 4 }}>Drag & drop file here</div>
                  <div style={{ fontSize: 12, color: '#a3a3a3', marginBottom: 12 }}>or</div>
                  <label style={{ padding: '7px 18px', borderRadius: 20, border: '1.5px solid #e5e5e5', background: 'white', fontSize: 12, fontWeight: 600, color: '#525252', cursor: 'pointer' }}>
                    Browse files
                    <input type="file" style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; if (f) setUploadFile(f) }} />
                  </label>
                </>
              )}
            </div>

            {/* Footer buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowUploadModal(false); setUploadFile(null) }} disabled={uploadLoading}
                style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: '1.5px solid #e5e5e5', background: 'white', fontSize: 13, fontWeight: 600, color: '#525252', cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                disabled={!uploadDocName || !uploadFile || uploadLoading}
                onClick={() => {
                  setUploadLoading(true)
                  setTimeout(() => {
                    handleDocStatusChange(uploadDocName, 'ai_verified')
                    setTimeline(prev => [...prev, {
                      id: `upload-${Date.now()}`, type: 'history', icon: '📎',
                      text: `${uploadDocName} uploaded and AI verified.`,
                      date: new Date().toLocaleString('en-SA', { dateStyle: 'short', timeStyle: 'short' }),
                    }])
                    const docObj = card.documents.find(d => d.name === uploadDocName)
                    if (docObj) { setSelectedDoc(docObj); setActiveTab('documents') }
                    setShowUploadModal(false)
                    setUploadFile(null)
                    setUploadDocName('')
                    setUploadLoading(false)
                  }, 1200)
                }}
                style={{
                  flex: 2, padding: '10px 0', borderRadius: 12, border: 'none',
                  background: uploadDocName && uploadFile ? '#171717' : '#e5e5e5',
                  fontSize: 13, fontWeight: 700,
                  color: uploadDocName && uploadFile ? 'white' : '#a3a3a3',
                  cursor: uploadDocName && uploadFile ? 'pointer' : 'default',
                }}>
                {uploadLoading ? 'Uploading…' : 'Upload →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION BAR — full width */}
      <div style={{
        background: 'rgba(248,250,252,0.97)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid #e2e8f0',
        padding: '10px 24px',
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flexShrink: 0,
      }}>
        {/* Lane navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={onPrevInLane} disabled={laneIdx <= 0}
            className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span style={{ fontSize: 11, color: '#525252', whiteSpace: 'nowrap' }}>
            {laneTotal === 1
              ? <span>Only ticket in <strong style={{ color: '#262626' }}>{laneLabel}</strong></span>
              : <><strong style={{ color: '#262626' }}>{(laneIdx ?? 0) + 1}</strong> / {laneTotal} in <strong style={{ color: '#262626' }}>{laneLabel}</strong></>
            }
          </span>
          <button onClick={onNextInLane} disabled={laneIdx >= laneTotal - 1}
            className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

        <span style={{ width: 1, height: 18, background: '#e5e5e5', flexShrink: 0 }} />

        {/* Primary action (stage-specific, role-gated) */}
        {cardStage === 'credit_review' && creditDecision && (
          <>
            <button onClick={() => setCreditDecision(null)}
              style={{ padding: '7px 16px', borderRadius: 20, border: '1.5px solid #e5e5e5', background: 'white', fontSize: 13, fontWeight: 600, color: '#525252', cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              onClick={handleConfirmCreditDecision}
              disabled={creditDecision === 'propose_new' && !Number(proposedCreditAmount)}
              style={{
                padding: '7px 20px', borderRadius: 20, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: creditDecision === 'propose_new' && !Number(proposedCreditAmount) ? '#e5e5e5' : '#171717',
                color:      creditDecision === 'propose_new' && !Number(proposedCreditAmount) ? '#a3a3a3' : 'white',
                boxShadow:  creditDecision === 'propose_new' && !Number(proposedCreditAmount) ? 'none' : '0 2px 8px rgba(0,0,0,0.18)',
              }}>
              Confirm Decision
            </button>
          </>
        )}
        {canPrimary && primaryAction && (
          <button onClick={handlePrimaryAction} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 18px', borderRadius: 20,
            background: stageInfo?.color || '#6b7280', border: 'none',
            fontSize: 13, fontWeight: 700, color: 'white', cursor: 'pointer',
            boxShadow: `0 2px 8px ${stageInfo?.color || '#6b7280'}44`,
          }}>
            {primaryAction.label}
          </button>
        )}


        <span style={{ fontSize: 11, color: '#a3a3a3', marginLeft: 'auto' }}>
          {stageInfo?.auto
            ? <><strong style={{ color: 'var(--color-primary)' }}>✦ Yumnai</strong></>
            : <>Assigned: <strong style={{ color: '#404040' }}>{assignedTo}</strong></>
          }
        </span>
      </div>
    </div>
  )
}

// ── New Ticket Modal ──────────────────────────────────────────────────────────

const SECTORS = ['ICT', 'Consumer Staples', 'Manufacturing', 'Consumer Discretionary', 'HealthCare', 'FMCG']

function NewTicketModal({ currentUser, cards, onClose, onAdd }) {
  const [step, setStep] = useState(1)

  // Step 1
  const [clientType, setClientType] = useState('buyer')
  const [businessName, setBusinessName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')

  // Step 2
  const [sellerId, setSellerId] = useState(MOCK_SELLERS[0]?.id || '')
  const [sector, setSector] = useState('')
  const [amount, setAmount] = useState('')

  // Step 3 — documents (tracks uploaded filenames per doc)
  const [docFiles, setDocFiles] = useState({})

  // empty amount → assume max tier so we collect all possible docs
  const docList    = getDocChecklist(clientType, amount ? Number(amount) : 999999)
  const documents  = docList.map(name => ({ name, status: docFiles[name] ? 'received' : 'pending' }))
  const receivedDocs = documents.filter(d => d.status === 'received')
  const missingDocs  = documents.filter(d => d.status !== 'verified').map(d => d.name)

  const step1Valid = businessName.trim() && contactPerson.trim() && contactEmail.trim()
  const step2Valid = sector.trim()
  const canCreate  = step1Valid && step2Valid

  const handleFileUpload = (name, file) => {
    if (file) setDocFiles(prev => ({ ...prev, [name]: file.name }))
  }
  const handleRemoveFile = (name) => {
    setDocFiles(prev => { const next = { ...prev }; delete next[name]; return next })
  }

  const linkedSeller = MOCK_SELLERS.find(s => s.id === sellerId)

  const handleCreate = () => {
    const nextId = Math.max(0, ...cards.map(c => parseInt(c.id.replace('OR-', '')) || 0)) + 1
    const today  = new Date().toISOString().slice(0, 10)
    const newCard = {
      id: `OR-${String(nextId).padStart(4, '0')}`,
      type: 'onboarding',
      seller: clientType === 'merchant' ? businessName : (linkedSeller?.name || ''),
      sellerId: clientType === 'merchant' ? null : sellerId,
      buyer: clientType === 'buyer' ? businessName : null,
      buyerId: null,
      amount: clientType === 'merchant' ? 0 : (Number(amount) || 0),
      mdrRate: null,
      stage: 'doc_collection',
      daysInStage: 0,
      riskScore: null,
      assignedTo: currentUser.name,
      sector,
      tenure: null,
      emiFrequency: null,
      documents,
      contracts: [],
      correspondence: [{
        from: 'System',
        message: `Ticket created by ${currentUser.name}. ${missingDocs.length > 0 ? `${missingDocs.length} document(s) still needed.` : 'All documents confirmed.'}`,
        time: `${today} · System`,
        autoRead: true,
      }],
      yumnaiSuggestion: {
        action: missingDocs.length > 0 ? 'request_document' : 'monitor',
        message: missingDocs.length > 0
          ? `${missingDocs.length} required document(s) missing for ${businessName}. Send a document request to get them in.`
          : `${businessName} documents are all confirmed. Advance to document checking when ready.`,
        draftText: missingDocs.length > 0
          ? `Dear ${contactPerson},\n\nTo process your finance request, we still need the following documents:\n${missingDocs.map(d => `• ${d}`).join('\n')}\n\nPlease provide these at your earliest convenience.\n\nYumna Finance Team`
          : '',
      },
      clientType,
      contactPerson, contactEmail, contactPhone,
      createdAt: today, createdBy: currentUser.name,
      proposedAmount: null, proposedTenure: null, proposedMdrRate: null,
      counterProposedBy: null, counterProposedAt: null,
    }
    onAdd(newCard)
  }

  const inputCls = 'w-full px-3 py-2 rounded-xl border text-[13px] outline-none bg-white'
  const inputStyle = { borderColor: '#e5e5e5' }

  const steps = ['Client & Contact', 'Business Details', 'Documents']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between shrink-0">
          <div>
            <div className="text-[15px] font-bold text-slate-800">New Ticket</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{steps[step - 1]}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4 flex items-center gap-2 shrink-0">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all"
                  style={{ background: step > i + 1 ? '#262626' : step === i + 1 ? 'var(--color-primary)' : '#f0f0f0', color: step >= i + 1 ? 'white' : '#a3a3a3' }}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className="text-[11px] font-medium" style={{ color: step === i + 1 ? 'var(--color-primary)' : step > i + 1 ? '#525252' : '#a3a3a3' }}>{s}</span>
              </div>
              {i < steps.length - 1 && <div className="w-6 h-px" style={{ background: step > i + 1 ? '#262626' : '#e5e5e5' }} />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* ── Step 1 ── */}
          {step === 1 && (
            <>
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Client Type</div>
                <div className="flex gap-2">
                  {[{ id: 'buyer', label: 'Buyer' }, { id: 'merchant', label: 'Merchant' }].map(opt => (
                    <button key={opt.id} onClick={() => setClientType(opt.id)}
                      className="flex-1 py-2 rounded-xl border text-[13px] font-semibold transition-all"
                      style={{ borderColor: clientType === opt.id ? 'var(--color-primary)' : '#e5e5e5', background: clientType === opt.id ? 'rgba(0,0,0,0.03)' : 'white', color: clientType === opt.id ? 'var(--color-primary)' : '#525252' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Business Name *</div>
                <input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder={clientType === 'buyer' ? 'e.g. Al-Noor Trading Co.' : 'e.g. Zahrani Group'}
                  className={inputCls} style={inputStyle} />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Contact Person *</div>
                <input value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="Full name"
                  className={inputCls} style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Email *</div>
                  <input value={contactEmail} onChange={e => setContactEmail(e.target.value)} type="email" placeholder="contact@example.com"
                    className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Phone</div>
                  <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+966 5x xxx xxxx"
                    className={inputCls} style={inputStyle} />
                </div>
              </div>
            </>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <>
              {clientType === 'buyer' && (
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Linked Seller *</div>
                  <select value={sellerId} onChange={e => setSellerId(e.target.value)} className={inputCls} style={inputStyle}>
                    {MOCK_SELLERS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Sector *</div>
                <select value={sector} onChange={e => setSector(e.target.value)} className={inputCls} style={inputStyle}>
                  <option value="">Select sector…</option>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {clientType === 'buyer' && (
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Finance Amount (SAR)</div>
                  <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="Optional — determines document tier"
                    className={inputCls} style={inputStyle} />
                  <div className="text-[10px] text-slate-400 mt-1">Leave blank to collect the full document set</div>
                </div>
              )}
            </>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <>
              <div className="flex items-center justify-between mb-1">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Required Documents</div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: receivedDocs.length === docList.length ? '#262626' : '#f0f0f0', color: receivedDocs.length === docList.length ? 'white' : '#525252' }}>
                  {receivedDocs.length} / {docList.length} uploaded
                </span>
              </div>
              <div className="space-y-2">
                {docList.map(docName => {
                  const fileName = docFiles[docName]
                  const inputId = `doc-upload-${docName.replace(/\s+/g, '-')}`
                  return (
                    <div key={docName} className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                      style={{ borderColor: fileName ? '#d4d4d4' : '#f0f0f0', background: fileName ? '#fafafa' : 'white' }}>
                      {/* Status icon */}
                      <span style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid',
                        borderColor: fileName ? '#262626' : '#d4d4d4',
                        background: fileName ? '#262626' : 'transparent',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {fileName && (
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </span>
                      {/* Doc name */}
                      <span className="text-[13px] flex-1" style={{ color: fileName ? '#262626' : '#525252' }}>{docName}</span>
                      {/* Upload / filename + remove */}
                      {fileName ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-500 max-w-[120px] truncate">{fileName}</span>
                          <button onClick={() => handleRemoveFile(docName)}
                            className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
                            style={{ color: '#a3a3a3' }}>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      ) : (
                        <>
                          <input id={inputId} type="file" className="hidden"
                            onChange={e => handleFileUpload(docName, e.target.files?.[0])} />
                          <label htmlFor={inputId}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer transition-all"
                            style={{ borderColor: '#e5e5e5', color: '#525252', background: 'white' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            Upload
                          </label>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Yumnai AI analysis */}
              <div className="rounded-xl border px-4 py-3 flex gap-3 mt-2"
                style={{ background: '#fafafa', borderColor: '#e5e5e5' }}>
                <span className="text-[14px] shrink-0" style={{ color: 'var(--color-primary)' }}>✦</span>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Yumnai</div>
                  {missingDocs.length === 0 ? (
                    <p className="text-[12px] text-slate-600 leading-relaxed">All documents uploaded. Ticket is ready to submit.</p>
                  ) : (
                    <>
                      <p className="text-[12px] text-slate-600 leading-relaxed mb-2">{missingDocs.length} document{missingDocs.length > 1 ? 's' : ''} still missing:</p>
                      <ul className="space-y-0.5 mb-3">
                        {missingDocs.map(d => (
                          <li key={d} className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                            {d}
                          </li>
                        ))}
                      </ul>
                      <div className="text-[11px] text-slate-400 italic">A document request draft will be pre-loaded in the ticket.</div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-black/5 flex items-center gap-3 shrink-0">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="px-4 py-2 rounded-xl border border-black/10 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Back
            </button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)}
              disabled={step === 1 ? !step1Valid : !step2Valid}
              className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white transition-all"
              style={{ background: (step === 1 ? step1Valid : step2Valid) ? 'var(--color-primary)' : '#d4d4d4', cursor: (step === 1 ? step1Valid : step2Valid) ? 'pointer' : 'not-allowed' }}>
              Continue →
            </button>
          ) : (
            <button onClick={handleCreate} disabled={!canCreate}
              className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white transition-all"
              style={{ background: canCreate ? 'var(--color-primary)' : '#d4d4d4', cursor: canCreate ? 'pointer' : 'not-allowed' }}>
              {missingDocs.length > 0 ? 'Create & Request Missing Docs' : 'Create Ticket'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Pipeline board ────────────────────────────────────────────────────────────

export default function Pipeline({ onNavigate, onBreadcrumb }) {
  const { state, addToast } = useApp()
  const adminRole = state.currentUser?.adminRole
  const [selectedCard,    setSelectedCard]    = useState(null)

  useEffect(() => {
    onBreadcrumb?.(selectedCard ? { label: selectedCard.seller, id: selectedCard.id, onHome: () => setSelectedCard(null) } : null)
    return () => onBreadcrumb?.(null)
  }, [selectedCard])

  const [filterRole,      setFilterRole]      = useState('mine')
  const [laneActionStage, setLaneActionStage] = useState(null)
  const [cards,           setCards]           = useState(PIPELINE_CARDS)
  const [searchQuery,     setSearchQuery]     = useState('')
  const [filterAssignee,  setFilterAssignee]  = useState('')
  const [filterRiskMin,   setFilterRiskMin]   = useState('')
  const [filterRiskMax,   setFilterRiskMax]   = useState('')
  const [filterDaysMin,   setFilterDaysMin]   = useState('')
  const [showFilters,     setShowFilters]     = useState(false)
  const [showNewTicket,   setShowNewTicket]   = useState(false)

  const handleCardUpdate = (updated) => {
    setCards(prev => prev.map(c => c.id === updated.id ? updated : c))
    setSelectedCard(updated)
  }

  const handleAddCard = (newCard) => {
    setCards(prev => [newCard, ...prev])
    setShowNewTicket(false)
    if (addToast) addToast(`${newCard.id} created — now in Doc Collection.`, 'success')
  }

  const myStages = ROLE_STAGE_MAP[adminRole] || PIPELINE_STAGES.map(s => s.id)
  const currentIdx = selectedCard ? cards.findIndex(c => c.id === selectedCard.id) : -1

  const filteredCards = cards.filter(card => {
    if (card.type !== 'onboarding') return false
    const q = searchQuery.trim().toLowerCase()
    if (q && !(card.buyer || '').toLowerCase().includes(q) &&
             !(card.seller || '').toLowerCase().includes(q) &&
             !card.id.toLowerCase().includes(q)) return false
    if (filterAssignee && card.assignedTo !== filterAssignee) return false
    if (filterRiskMin !== '' && card.riskScore !== null && card.riskScore < Number(filterRiskMin)) return false
    if (filterRiskMax !== '' && card.riskScore !== null && card.riskScore > Number(filterRiskMax)) return false
    if (filterDaysMin !== '' && card.daysInStage < Number(filterDaysMin)) return false
    return true
  })

  const laneCards  = selectedCard ? filteredCards.filter(c => c.stage === selectedCard.stage) : []
  const laneIdx    = selectedCard ? laneCards.findIndex(c => c.id === selectedCard.id) : -1
  const laneLabel  = selectedCard ? (PIPELINE_STAGES.find(s => s.id === selectedCard.stage)?.label || '') : ''

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
      onPrevInLane={() => laneIdx > 0 && setSelectedCard(laneCards[laneIdx - 1])}
      onNextInLane={() => laneIdx < laneCards.length - 1 && setSelectedCard(laneCards[laneIdx + 1])}
      laneIdx={laneIdx}
      laneTotal={laneCards.length}
      laneLabel={laneLabel}
    />
  )

  const visibleStages = adminRole === 'super'
    ? PIPELINE_STAGES
    : filterRole === 'mine'
    ? PIPELINE_STAGES.filter(s => myStages.includes(s.id))
    : PIPELINE_STAGES

  const allAssignees = [...new Set(cards.map(c => c.assignedTo))].sort()
  const activeFilterCount = [filterAssignee, filterRiskMin, filterRiskMax, filterDaysMin].filter(Boolean).length
  const clearFilters = () => { setFilterAssignee(''); setFilterRiskMin(''); setFilterRiskMax(''); setFilterDaysMin('') }

  const getBuyerCredit = (buyerId) => buyerId ? MOCK_BUYERS.find(b => b.id === buyerId) || null : null
  const isAboveLimitCard = (card) => {
    const b = getBuyerCredit(card.buyerId)
    return b && card.type === 'invoice_finance' && card.amount > (b.creditLimit - b.creditUsed)
  }

  const cardsForStage = (stageId) => filteredCards.filter(c => c.stage === stageId)
  const myCardCount   = filteredCards.filter(c => myStages.includes(c.stage)).length

  const inputStyle = { border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 10px', fontSize: 12, background: 'white', outline: 'none', color: '#262626' }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search + filter bar — Row 1 */}
      <div className="px-4 py-2.5 border-b border-black/5 flex items-center gap-2.5 shrink-0 flex-wrap">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[180px] border border-black/10 rounded-lg px-3 py-1.5 bg-white/70 backdrop-blur-sm focus-within:bg-white focus-within:border-slate-300 transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke='#a3a3a3' strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search buyer, seller, or ID…"
            className="flex-1 bg-transparent outline-none text-[12px] text-slate-700 placeholder-slate-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Filters toggle */}
        <button onClick={() => setShowFilters(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all border"
          style={{
            background: showFilters ? 'rgba(0,0,0,0.03)' : '#f5f5f5',
            borderColor: showFilters ? 'rgba(0,0,0,0.1)' : '#e5e5e5',
            color: showFilters ? '#4f46e5' : '#64748b',
          }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
              style={{ background: 'var(--color-primary)' }}>{activeFilterCount}</span>
          )}
        </button>

        <div style={{ width: 1, height: 18, background: '#e5e5e5' }} />

        {/* My Lanes / All Stages */}
        {adminRole !== 'super' && (
          <button onClick={() => setFilterRole('mine')}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
            style={{ background: filterRole === 'mine' ? 'var(--color-primary)' : '#e5e5e5', color: filterRole === 'mine' ? 'white' : '#64748b' }}>
            My Lanes ({myCardCount})
          </button>
        )}
        <button onClick={() => setFilterRole('all')}
          className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
          style={{ background: filterRole === 'all' || adminRole === 'super' ? 'var(--color-primary)' : '#e5e5e5', color: filterRole === 'all' || adminRole === 'super' ? 'white' : '#64748b' }}>
          All Stages
        </button>
        <div className="ml-auto flex items-center gap-3">
          {(adminRole === 'account_mgr' || adminRole === 'super') && (
            <button onClick={() => setShowNewTicket(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-all"
              style={{ background: 'var(--color-primary)' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Ticket
            </button>
          )}
          <span className="text-[11px] text-slate-400">
            {searchQuery || activeFilterCount > 0
              ? <><strong style={{ color: '#262626' }}>{filteredCards.length}</strong> of {cards.filter(c => c.type === 'onboarding').length}</>
              : <>{cards.filter(c => c.type === 'onboarding').length} transactions</>
            }
          </span>
        </div>
      </div>

      {/* Filter panel — Row 2 (collapsible) */}
      {showFilters && (
        <div className="px-4 py-2 border-b border-slate-100 shrink-0 flex items-center gap-4 flex-wrap"
          style={{ background: '#f5f5f5' }}>
          {/* Assigned to */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Assigned to</span>
            <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} style={inputStyle}>
              <option value="">All</option>
              {allAssignees.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          {/* Risk score range */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Risk score</span>
            <input type="number" min="0" max="100" value={filterRiskMin} onChange={e => setFilterRiskMin(e.target.value)}
              placeholder="Min" style={{ ...inputStyle, width: 52 }} />
            <span className="text-[11px] text-slate-400">–</span>
            <input type="number" min="0" max="100" value={filterRiskMax} onChange={e => setFilterRiskMax(e.target.value)}
              placeholder="Max" style={{ ...inputStyle, width: 52 }} />
          </div>
          {/* Stale days */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Stale ≥</span>
            <input type="number" min="0" value={filterDaysMin} onChange={e => setFilterDaysMin(e.target.value)}
              placeholder="days" style={{ ...inputStyle, width: 56 }} />
            <span className="text-[11px] text-slate-400">days</span>
          </div>
          {/* Clear all */}
          {activeFilterCount > 0 && (
            <button onClick={clearFilters}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
              style={{ background: 'rgba(0,0,0,0.04)', color: '#737373' }}>
              Clear all
            </button>
          )}
        </div>
      )}

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
                  <span className="font-semibold text-[12px] text-slate-700 flex-1 leading-tight">
                    {stageDept[stage.id]
                      ? <><span style={{ color: '#a3a3a3', fontWeight: 500 }}>{stageDept[stage.id]} › </span>{stage.label}</>
                      : stage.label}
                  </span>
                  <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-white border border-slate-100 text-slate-500">{stageCards.length}</span>
                  {isMyLane && (
                    <button onClick={() => setLaneActionStage(laneActionStage === stage.id ? null : stage.id)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
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
                    const hasYumnai = !!card.yumnaiSuggestion.message
                    const aboveLimit = isAboveLimitCard(card)
                    const canSeeDetail = adminRole === stage.assignedRole || adminRole === 'super'
                    const verifiedCount = card.documents.filter(d => d.status === 'received').length
                    const priority = card.daysInStage >= 2 ? 'high' : card.daysInStage === 1 ? 'medium' : 'normal'
                    const priorityBorder = { high: '#ef4444', medium: '#f59e0b', normal: '#e5e5e5' }[priority]
                    const chipStyle = {
                      high:   { background: '#fee2e2', color: '#b91c1c' },
                      medium: { background: '#fef3c7', color: '#b45309' },
                      normal: { background: '#f5f5f5', color: '#737373' },
                    }[priority]
                    return (
                      <button key={card.id}
                        onClick={() => { setSelectedCard(card); setLaneActionStage(null) }}
                        className="w-full text-start bg-white rounded-2xl border p-4 hover:shadow-md transition-all"
                        style={{ borderColor: priorityBorder, borderWidth: priority !== 'normal' ? '1.5px' : '1px' }}>

                        {/* Row 1: OR number + days in stage */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[12px] font-mono font-semibold text-slate-700">{card.id}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={chipStyle}>
                            {card.daysInStage === 0 ? 'new' : `${card.daysInStage}d`}
                          </span>
                        </div>

                        {/* Row 2: Business name being onboarded */}
                        <div className="text-[13px] font-semibold text-slate-800 leading-tight mb-0.5 truncate">
                          {card.buyer || card.seller}
                        </div>

                        {/* Row 3: Sector */}
                        {card.sector && (
                          <div className="text-[11px] text-slate-400 mb-2">{card.sector}</div>
                        )}

                        {/* Row 4: Requested amount */}
                        {card.amount > 0 && (
                          <div className="text-[14px] font-bold tabular-nums text-slate-900 mb-2">{formatSAR(card.amount)}</div>
                        )}

                        {/* Row 5: Stage-specific status */}
                        <div className="mb-3" style={{ fontSize: 11, color: '#525252' }}>
                          {stage.id === 'doc_collection' && (
                            <span>{verifiedCount}/{card.documents.length} docs received{missing > 0 ? ` · ${missing} missing` : ''}</span>
                          )}
                          {stage.id === 'credit_review' && (
                            <span style={{ color: '#737373' }}>Pending credit review</span>
                          )}
                          {stage.id === 'agreement' && (
                            <span>{(card.contracts || []).length} contract{(card.contracts || []).length !== 1 ? 's' : ''} · {(card.contracts || []).filter(c => c.status === 'Signed').length} signed</span>
                          )}
                          {stage.id === 'onboarding' && (
                            <span style={{ color: '#262626' }}>Account setup in progress</span>
                          )}
                          {stage.id === 'rejected' && (
                            <span style={{ color: '#737373', fontWeight: 600 }}>✗ Rejected · {card.daysInStage}d in stage</span>
                          )}
                          {stage.id === 'closed' && (
                            <span style={{ color: '#262626', fontWeight: 600 }}>✓ Onboarding complete</span>
                          )}
                        </div>

                        {/* Row 6: Assignee + Yumnai */}
                        <div className="flex items-center justify-between">
                          {stage.auto
                            ? <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
                                style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--color-primary)' }}>
                                ✦ Yumnai
                              </span>
                            : <>
                                <span className="text-[11px] text-slate-400 truncate">👤 {card.assignedTo || '—'}</span>
                                {hasYumnai && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
                                    style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--color-primary)' }}>
                                    ✦ Yumnai
                                  </span>
                                )}
                              </>
                          }
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

      {showNewTicket && (
        <NewTicketModal
          currentUser={state.currentUser}
          cards={cards}
          onClose={() => setShowNewTicket(false)}
          onAdd={handleAddCard}
        />
      )}
    </div>
  )
}
