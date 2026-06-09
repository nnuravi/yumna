import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import {
  FINANCE_REQUESTS_STAGES, FINANCE_REQUEST_CARDS,
  INVOICE_FINANCE_STAGES, INVOICE_FINANCE_CARDS,
  MOCK_BUYERS, TEMPLATES, formatSAR,
} from '../../data/mockData'

const FR_ROLE_STAGE_MAP = {
  verifier:    ['fr_checking'],
  credit:      ['fr_credit'],
  account_mgr: ['fr_buyer_confirm', 'fr_dispersal'],
  super:       null,
}

const riskColor = (score) => {
  if (score === null || score === undefined) return { bg: '#f5f5f5', text: '#a3a3a3' }
  if (score <= 30) return { bg: '#dcfce7', text: '#15803d' }
  if (score <= 60) return { bg: '#fef9c3', text: '#a16207' }
  return { bg: '#fee2e2', text: '#b91c1c' }
}

function SARAmount({ amount }) {
  const num = new Intl.NumberFormat('en-SA', { minimumFractionDigits: 0 }).format(amount)
  return (
    <span>
      <span style={{ fontSize: '0.72em', color: '#a3a3a3', fontWeight: 500, marginRight: 2, letterSpacing: '0.02em' }}>SAR</span>{num}
    </span>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
      <div>{children}</div>
    </div>
  )
}

function RepaymentSchedule({ schedule }) {
  if (!schedule?.length) return null
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Repayment Schedule</div>
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
        {schedule.map((inst, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 14px', fontSize: 12,
            borderBottom: i < schedule.length - 1 ? '1px solid #f1f5f9' : 'none',
            background: i % 2 === 0 ? 'white' : '#fafafa',
          }}>
            <span style={{ color: '#94a3b8', fontWeight: 600, minWidth: 80 }}>Instalment {inst.no}</span>
            <span style={{ color: '#64748b' }}>{inst.dueDate}</span>
            <span style={{ fontWeight: 700, color: '#262626' }}><SARAmount amount={inst.amount} /></span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Shared Yumnai Briefing Block ───────────────────────────────────────────────
function YumnaiBriefing({ message, nextAction, statusItems }) {
  if (!message) return null
  return (
    <div style={{ background: 'linear-gradient(135deg, #9084fd 0%, #6a7bff 50%, #3da4ff 100%)', padding: '1.5px', borderRadius: 18 }}>
      <div style={{ borderRadius: 17, overflow: 'hidden', background: 'white' }}>
        <div style={{ padding: '11px 16px', background: 'linear-gradient(135deg, #9084fd 0%, #6a7bff 50%, #3da4ff 100%)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/yumnai.svg" alt="Yumnai" style={{ height: 16, width: 'auto', filter: 'brightness(0) invert(1)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Yumnai</span>
          <span style={{ width: 6, height: 6, borderRadius: '50%', display: 'inline-block', background: 'rgba(255,255,255,0.7)', flexShrink: 0 }} />
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>Deal Briefing</span>
        </div>
        {statusItems?.length > 0 && (
          <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(144,132,253,0.12)', display: 'flex', gap: 8, flexWrap: 'wrap', background: 'rgba(144,132,253,0.04)' }}>
            {statusItems.map((item, i) => (
              <span key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 11px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: item.done ? '#dcfce7' : item.pending ? '#fffbeb' : '#f1f5f9',
                color:      item.done ? '#15803d' : item.pending ? '#92400e' : '#64748b',
                border:     `1px solid ${item.done ? '#bbf7d0' : item.pending ? '#fde68a' : '#e2e8f0'}`,
              }}>
                {item.done ? '✓' : item.pending ? '⏳' : '·'} {item.label}
              </span>
            ))}
          </div>
        )}
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.55, margin: 0 }}>{message}</p>
          {nextAction && (
            <div style={{ paddingTop: 10, borderTop: '1px solid rgba(144,132,253,0.15)' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#4c1d95', lineHeight: 1.5, margin: 0 }}>{nextAction}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Shared Documents Tab ───────────────────────────────────────────────────────
function DocumentsTab({ documents }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {documents.map((doc, i) => {
        const statusColor = doc.status === 'received' ? '#15803d' : doc.status === 'missing' ? '#b91c1c' : '#a16207'
        const statusBg    = doc.status === 'received' ? '#dcfce7'  : doc.status === 'missing' ? '#fee2e2'  : '#fef9c3'
        return (
          <div key={i} style={{ background: 'white', border: '1px solid #e5e5e5', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#262626', marginBottom: 2 }}>{doc.name}</div>
              {doc.discrepancy && <div style={{ fontSize: 11, color: '#b91c1c', marginTop: 3 }}>⚠️ {doc.discrepancy}</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {doc.aiCheck && (
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: doc.aiCheck === 'pass' ? '#dcfce7' : '#fee2e2', color: doc.aiCheck === 'pass' ? '#15803d' : '#b91c1c' }}>
                  AI: {doc.aiCheck}
                </span>
              )}
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: statusBg, color: statusColor, textTransform: 'capitalize' }}>
                {doc.status}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── ChatterPanel (modeled on Pipeline.jsx ChatterPanel) ────────────────────────
function ChatterPanel({ correspondence, onSend }) {
  const [chatterMode, setChatterMode] = useState(null)
  const [draftText, setDraftText]     = useState('')
  const handleSend = () => {
    if (!draftText.trim()) return
    onSend(draftText.trim(), chatterMode)
    setDraftText(''); setChatterMode(null)
  }
  return (
    <div className="flex flex-col border-l border-slate-100 bg-white shrink-0" style={{ width: 360 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Activity & Notes</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {correspondence.length === 0 && <div className="text-center text-[13px] text-slate-400 py-8">No activity yet.</div>}
        {correspondence.map((entry, i) => {
          const isYumnai = entry.from === 'Yumnai AI'
          return (
            <div key={i} className="rounded-xl border p-3"
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
                <span className="ml-auto text-[10px] text-slate-400 shrink-0">{entry.time}</span>
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: isYumnai ? '#262626' : '#475569', margin: 0 }}>{entry.message}</p>
            </div>
          )
        })}
      </div>
      <div className="border-t border-slate-100 shrink-0">
        <div className="px-4 py-3 flex gap-2">
          {[{ id: 'message', label: 'Send message' }, { id: 'note', label: 'Log note' }].map(({ id, label }) => (
            <button key={id} onClick={() => setChatterMode(m => m === id ? null : id)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all"
              style={{ background: chatterMode === id ? '#f5f5f5' : 'white', borderColor: chatterMode === id ? 'rgba(0,0,0,0.15)' : '#e5e5e5', color: chatterMode === id ? '#262626' : '#525252' }}>
              {label}
            </button>
          ))}
        </div>
        {chatterMode && (
          <div className="px-4 pb-3" style={{ background: '#f5f5f5' }}>
            <textarea value={draftText} onChange={e => setDraftText(e.target.value)} rows={4} autoFocus
              placeholder={chatterMode === 'note' ? 'Add an internal note…' : 'Write a message…'}
              className="w-full px-3 py-2.5 rounded-xl border text-[12px] outline-none resize-none leading-relaxed"
              style={{ borderColor: 'rgba(0,0,0,0.15)', fontFamily: 'inherit' }} />
            <div className="flex gap-2 mt-2">
              <button onClick={handleSend} className="px-4 py-1.5 rounded-lg text-white font-semibold text-[12px]" style={{ background: 'var(--color-primary)' }}>
                {chatterMode === 'note' ? 'Add note' : 'Send'}
              </button>
              <button onClick={() => { setChatterMode(null); setDraftText('') }} className="px-4 py-1.5 rounded-lg font-semibold text-[12px] border border-slate-200 text-slate-500">Discard</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Invoice Viewer Modal ──────────────────────────────────────────────────────
function InvoiceModal({ card, onClose }) {
  useEffect(() => {
    const h = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  const isIF = !!card.invoiceNumber
  const mdrFee = card.amount * (card.mdrRate || 0) / 100
  const mdrPayerLabel = card.mdrPayer === 'seller_full' ? 'Seller pays' : card.mdrPayer === 'buyer_full' ? 'Buyer pays' : 'Split 50/50'
  const netToSeller = card.amount - (card.mdrPayer === 'seller_full' ? mdrFee : card.mdrPayer === 'split_50_50' ? mdrFee / 2 : 0)
  const stageInfo = [...FINANCE_REQUESTS_STAGES, ...INVOICE_FINANCE_STAGES].find(s => s.id === card.stage)
  const docs = card.documents || []
  const received = docs.filter(d => d.status === 'received').length

  const termRows = [
    { label: 'Invoice Amount', value: <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 15 }}><SARAmount amount={card.amount} /></span> },
    { label: 'MDR Rate', value: `${card.mdrRate}% · ${mdrPayerLabel}` },
    { label: 'MDR Fee', value: <SARAmount amount={mdrFee} /> },
    { label: 'Net to Seller', value: <SARAmount amount={netToSeller} /> },
    { label: 'Tenure', value: `${card.tenure} days · ${card.emiFrequency || 'monthly'}` },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto', padding: 32, boxShadow: '0 25px 60px rgba(0,0,0,0.18)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 5 }}>Yumna Finance</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
              {isIF ? 'Invoice Finance' : 'Finance Request'} · <span style={{ fontFamily: 'monospace' }}>{card.id}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20, background: stageInfo?.color ? `${stageInfo.color}18` : '#f1f5f9', color: stageInfo?.color || '#475569', border: `1px solid ${stageInfo?.color ? `${stageInfo.color}35` : '#e2e8f0'}` }}>
                {stageInfo?.label || card.stage}
              </span>
              {card.daysInStage > 0 && <span style={{ fontSize: 11, color: '#94a3b8' }}>{card.daysInStage}d in stage</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13, color: '#64748b', flexShrink: 0 }}>✕</button>
        </div>

        <div style={{ height: 1, background: '#f1f5f9', marginBottom: 20 }} />

        {/* Parties */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, padding: '12px 14px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e5e5e5' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>From</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{card.seller}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{card.sector}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, padding: '0 2px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </div>
          <div style={{ flex: 1, padding: '12px 14px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e5e5e5' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>To</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{card.buyer || '—'}</div>
            {card.assignedTo && <div style={{ fontSize: 11, color: '#94a3b8' }}>via {card.assignedTo}</div>}
          </div>
        </div>

        {/* Financing Terms */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Financing Terms</div>
          <div style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #e5e5e5', overflow: 'hidden' }}>
            {termRows.map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', borderTop: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>{row.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#262626' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Documents</div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: received === docs.length ? '#dcfce7' : '#fff7ed', color: received === docs.length ? '#15803d' : '#c2410c' }}>
              {received} / {docs.length} received
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {docs.map((doc, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e5e5e5', fontSize: 11, overflow: 'hidden' }}>
                <span style={{ flexShrink: 0 }}>{doc.status === 'received' ? '✅' : doc.discrepancy ? '⚠️' : '⏳'}</span>
                <span style={{ fontWeight: 500, color: '#262626', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer meta */}
        <div style={{ padding: '10px 14px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e5e5e5', display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 11, color: '#64748b' }}>
          <span>Sector: <strong style={{ color: '#262626' }}>{card.sector}</strong></span>
          <span>Assigned: <strong style={{ color: '#262626' }}>{card.assignedTo || '—'}</strong></span>
          {isIF && card.invoiceNumber && <span>Invoice No.: <strong style={{ color: '#262626', fontFamily: 'monospace' }}>{card.invoiceNumber}</strong></span>}
          {isIF && card.commodityBroker && <span>Broker: <strong style={{ color: '#262626' }}>{card.commodityBroker}</strong></span>}
          {isIF && card.saleBroker && <span>Sale via: <strong style={{ color: '#262626' }}>{card.saleBroker}</strong></span>}
        </div>
      </div>
    </div>
  )
}

// ── Direct Finance Request card detail ────────────────────────────────────────
const FR_NEXT_STAGE = { fr_checking: 'fr_credit', fr_credit: 'fr_buyer_confirm', fr_buyer_confirm: 'fr_dispersal', fr_dispersal: 'fr_closed' }
const FR_ACCEPT_LABEL = {
  fr_checking: 'Send for Credit Review →',
  fr_credit: 'Send for Buyer Confirmation →',
  fr_buyer_confirm: 'Mark as Buyer Confirmed →',
  fr_dispersal: 'Confirm Disbursement →',
}

function FRCardDetailPage({ card, onClose, onCardUpdate, onPrev, onNext, currentIdx, totalCards, laneCards, laneIdx, onPrevInLane, onNextInLane }) {
  const { state } = useApp()
  const [localCard, setLocalCard] = useState(card)
  const [activeTab, setActiveTab]   = useState('overview')
  const [editMdr, setEditMdr]       = useState(String(card.mdrRate))
  const [editAmt, setEditAmt]       = useState(String(card.amount))
  const [editPayer, setEditPayer]   = useState(card.mdrPayer || 'seller_full')
  const [termsDirty, setTermsDirty]           = useState(false)
  const [showAddAgreement, setShowAddAgreement] = useState(false)
  const [localNotifSent, setLocalNotifSent]     = useState(false)
  const [newRequestCreated, setNewRequestCreated] = useState(false)

  useEffect(() => {
    setLocalCard(card)
    setEditMdr(String(card.mdrRate))
    setEditAmt(String(card.amount))
    setEditPayer(card.mdrPayer || 'seller_full')
    setTermsDirty(false)
    setShowAddAgreement(false)
    setLocalNotifSent(false)
    setNewRequestCreated(false)
  }, [card])

  const stageIdx   = FINANCE_REQUESTS_STAGES.findIndex(s => s.id === localCard.stage)
  const stageInfo  = FINANCE_REQUESTS_STAGES.find(s => s.id === localCard.stage)
  const laneLabel  = stageInfo?.label || localCard.stage
  const laneTotal  = laneCards?.length ?? 1
  const stageColor = stageInfo?.color || '#262626'
  const buyerInfo  = localCard.buyerId ? MOCK_BUYERS.find(b => b.id === localCard.buyerId) || null : null

  const mdrFee     = Number(editAmt) * (Number(editMdr) / 100)
  const netToSeller = Number(editAmt) - (editPayer === 'seller_full' ? mdrFee : editPayer === 'split_50_50' ? mdrFee / 2 : 0)

  const emiSchedule = (() => {
    const amt    = Number(editAmt)
    const mdr    = Number(editMdr)
    const tenure = localCard.tenure || 30
    const freq   = localCard.emiFrequency || 'monthly'
    const total  = amt + amt * mdr / 100
    const count  = freq === 'monthly' ? Math.max(1, Math.round(tenure / 30))
                 : freq === 'bimonthly' ? Math.max(1, Math.round(tenure / 15))
                 : Math.max(1, Math.round(tenure / 7))
    const emiAmt    = total / count
    const periodDays = tenure / count
    const today = new Date()
    return Array.from({ length: count }, (_, i) => {
      const d = new Date(today.getTime() + (i + 1) * periodDays * 86400000)
      return { no: i + 1, dueDate: d.toLocaleDateString('en-SA', { day: '2-digit', month: 'short', year: 'numeric' }), amount: emiAmt }
    })
  })()

  const totalDocs    = localCard.documents.length
  const receivedDocs = localCard.documents.filter(d => d.status === 'received').length
  const pendingDocs  = totalDocs - receivedDocs

  const appendNote = (note, base = localCard) => {
    const updated = { ...base, correspondence: [...base.correspondence, {
      from: state.currentUser?.name || 'You', message: note,
      time: new Date().toLocaleString('en-SA', { dateStyle: 'short', timeStyle: 'short' }), autoRead: false,
    }] }
    setLocalCard(updated); onCardUpdate?.(updated)
    return updated
  }

  const applyTerms = (base = localCard) => ({ ...base, amount: Number(editAmt), mdrRate: Number(editMdr), mdrPayer: editPayer })

  const handleSend      = (msg) => appendNote(msg)
  const handleStageMove = (id) => { const u = { ...localCard, stage: id, daysInStage: 0 }; setLocalCard(u); onCardUpdate?.(u) }

  const handleSaveTerms = () => {
    const u = applyTerms(); setLocalCard(u); setTermsDirty(false); onCardUpdate?.(u)
  }
  const handleContinue = () => {
    const base = termsDirty ? applyTerms() : localCard
    if (termsDirty) setTermsDirty(false)
    appendNote('Reviewed — continuing work.', base)
  }
  const handleSuggest = () => {
    const base = applyTerms(); setTermsDirty(false)
    appendNote(`Suggested terms: MDR ${editMdr}%, Amount ${formatSAR(Number(editAmt))}, Payer: ${editPayer === 'seller_full' ? 'Seller (full)' : editPayer === 'buyer_full' ? 'Buyer (full)' : 'Split 50/50'}.`, base)
  }
  const handleAccept = () => {
    const next = FR_NEXT_STAGE[localCard.stage]; if (!next) return
    let base = termsDirty ? applyTerms() : localCard
    if (localCard.stage === 'fr_buyer_confirm') base = { ...base, buyerConfirmedAt: new Date().toISOString() }
    const noteMsg = localCard.stage === 'fr_buyer_confirm'
      ? `Buyer ${localCard.buyer || 'buyer'} confirmed invoice. Advancing to Credit Dispersal.`
      : localCard.stage === 'fr_dispersal'
      ? `Disbursement confirmed. Credit issued to ${localCard.buyer || 'buyer'}.`
      : `Advanced to: ${FINANCE_REQUESTS_STAGES.find(s => s.id === next)?.label || next}.`
    const updated = { ...base, stage: next, daysInStage: 0, correspondence: [...base.correspondence, {
      from: state.currentUser?.name || 'You', message: noteMsg,
      time: new Date().toLocaleString('en-SA', { dateStyle: 'short', timeStyle: 'short' }), autoRead: true,
    }] }
    setLocalCard(updated); setTermsDirty(false); onCardUpdate?.(updated)
  }

  const handleSignAgreement = (agrId) => {
    const now = new Date().toLocaleString('en-SA', { dateStyle: 'short', timeStyle: 'short' })
    const updated = {
      ...localCard,
      agreements: (localCard.agreements || []).map(a =>
        a.id === agrId ? { ...a, status: 'signed', signedAt: now, signedBy: localCard.buyer || 'Buyer' } : a
      ),
    }
    setLocalCard(updated); onCardUpdate?.(updated)
  }

  const handleMarkDocReceived = (docIndex) => {
    const updatedDocs = localCard.documents.map((d, i) =>
      i === docIndex ? { ...d, status: 'received', aiCheck: d.aiCheck || 'pass' } : d
    )
    const updated = { ...localCard, documents: updatedDocs }
    setLocalCard(updated); onCardUpdate?.(updated)
  }

  const handleAddAgreement = (template) => {
    const newAgr = {
      id: `agr-${localCard.id}-${Date.now()}`,
      name: template.name,
      templateId: template.id,
      status: 'pending',
      addedAt: new Date().toLocaleDateString('en-SA', { dateStyle: 'short' }),
      signedAt: null,
      signedBy: null,
    }
    const updated = { ...localCard, agreements: [...(localCard.agreements || []), newAgr] }
    setLocalCard(updated); onCardUpdate?.(updated)
    setShowAddAgreement(false)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ── */}
      <div className="shrink-0 px-5 py-3 border-b border-black/5 flex items-center gap-3 bg-white/60 backdrop-blur-sm">
        <button onClick={onClose} className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: 'var(--color-primary)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Finance Requests
        </button>
        <span className="text-slate-300">/</span>
        <span className="font-semibold text-slate-800 text-[13px]">{localCard.id}</span>
        <div className="flex gap-2 ml-2 flex-wrap">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[12px] font-semibold text-slate-600">🏪 {localCard.seller}</span>
          {localCard.buyer && <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[12px] font-semibold text-slate-600">👤 {localCard.buyer}</span>}
          <span className="flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[12px] font-bold text-slate-700"><SARAmount amount={localCard.amount} /></span>
          {localCard.riskScore !== null && localCard.riskScore !== undefined && (
            <span className="flex items-center px-3 py-1.5 rounded-lg border text-[11px] font-bold"
              style={{ background: riskColor(localCard.riskScore).bg, borderColor: riskColor(localCard.riskScore).bg, color: riskColor(localCard.riskScore).text }}>
              Risk {localCard.riskScore}
            </span>
          )}
        </div>
        <div className="flex-1" />
        <span className="text-[12px] text-slate-400 tabular-nums">{currentIdx + 1} / {totalCards}</span>
        <div className="flex gap-1">
          <button onClick={onPrev} disabled={currentIdx === 0} className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-white disabled:opacity-30 transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
          </button>
          <button onClick={onNext} disabled={currentIdx === totalCards - 1} className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-white disabled:opacity-30 transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
      </div>

      {/* ── Stage Progress Bar ── */}
      <div className="px-5 py-2.5 border-b border-black/5 shrink-0 overflow-x-auto">
        <div className="flex items-center" style={{ minWidth: 'max-content' }}>
          {FINANCE_REQUESTS_STAGES.filter(s => s.id !== 'fr_closed').map((s, i) => {
            const isPast    = i < stageIdx
            const isCurrent = s.id === localCard.stage
            return (
              <div key={s.id} className="flex items-center">
                {i > 0 && <span style={{ color: '#d4d4d4', fontSize: 10, margin: '0 4px' }}>›</span>}
                <button onClick={() => !isCurrent && handleStageMove(s.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 8,
                    border: isCurrent ? '1px solid #86d6a3' : '1px solid transparent',
                    background: isCurrent ? '#dcfce7' : 'transparent', cursor: isCurrent ? 'default' : 'pointer' }}>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0, fontSize: 8, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1.5px solid ${isPast ? '#d4d4d4' : isCurrent ? '#16a34a' : '#e5e5e5'}`,
                    background: isPast ? '#f0f0f0' : isCurrent ? '#16a34a' : 'transparent' }}>{isPast ? '✓' : ''}</span>
                  <span style={{ fontSize: 11, fontWeight: isCurrent ? 700 : 500, whiteSpace: 'nowrap',
                    color: isPast ? '#a3a3a3' : isCurrent ? '#15803d' : '#64748b' }}>{s.label}</span>
                </button>
              </div>
            )
          })}
          {localCard.stage === 'fr_closed' && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d', padding: '4px 8px', marginLeft: 4 }}>✓ Closed</span>
          )}
        </div>
      </div>

      {/* ── Main split ── */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Tab bar */}
          <div className="shrink-0 flex items-center gap-0 px-6 border-b border-black/5" style={{ background: 'var(--color-page)', paddingTop: 0 }}>
            <div className="flex items-end gap-0 flex-1" style={{ paddingTop: 8 }}>
              {[{ id: 'overview', label: 'Overview' }, { id: 'documents', label: `Documents (${localCard.documents.length})` }].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  padding: '7px 16px 8px', fontSize: 12, fontWeight: activeTab === tab.id ? 700 : 500,
                  color: activeTab === tab.id ? 'var(--color-primary)' : '#525252', background: 'none', border: 'none',
                  borderBottom: activeTab === tab.id ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}>{tab.label}</button>
              ))}
            </div>
            <button onClick={() => setShowInvoice(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', fontSize: 11, fontWeight: 600, color: '#475569', cursor: 'pointer', flexShrink: 0, marginLeft: 8 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              View Invoice
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">

          {activeTab === 'overview' && (
            <div className="p-6 space-y-6">
              {/* fr_checking: Request summary at top */}
              {localCard.stage === 'fr_checking' && (
                <div className="bg-white rounded-2xl border border-black/5 p-5">
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Finance Request</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <span style={{ fontSize: 15, fontFamily: 'monospace', fontWeight: 700, color: '#262626' }}>{localCard.id}</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-primary)', marginLeft: 'auto' }}><SARAmount amount={localCard.amount} /></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e5e5e5', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#262626' }}>{localCard.seller}</span>
                    <span style={{ fontSize: 12, color: '#a3a3a3' }}>→</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#262626' }}>{localCard.buyer || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#64748b', flexWrap: 'wrap' }}>
                    <span>Sector: <strong style={{ color: '#262626' }}>{localCard.sector}</strong></span>
                    <span>MDR: <strong style={{ color: '#262626' }}>{localCard.mdrRate}%</strong></span>
                    <span>Tenure: <strong style={{ color: '#262626' }}>{localCard.tenure}d</strong></span>
                    {localCard.daysInStage > 0 && <span style={{ marginLeft: 'auto', color: '#c2410c', fontWeight: 600 }}>⏱ {localCard.daysInStage}d in stage</span>}
                  </div>
                </div>
              )}

              {/* fr_checking: Doc checklist moved to top */}
              {localCard.stage === 'fr_checking' && (
                <div className="bg-white rounded-2xl border border-black/5 p-5">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Doc Checking</div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20,
                      background: pendingDocs > 0 ? '#fff7ed' : '#dcfce7',
                      color: pendingDocs > 0 ? '#c2410c' : '#15803d' }}>
                      {receivedDocs}/{totalDocs} received
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>Do we have enough documents to send this for Credit Review?</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                    {localCard.documents.map((doc, i) => {
                      const isPending = doc.status !== 'received'
                      const sc = doc.status === 'received' ? '#15803d' : doc.status === 'missing' ? '#b91c1c' : '#a16207'
                      const sb = doc.status === 'received' ? '#dcfce7'  : doc.status === 'missing' ? '#fee2e2'  : '#fef9c3'
                      return (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
                          background: isPending ? '#fffbf5' : '#f8fafc',
                          border: `1px solid ${isPending ? '#fed7aa' : '#e5e5e5'}`,
                        }}>
                          <span style={{ fontSize: 14, flexShrink: 0 }}>{doc.status === 'received' ? '✅' : doc.status === 'missing' ? '❌' : '⏳'}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#262626' }}>{doc.name}</div>
                            {doc.discrepancy && <div style={{ fontSize: 10, color: '#b91c1c', marginTop: 1 }}>⚠️ {doc.discrepancy}</div>}
                          </div>
                          {doc.aiCheck && (
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: doc.aiCheck === 'pass' ? '#dcfce7' : '#fee2e2', color: doc.aiCheck === 'pass' ? '#15803d' : '#b91c1c' }}>
                              AI: {doc.aiCheck}
                            </span>
                          )}
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: sb, color: sc, textTransform: 'capitalize' }}>{doc.status}</span>
                          {isPending && (
                            <button onClick={() => handleMarkDocReceived(i)}
                              style={{ padding: '4px 12px', borderRadius: 20, border: 'none', background: 'var(--color-primary)', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                              Mark Received
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 10, background: pendingDocs > 0 ? '#fff7ed' : '#f0fdf4', border: `1px solid ${pendingDocs > 0 ? '#fed7aa' : '#bbf7d0'}` }}>
                    <span style={{ fontSize: 15, marginTop: 1 }}>{pendingDocs > 0 ? '⚠️' : '✅'}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: pendingDocs > 0 ? '#c2410c' : '#15803d' }}>{receivedDocs} of {totalDocs} documents received</div>
                      {pendingDocs > 0
                        ? <div style={{ fontSize: 11, color: '#a16207', marginTop: 2 }}>{pendingDocs} document{pendingDocs > 1 ? 's' : ''} still pending — mark as received or flag and proceed.</div>
                        : <div style={{ fontSize: 11, color: '#15803d', marginTop: 2 }}>All documents received. Ready to send for Credit Review.</div>}
                    </div>
                  </div>
                </div>
              )}

              <YumnaiBriefing message={localCard.yumnaiSuggestion?.message} nextAction={localCard.yumnaiSuggestion?.nextAction} />

              {/* Static info */}
              <div className="bg-white rounded-2xl border border-black/5 p-5">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <Field label="Seller (Merchant)"><span className="text-[13px] font-semibold" style={{ color: 'var(--color-primary)' }}>{localCard.seller}</span></Field>
                  {localCard.buyer && <Field label="Buyer (Customer)"><span className="text-[13px] font-semibold" style={{ color: 'var(--color-primary)' }}>{localCard.buyer}</span></Field>}
                  <Field label="Sector"><span className="text-[13px] text-slate-700">{localCard.sector}</span></Field>
                  <Field label="Assigned To"><span className="text-[13px] text-slate-700">{localCard.assignedTo || '—'}</span></Field>
                  {localCard.riskScore !== null && localCard.riskScore !== undefined && (
                    <Field label="Risk Score">
                      <span className="text-[12px] font-bold px-2 py-0.5 rounded-full" style={{ background: riskColor(localCard.riskScore).bg, color: riskColor(localCard.riskScore).text }}>{localCard.riskScore}</span>
                    </Field>
                  )}
                  {buyerInfo && (
                    <Field label="Buyer Credit">
                      <div style={{ fontSize: 12, color: '#525252', display: 'flex', gap: 8 }}>
                        <span>Limit: <strong style={{ color: '#262626' }}><SARAmount amount={buyerInfo.creditLimit} /></strong></span>
                        <span>Used: <strong><SARAmount amount={buyerInfo.creditUsed} /></strong></span>
                      </div>
                    </Field>
                  )}
                </div>
              </div>

              {/* Editable Terms */}
              <div className="bg-white rounded-2xl border border-black/5 p-5">
                <div style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                  Financing Terms
                  {termsDirty && <span style={{ fontWeight: 600, color: '#f59e0b', textTransform: 'none', letterSpacing: 0, marginLeft: 6 }}>· unsaved changes</span>}
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#525252', marginBottom: 4 }}>Base of Credit (SAR)</div>
                    <input type="number" value={editAmt} onChange={e => { setEditAmt(e.target.value); setTermsDirty(true) }}
                      style={{ width: '100%', border: '1.5px solid #e5e5e5', borderRadius: 8, padding: '6px 10px', fontSize: 13, outline: 'none', color: '#262626' }} />
                    <div style={{ fontSize: 10, color: '#a3a3a3', marginTop: 3 }}>Original: <SARAmount amount={card.amount} /></div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#525252', marginBottom: 4 }}>MDR Rate (%)</div>
                    <input type="number" step="0.1" value={editMdr} onChange={e => { setEditMdr(e.target.value); setTermsDirty(true) }}
                      style={{ width: '100%', border: '1.5px solid #e5e5e5', borderRadius: 8, padding: '6px 10px', fontSize: 13, outline: 'none', color: '#262626' }} />
                    <div style={{ fontSize: 10, color: '#a3a3a3', marginTop: 3 }}>Original: {card.mdrRate}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#525252', marginBottom: 4 }}>MDR Payer</div>
                    <select value={editPayer} onChange={e => { setEditPayer(e.target.value); setTermsDirty(true) }}
                      style={{ width: '100%', border: '1.5px solid #e5e5e5', borderRadius: 8, padding: '6px 10px', fontSize: 13, outline: 'none', background: 'white', color: '#262626' }}>
                      <option value="seller_full">Seller bears full MDR</option>
                      <option value="buyer_full">Buyer bears full MDR</option>
                      <option value="split_50_50">Split 50/50</option>
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#525252', marginBottom: 4 }}>Tenure / Frequency</div>
                    <div style={{ fontSize: 13, color: '#262626', padding: '6px 10px', background: '#f8fafc', borderRadius: 8, border: '1.5px solid #e5e5e5', textTransform: 'capitalize' }}>
                      {localCard.tenure} days · {localCard.emiFrequency}
                    </div>
                  </div>
                </div>
                <div style={{ padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e5e5e5', display: 'flex', gap: 20, fontSize: 12, color: '#475569', marginBottom: termsDirty ? 12 : 0 }}>
                  <span>MDR Fee: <strong style={{ color: '#262626' }}><SARAmount amount={mdrFee} /></strong></span>
                  <span>Net to Seller: <strong style={{ color: '#262626' }}><SARAmount amount={netToSeller} /></strong></span>
                </div>
                {termsDirty && (
                  <button onClick={handleSaveTerms} style={{ padding: '7px 18px', borderRadius: 20, border: 'none', background: 'linear-gradient(135deg, #9084fd 0%, #6a7bff 50%, #3da4ff 100%)', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 12px rgba(144,132,253,0.25)' }}>
                    Save Terms
                  </button>
                )}
              </div>

              {/* EMI Schedule */}
              <div className="bg-white rounded-2xl border border-black/5 p-5">
                <div style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                  EMI Schedule
                  <span style={{ fontWeight: 500, color: '#c4c4c4', textTransform: 'none', letterSpacing: 0, marginLeft: 6 }}>
                    ({emiSchedule.length} instalment{emiSchedule.length > 1 ? 's' : ''} · <span style={{ textTransform: 'capitalize' }}>{localCard.emiFrequency}</span>)
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {emiSchedule.map(inst => (
                    <div key={inst.no} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e5e5e5', fontSize: 12 }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#64748b', flexShrink: 0, marginRight: 12 }}>{inst.no}</span>
                      <span style={{ color: '#475569', flex: 1 }}>{inst.dueDate}</span>
                      <span style={{ fontWeight: 700, color: '#262626' }}><SARAmount amount={inst.amount} /></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Stage-Specific Panel ── */}

              {localCard.stage === 'fr_credit' && (() => {
                const util      = buyerInfo ? buyerInfo.creditUsed / buyerInfo.creditLimit : 0
                const available = buyerInfo ? buyerInfo.creditLimit - buyerInfo.creditUsed : 0
                const fits      = Number(editAmt) <= available
                const uc        = util < 0.6 ? '#15803d' : util < 0.85 ? '#a16207' : '#b91c1c'
                return (
                  <div className="bg-white rounded-2xl border border-black/5 p-5">
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Credit Review</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>Is the credit information correct to send for Seller Confirmation?</div>
                    {buyerInfo ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <div style={{ flex: 1, padding: '12px 14px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e5e5e5' }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>SIMAH Score</div>
                            <div style={{ fontSize: 24, fontWeight: 800, color: '#262626', lineHeight: 1 }}>{buyerInfo.simahScore ?? '—'}</div>
                            {buyerInfo.simahScore && (
                              <div style={{ fontSize: 10, marginTop: 3, color: buyerInfo.simahScore >= 650 ? '#15803d' : buyerInfo.simahScore >= 500 ? '#a16207' : '#b91c1c', fontWeight: 600 }}>
                                {buyerInfo.simahScore >= 650 ? 'Good standing' : buyerInfo.simahScore >= 500 ? 'Fair' : 'Below threshold'}
                              </div>
                            )}
                          </div>
                          <div style={{ flex: 1, padding: '12px 14px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e5e5e5' }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Available Credit</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#262626', lineHeight: 1 }}><SARAmount amount={available} /></div>
                            <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>of <SARAmount amount={buyerInfo.creditLimit} /> limit</div>
                          </div>
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>
                            <span>Credit Utilisation</span>
                            <span style={{ color: uc }}>{(util * 100).toFixed(0)}%</span>
                          </div>
                          <div style={{ height: 8, borderRadius: 20, background: '#f1f5f9', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(util * 100, 100)}%`, borderRadius: 20, background: uc, transition: 'width 0.3s' }} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: fits ? '#f0fdf4' : '#fff7ed', border: `1px solid ${fits ? '#bbf7d0' : '#fed7aa'}` }}>
                          <span style={{ fontSize: 15 }}>{fits ? '✅' : '⚠️'}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: fits ? '#15803d' : '#c2410c' }}>
                            Requested <SARAmount amount={Number(editAmt)} /> {fits ? 'fits within available credit' : 'exceeds available credit'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: '#a3a3a3', padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e5e5e5' }}>No buyer credit profile linked.</div>
                    )}
                  </div>
                )
              })()}

              {localCard.stage === 'fr_buyer_confirm' && (() => {
                const agreements = localCard.agreements || []
                const allSigned = agreements.length > 0 && agreements.every(a => a.status === 'signed')
                const confirmMsg = `Dear ${localCard.buyer || 'customer'}, Yumna Finance is requesting your confirmation for invoice ${localCard.id} from ${localCard.seller} — ${formatSAR(Number(editAmt))}. Please review and sign at: yumna.finance/confirm/${localCard.id}`
                return (
                  <div className="bg-white rounded-2xl border border-black/5 p-5 space-y-5">
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Buyer Confirmation</div>

                    {/* §1 — Invoice summary */}
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e5e5e5', display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 12, color: '#475569' }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em', width: '100%' }}>Invoice presented for buyer confirmation</span>
                      <span>{localCard.seller} → <strong style={{ color: '#262626' }}>{localCard.buyer}</strong></span>
                      <span>Amount: <strong style={{ color: '#262626' }}><SARAmount amount={Number(editAmt)} /></strong></span>
                      <span>MDR: <strong style={{ color: '#262626' }}>{editMdr}%</strong></span>
                      <span>Tenure: <strong style={{ color: '#262626' }}>{localCard.tenure}d</strong></span>
                    </div>

                    {/* §2 — Notification */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Send Confirmation to Buyer</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>A link will be sent to the buyer to review the invoice and sign the agreement before accepting.</div>
                      {/* WhatsApp preview */}
                      <div style={{ borderLeft: '4px solid #25D366', borderRadius: '0 10px 10px 0', padding: '10px 14px', background: '#f0fdf4', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.561 4.141 1.541 5.876L.057 23.998l6.305-1.654A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.847 0-3.572-.496-5.056-1.362l-.364-.215-3.742.981.998-3.649-.236-.374A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d' }}>WhatsApp Notification Preview</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.6, marginBottom: 8 }}>{confirmMsg}</div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: '#dcfce7', border: '1px solid #86efac' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#15803d', fontFamily: 'monospace' }}>yumna.finance/confirm/{localCard.id}</span>
                        </div>
                      </div>
                      {localNotifSent ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #86efac', fontSize: 11, fontWeight: 600, color: '#15803d' }}>
                          ✅ Notification sent — awaiting buyer response
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => setLocalNotifSent(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, border: 'none', background: '#25D366', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.561 4.141 1.541 5.876L.057 23.998l6.305-1.654A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.847 0-3.572-.496-5.056-1.362l-.364-.215-3.742.981.998-3.649-.236-.374A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                            Send via WhatsApp
                          </button>
                          <button onClick={() => setLocalNotifSent(true)}
                            style={{ padding: '7px 14px', borderRadius: 20, border: '1.5px solid #e5e5e5', background: 'white', fontSize: 12, fontWeight: 600, color: '#525252', cursor: 'pointer' }}>
                            📋 Copy Link
                          </button>
                          <button onClick={() => setLocalNotifSent(true)}
                            style={{ padding: '7px 14px', borderRadius: 20, border: '1.5px solid #e5e5e5', background: 'white', fontSize: 12, fontWeight: 600, color: '#525252', cursor: 'pointer' }}>
                            ✉️ Send via Email
                          </button>
                        </div>
                      )}
                    </div>

                    {/* §3 — Agreements */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>Agreements</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: '#f1f5f9', color: '#475569' }}>{agreements.length}</span>
                        {allSigned && <span style={{ fontSize: 10, fontWeight: 700, color: '#15803d' }}>✅ All signed</span>}
                      </div>
                      {agreements.length === 0 && (
                        <div style={{ fontSize: 12, color: '#a3a3a3', padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px dashed #e5e5e5', marginBottom: 8 }}>
                          No agreements attached. Add one below.
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                        {agreements.map(agr => (
                          <div key={agr.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e5e5e5' }}>
                            <span style={{ fontSize: 14 }}>{agr.status === 'signed' ? '✅' : '📄'}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#262626' }}>{agr.name}</div>
                              {agr.status === 'signed' && <div style={{ fontSize: 10, color: '#15803d', marginTop: 1 }}>Signed by {agr.signedBy} · {agr.signedAt}</div>}
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: agr.status === 'signed' ? '#dcfce7' : '#fff7ed', color: agr.status === 'signed' ? '#15803d' : '#c2410c' }}>
                              {agr.status === 'signed' ? 'Signed' : 'Pending'}
                            </span>
                            {agr.status !== 'signed' && (
                              <button onClick={() => handleSignAgreement(agr.id)}
                                style={{ padding: '4px 12px', borderRadius: 20, border: 'none', background: 'var(--color-primary)', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                Sign
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      {!showAddAgreement ? (
                        <button onClick={() => setShowAddAgreement(true)}
                          style={{ padding: '6px 16px', borderRadius: 20, border: '1.5px solid rgba(144,132,253,0.3)', background: 'rgba(144,132,253,0.05)', fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', cursor: 'pointer' }}>
                          + Add Agreement
                        </button>
                      ) : (
                        <div style={{ borderRadius: 12, border: '1px solid #e5e5e5', overflow: 'hidden' }}>
                          <div style={{ padding: '8px 14px', background: '#f8fafc', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>Choose a template</span>
                            <button onClick={() => setShowAddAgreement(false)} style={{ fontSize: 11, color: '#a3a3a3', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                          </div>
                          {TEMPLATES.filter(t => t.status === 'Active').map(t => (
                            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#262626' }}>{t.name}</div>
                                <div style={{ fontSize: 10, color: '#a3a3a3', marginTop: 1 }}>{t.type}</div>
                              </div>
                              {t.aiSuggested && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: 'rgba(144,132,253,0.08)', color: 'var(--color-primary)' }}>AI</span>}
                              <button onClick={() => handleAddAgreement(t)}
                                style={{ padding: '4px 12px', borderRadius: 20, border: 'none', background: '#f1f5f9', color: '#374151', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                Add
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* §4 — New Invoice Request */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Related Requests</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e5e5e5', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}>{localCard.id}</span>
                        <span style={{ fontSize: 11, color: '#a3a3a3' }}>—</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#262626' }}>Current request</span>
                        <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#f0fdf4', color: '#15803d' }}>Active</span>
                      </div>
                      {newRequestCreated ? (
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#15803d', padding: '6px 12px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                          ✅ New invoice request initiated and logged.
                        </div>
                      ) : (
                        <button onClick={() => { setNewRequestCreated(true); appendNote(`New related invoice request initiated from ${localCard.id}.`) }}
                          style={{ padding: '6px 16px', borderRadius: 20, border: '1.5px solid #e5e5e5', background: 'white', fontSize: 12, fontWeight: 600, color: '#525252', cursor: 'pointer' }}>
                          + New Invoice Request
                        </button>
                      )}
                    </div>
                  </div>
                )
              })()}

              {localCard.stage === 'fr_dispersal' && (
                <div className="bg-white rounded-2xl border border-black/5 p-5">
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Disbursement Summary</div>
                  {localCard.buyerConfirmedAt && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: 12 }}>
                      <span style={{ fontSize: 14 }}>✅</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#15803d' }}>
                        Buyer confirmed · {new Date(localCard.buyerConfirmedAt).toLocaleDateString('en-SA', { dateStyle: 'medium' })}
                      </span>
                    </div>
                  )}
                  <div style={{ border: '1px solid #dcfce7', borderRadius: 12, padding: '14px 16px', background: '#f0fdf4', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>Gross Credit Amount</span>
                      <span style={{ fontWeight: 700, color: '#262626' }}><SARAmount amount={Number(editAmt)} /></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>MDR ({editMdr}% — {editPayer === 'seller_full' ? 'Seller' : editPayer === 'buyer_full' ? 'Buyer' : 'Split'})</span>
                      <span style={{ fontWeight: 700, color: '#737373' }}>− <SARAmount amount={mdrFee} /></span>
                    </div>
                    <div style={{ borderTop: '1px solid #bbf7d0', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ fontWeight: 600, color: '#15803d' }}>Net Credit to Buyer</span>
                      <span style={{ fontWeight: 800, color: '#15803d' }}>
                        <SARAmount amount={Number(editAmt) - (editPayer === 'buyer_full' ? 0 : editPayer === 'seller_full' ? mdrFee : mdrFee / 2)} />
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
          {activeTab === 'documents' && <div className="p-6"><DocumentsTab documents={localCard.documents} /></div>}
        </div>
        {/* ── Ticket action bar ── */}
        <div className="shrink-0" style={{ background: 'rgba(248,250,252,0.97)', backdropFilter: 'blur(8px)', borderTop: '1px solid #e2e8f0', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Lane navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={onPrevInLane} disabled={!laneIdx || laneIdx <= 0}
              className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span style={{ fontSize: 11, color: '#525252', whiteSpace: 'nowrap' }}>
              {laneTotal === 1
                ? <span>Only ticket in <strong style={{ color: '#262626' }}>{laneLabel}</strong></span>
                : <><strong style={{ color: '#262626' }}>{(laneIdx ?? 0) + 1}</strong> / {laneTotal} in <strong style={{ color: '#262626' }}>{laneLabel}</strong></>}
            </span>
            <button onClick={onNextInLane} disabled={laneIdx >= laneTotal - 1}
              className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <span style={{ width: 1, height: 18, background: '#e5e5e5', flexShrink: 0 }} />
          {/* Secondary actions */}
          <button onClick={handleContinue} style={{ padding: '6px 14px', borderRadius: 20, background: 'white', border: '1.5px solid #e5e5e5', fontSize: 12, fontWeight: 600, color: '#525252', cursor: 'pointer' }}>Continue</button>
          <button onClick={handleSuggest} style={{ padding: '6px 14px', borderRadius: 20, background: 'white', border: '1.5px solid #e5e5e5', fontSize: 12, fontWeight: 600, color: '#525252', cursor: 'pointer' }}>✦ Suggest</button>
          {/* Primary CTA */}
          {localCard.stage !== 'fr_closed' && (
            <button onClick={handleAccept} style={{ padding: '7px 18px', borderRadius: 20, border: 'none', background: stageColor, fontSize: 13, fontWeight: 700, color: 'white', cursor: 'pointer', boxShadow: `0 2px 8px ${stageColor}44` }}>
              {FR_ACCEPT_LABEL[localCard.stage] || 'Accept →'}
            </button>
          )}
          {localCard.stage === 'fr_closed' && (
            <span style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>✅ Closed — credit disbursed</span>
          )}
          {/* Assigned to */}
          <span style={{ fontSize: 11, color: '#a3a3a3', marginLeft: 'auto' }}>
            Assigned: <strong style={{ color: '#404040' }}>{localCard.assignedTo || '—'}</strong>
          </span>
        </div>
      </div>
      <ChatterPanel correspondence={localCard.correspondence} onSend={handleSend} />
    </div>
    </div>
  )
}

// ── Invoice Finance card detail ────────────────────────────────────────────────
const IF_NEXT_STAGE = {
  if_new_invoice:     'if_buyer_approval',
  if_buyer_approval:  'if_payment_plan',
  if_payment_plan:    'if_advance_payment',
  if_advance_payment: 'if_ship_notice',
  if_ship_notice:     'if_delivery_notice',
  if_delivery_notice: 'if_disbursement',
  if_disbursement:    'if_active',
}
const IF_ACCEPT_LABEL = {
  if_disbursement: 'Confirm Disbursement →',
}
const IF_CARD_STATUS = {
  if_new_invoice:     (c) => c.invoiceAiCheck?.status === 'verified' ? 'Yumnai verified — buyer notified' : 'AI verification in progress',
  if_buyer_approval:  ()  => 'Awaiting buyer confirmation',
  if_payment_plan:    ()  => 'Generating payment plan',
  if_advance_payment: ()  => 'Advance payment pending',
  if_ship_notice:     ()  => 'Awaiting merchant shipment',
  if_delivery_notice: ()  => 'Awaiting delivery confirmation',
  if_disbursement:    ()  => 'Ready for disbursement',
  if_active:          ()  => '✓ Payment plan active',
}
const IF_STAGE_HINT = {
  if_new_invoice:     'Merchant has uploaded the invoice — awaiting buyer review',
  if_buyer_approval:  'Buyer is reviewing and approving the order',
  if_payment_plan:    'Buyer is selecting an instalment payment plan',
  if_advance_payment: 'Edaat is processing the first advance payment',
  if_ship_notice:     'Merchant has been notified and is preparing to ship',
  if_delivery_notice: 'Awaiting merchant delivery confirmation and note upload',
  if_disbursement:    'All steps complete — confirm disbursement to the merchant',
  if_active:          'Buyer is enrolled in the instalment schedule',
}

function IFCardDetailPage({ card, onClose, onCardUpdate, onPrev, onNext, currentIdx, totalCards, laneCards, laneIdx, onPrevInLane, onNextInLane }) {
  const { state } = useApp()
  const [localCard, setLocalCard] = useState(card)
  const [activeTab, setActiveTab] = useState('overview')
  const [ticketOpen, setTicketOpen] = useState(true)
  const [showInvoice, setShowInvoice] = useState(false)

  useEffect(() => { setLocalCard(card) }, [card])

  const buyerInfo  = localCard.buyerId ? MOCK_BUYERS.find(b => b.id === localCard.buyerId) || null : null
  const stageIdx   = INVOICE_FINANCE_STAGES.findIndex(s => s.id === localCard.stage)
  const stageLabel = INVOICE_FINANCE_STAGES.find(s => s.id === localCard.stage)?.label || localCard.stage
  const laneTotal  = laneCards?.length ?? 1

  const appendNote = (msg, base = localCard) => {
    const updated = { ...base, correspondence: [...base.correspondence, {
      from: state.currentUser?.name || 'You', message: msg,
      time: new Date().toLocaleString('en-SA', { dateStyle: 'short', timeStyle: 'short' }), autoRead: false,
    }] }
    setLocalCard(updated); onCardUpdate?.(updated)
    return updated
  }
  const handleStageMove = (newStageId) => {
    const updated = { ...localCard, stage: newStageId, daysInStage: 0 }
    setLocalCard(updated); onCardUpdate?.(updated)
  }
  const handleSend  = (msg) => appendNote(msg)
  const handleContinue = () => appendNote('Reviewed — continuing work.')
  const handleAccept = () => {
    const next = IF_NEXT_STAGE[localCard.stage]; if (!next) return
    const nextLabel = INVOICE_FINANCE_STAGES.find(s => s.id === next)?.label || next
    const noteMsg = `Advanced to: ${nextLabel}.`
    const updated = { ...localCard, stage: next, daysInStage: 0, correspondence: [...localCard.correspondence, {
      from: state.currentUser?.name || 'You', message: noteMsg,
      time: new Date().toLocaleString('en-SA', { dateStyle: 'short', timeStyle: 'short' }), autoRead: true,
    }] }
    setLocalCard(updated); onCardUpdate?.(updated)
  }
  const mdrFee     = localCard.amount * (localCard.mdrRate / 100)
  const netToSeller = localCard.amount - (localCard.mdrPayer === 'seller_full' ? mdrFee : localCard.mdrPayer === 'split_50_50' ? mdrFee / 2 : 0)

  return (
    <>
    <div className="flex flex-col h-full overflow-hidden">
      {/* Action bar */}
      <div className="shrink-0 px-5 py-3 border-b border-black/5 flex items-center gap-3 flex-wrap">
        <button onClick={onClose} className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: 'var(--color-primary)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Invoice Finance
        </button>
        <span className="text-slate-300">/</span>
        <span className="font-semibold text-slate-800 text-[13px]">{localCard.id}</span>
        <div className="flex gap-2 ml-2 flex-wrap">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[12px] font-semibold text-slate-600">🏪 {localCard.seller}</span>
          {localCard.buyer && <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[12px] font-semibold text-slate-600">👤 {localCard.buyer}</span>}
          {localCard.amount > 0 && (
            <span className="flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[12px] font-bold text-slate-700"><SARAmount amount={localCard.amount} /></span>
          )}
        </div>
        <div className="flex-1" />
        <span className="text-[12px] text-slate-400 tabular-nums">{currentIdx + 1} / {totalCards}</span>
        <div className="flex gap-1">
          <button onClick={onPrev} disabled={currentIdx === 0} className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-white disabled:opacity-30 transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
          </button>
          <button onClick={onNext} disabled={currentIdx === totalCards - 1} className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-white disabled:opacity-30 transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
      </div>

      {/* Stage progress bar */}
      <div className="px-5 py-2.5 border-b border-black/5 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-0" style={{ minWidth: 'max-content' }}>
          {INVOICE_FINANCE_STAGES.map((s, i) => {
            const isPast    = i < stageIdx
            const isCurrent = s.id === localCard.stage
            const isFuture  = i > stageIdx
            return (
              <div key={s.id} className="flex items-center">
                {i > 0 && <span style={{ color: '#d4d4d4', fontSize: 10, margin: '0 4px' }}>›</span>}
                <button onClick={() => !isCurrent && handleStageMove(s.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 8,
                    border: isCurrent ? '1px solid #86d6a3' : '1px solid transparent',
                    background: isCurrent ? '#dcfce7' : 'transparent',
                    cursor: isCurrent ? 'default' : 'pointer',
                  }}>
                  <span style={{
                    width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                    border: `1.5px solid ${isPast ? '#d4d4d4' : isCurrent ? '#16a34a' : '#e5e5e5'}`,
                    background: isPast ? '#f0f0f0' : isCurrent ? '#16a34a' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'white',
                  }}>{isPast ? '✓' : ''}</span>
                  <span style={{ fontSize: 11, fontWeight: isCurrent ? 700 : 500, color: isPast ? '#a3a3a3' : isCurrent ? '#15803d' : '#64748b', whiteSpace: 'nowrap' }}>{s.label}</span>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Main split */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {/* ── Ticket Details accordion ── */}
          <div style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', background: 'white' }}>
            <button
              onClick={() => setTicketOpen(o => !o)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Ticket Details</span>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#475569' }}>
                  {stageLabel}
                </span>
                {!ticketOpen && (
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginLeft: 4 }}>
                    {localCard.seller} → {localCard.buyer || '—'} · {localCard.sector}
                  </span>
                )}
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="2" strokeLinecap="round"
                style={{ transform: ticketOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {ticketOpen && (
              <div style={{ padding: '0 24px 16px' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'stretch', marginBottom: 12 }}>
                  <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e5e5e5' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Raised by (Seller)</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{localCard.seller}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </div>
                  <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e5e5e5' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Raised for (Buyer)</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{localCard.buyer || '—'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: '#64748b' }}>
                  <span>Sector: <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#475569' }}>{localCard.sector}</span></span>
                  <span>Assigned: <strong style={{ color: '#262626' }}>{localCard.assignedTo || '—'}</strong></span>
                  {localCard.submittedAt && <span>Submitted: <strong style={{ color: '#262626' }}>{localCard.submittedAt}</strong></span>}
                </div>
              </div>
            )}
          </div>

          {/* Tab bar */}
          <div className="sticky top-0 z-20 flex items-center gap-0 px-6 border-b border-black/5" style={{ background: 'var(--color-page)', paddingTop: 0 }}>
            <div className="flex items-end gap-0 flex-1" style={{ paddingTop: 8 }}>
              {[{ id: 'overview', label: 'Overview' }, { id: 'documents', label: `Documents (${localCard.documents.length})` }].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  padding: '7px 16px 8px', fontSize: 12, fontWeight: activeTab === tab.id ? 700 : 500,
                  color: activeTab === tab.id ? 'var(--color-primary)' : '#525252', background: 'none', border: 'none',
                  borderBottom: activeTab === tab.id ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}>{tab.label}</button>
              ))}
            </div>
            <button onClick={() => setShowInvoice(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', fontSize: 11, fontWeight: 600, color: '#475569', cursor: 'pointer', flexShrink: 0, marginLeft: 8 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              View Invoice
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="p-6 space-y-6">
              {/* Yumnai briefing */}
              <YumnaiBriefing
                message={localCard.yumnaiSuggestion?.message}
                nextAction={localCard.yumnaiSuggestion?.nextAction}
                statusItems={(() => {
                  const verified = localCard.invoiceAiCheck?.status === 'verified'
                  const s = localCard.stage
                  if (s === 'if_new_invoice' && verified) return [
                    { label: 'Verification complete', done: true },
                    { label: 'Buyer approval pending', pending: true },
                  ]
                  if (s === 'if_buyer_approval') return [
                    { label: 'Verification complete', done: true },
                    { label: 'Buyer approval pending', pending: true },
                  ]
                  if (['if_payment_plan', 'if_advance_payment', 'if_ship_notice', 'if_delivery_notice'].includes(s)) return [
                    { label: 'Verification complete', done: true },
                    { label: 'Buyer approved', done: true },
                  ]
                  if (s === 'if_disbursement') return [
                    { label: 'Verification complete', done: true },
                    { label: 'Buyer approved', done: true },
                    { label: 'Disbursement pending', pending: true },
                  ]
                  if (s === 'if_active') return [
                    { label: 'Verification complete', done: true },
                    { label: 'Buyer approved', done: true },
                    { label: 'Disbursed', done: true },
                  ]
                  return undefined
                })()}
              />


              {/* ── Card 2: Finance Details ── */}
              <div className="bg-white rounded-2xl border border-black/5 p-5">
                <div style={{ fontSize: 10, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Finance Details</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 3 }}><SARAmount amount={localCard.amount} /></div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>Invoice amount requested</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  <div style={{ padding: '6px 12px', borderRadius: 20, background: '#f8fafc', border: '1px solid #e5e5e5', fontSize: 12, color: '#475569' }}>
                    MDR <strong style={{ color: '#262626' }}>{localCard.mdrRate}%</strong>
                    <span style={{ marginLeft: 4, color: localCard.mdrPayer === 'seller_full' ? '#0369a1' : '#475569', fontWeight: 600 }}>
                      · {localCard.mdrPayer === 'seller_full' ? 'Seller pays' : localCard.mdrPayer === 'buyer_full' ? 'Buyer pays' : 'Split 50/50'}
                    </span>
                  </div>
                  <div style={{ padding: '6px 12px', borderRadius: 20, background: '#f8fafc', border: '1px solid #e5e5e5', fontSize: 12, color: '#475569' }}>
                    <strong style={{ color: '#262626' }}>{localCard.tenure}</strong> days
                  </div>
                  <div style={{ padding: '6px 12px', borderRadius: 20, background: '#f8fafc', border: '1px solid #e5e5e5', fontSize: 12, color: '#475569', textTransform: 'capitalize' }}>
                    {localCard.emiFrequency} EMI
                  </div>
                </div>
                <div style={{ padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e5e5e5', display: 'flex', gap: 20, fontSize: 12, color: '#475569', marginBottom: buyerInfo ? 14 : 0 }}>
                  <span>MDR Fee: <strong style={{ color: '#262626' }}><SARAmount amount={mdrFee} /></strong></span>
                  <span>Net to Seller: <strong style={{ color: '#262626' }}><SARAmount amount={netToSeller} /></strong></span>
                </div>
                {buyerInfo && (() => {
                  const available = buyerInfo.creditLimit - buyerInfo.creditUsed
                  const util = buyerInfo.creditUsed / buyerInfo.creditLimit
                  const barColor = util > 0.85 ? '#b91c1c' : util > 0.6 ? '#a16207' : '#16a34a'
                  return (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                        <span>Buyer credit · <SARAmount amount={buyerInfo.creditUsed} /> used of <SARAmount amount={buyerInfo.creditLimit} /></span>
                        <span style={{ color: barColor }}>{Math.round(util * 100)}%</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 20, background: '#f1f5f9', overflow: 'hidden', marginBottom: 3 }}>
                        <div style={{ height: '100%', borderRadius: 20, width: `${Math.min(util * 100, 100)}%`, background: barColor }} />
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Available: <strong style={{ color: '#262626' }}><SARAmount amount={Math.max(available, 0)} /></strong></div>
                    </div>
                  )
                })()}
                {localCard.acceptedAt && (() => {
                  const startDate = localCard.acceptedAt.split(' ')[0]
                  const d = new Date(startDate)
                  d.setDate(d.getDate() + (localCard.tenure || 0))
                  const endDate = d.toISOString().split('T')[0]
                  return (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9', display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 12, color: '#64748b' }}>
                      <span>Repayment Start: <strong style={{ color: '#262626' }}>{startDate}</strong></span>
                      <span>Repayment End: <strong style={{ color: '#262626' }}>{endDate}</strong></span>
                    </div>
                  )
                })()}
              </div>

              {/* ── Card 3: Invoice ── */}
              <div className="bg-white rounded-2xl border border-black/5 p-5">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Invoice</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', fontFamily: 'monospace', marginBottom: 8 }}>{localCard.invoiceNumber}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: '#64748b' }}>
                      {localCard.commodityBroker && <span>Commodity: <strong style={{ color: '#262626' }}>{localCard.commodityBroker}</strong></span>}
                      {localCard.saleBroker && <span>Sale via: <strong style={{ color: '#262626' }}>{localCard.saleBroker}</strong></span>}
                    </div>
                  </div>
                </div>
              </div>

              {INVOICE_FINANCE_STAGES.find(s => s.id === localCard.stage)?.auto
                && localCard.stage !== 'if_active'
                && localCard.stage !== 'if_new_invoice'
                && localCard.stage !== 'if_buyer_approval'
                && localCard.stage !== 'if_payment_plan'
                && localCard.stage !== 'if_advance_payment' && (
                <div className="bg-white rounded-2xl border border-black/5 p-5">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8', display: 'inline-block', flexShrink: 0 }} />
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>System Processing</div>
                  </div>
                  <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12, color: '#64748b' }}>
                    {IF_STAGE_HINT[localCard.stage]}
                  </div>
                </div>
              )}

              {localCard.stage === 'if_new_invoice' && (
                <div className="bg-white rounded-2xl border border-black/5 p-5">
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>AI Invoice Verification</div>

                  {localCard.invoiceAiCheck?.checks.map(check => (
                    <div key={check.field} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, marginBottom: 6, background: check.pass ? '#f0fdf4' : '#fef2f2', border: `1px solid ${check.pass ? '#bbf7d0' : '#fecaca'}` }}>
                      <span style={{ fontSize: 13, flexShrink: 0, fontWeight: 700, color: check.pass ? '#15803d' : '#b91c1c' }}>{check.pass ? '✓' : '✗'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: check.pass ? '#15803d' : '#b91c1c' }}>{check.field}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Invoice: <strong style={{ color: '#262626' }}>{check.invoiceValue}</strong> · Expected: {check.requestValue}</div>
                      </div>
                    </div>
                  ))}

                  {localCard.invoiceAiCheck?.status === 'verified' && (
                    <div style={{ marginTop: 14, padding: '9px 13px', borderRadius: 10, background: 'rgba(144,132,253,0.06)', border: '1px solid rgba(144,132,253,0.2)', fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 18 }}>
                      ✦ Yumnai verified — all invoice fields match the finance request
                    </div>
                  )}

                  {localCard.invoiceAiCheck?.status === 'verified' && (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Buyer Confirmation — Auto-dispatched</div>
                      <div style={{ borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 12 }}>
                        <div style={{ padding: '8px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Message Sent to Buyer
                        </div>
                        <div style={{ padding: '12px 14px', fontSize: 12, color: '#334155', lineHeight: 1.75 }}>
                          Dear <strong style={{ color: '#262626' }}>{localCard.buyer || 'buyer'}</strong>, Yumna Finance has verified your invoice from <strong style={{ color: '#262626' }}>{localCard.seller}</strong> for <strong style={{ color: '#262626' }}>{formatSAR(localCard.amount)}</strong> (dated {localCard.invoiceAiCheck?.checks.find(c => c.field === 'Date of Issue')?.invoiceValue || localCard.submittedAt}).
                          <br/><br/>To confirm this purchase:
                          <br/>• Reply <strong>YES</strong> to this message, or
                          <br/>• View details &amp; confirm:&nbsp;
                          <span style={{ color: 'var(--color-primary)', fontWeight: 600, fontFamily: 'monospace', fontSize: 11 }}>yumna.finance/confirm/{localCard.id}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: '#dcfce7', border: '1px solid #bbf7d0', fontSize: 11, fontWeight: 700, color: '#15803d' }}>
                          ✓ WhatsApp sent
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: '#dcfce7', border: '1px solid #bbf7d0', fontSize: 11, fontWeight: 700, color: '#15803d' }}>
                          ✓ SMS sent
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {localCard.stage === 'if_buyer_approval' && (() => {
                const bas = localCard.buyerApprovalStatus
                const sellerStatus = bas?.seller?.status || 'submitted'
                const buyerStatus  = bas?.buyer?.status  || 'pending'

                // Timer computation
                let elapsedLabel = '—', remainsLabel = '—', isExpired = false, urgency = 'normal'
                if (bas?.sentAt) {
                  const sent     = new Date(bas.sentAt).getTime()
                  const deadline = sent + (bas.deadlineHours || 72) * 3600 * 1000
                  const now      = Date.now()
                  const elapsed  = now - sent
                  const remains  = deadline - now

                  const fmtDuration = (ms) => {
                    const totalH = Math.floor(Math.abs(ms) / 3600000)
                    const m      = Math.floor((Math.abs(ms) % 3600000) / 60000)
                    if (totalH >= 24) return `${Math.floor(totalH / 24)}d ${totalH % 24}h`
                    return `${totalH}h ${m}m`
                  }

                  elapsedLabel = fmtDuration(elapsed) + ' ago'
                  if (remains <= 0) {
                    isExpired    = true
                    remainsLabel = 'Expired ' + fmtDuration(remains) + ' ago'
                    urgency      = 'high'
                  } else {
                    remainsLabel = fmtDuration(remains) + ' remaining'
                    urgency      = remains < 12 * 3600000 ? 'high' : remains < 24 * 3600000 ? 'medium' : 'normal'
                  }
                }

                const buyerBg    = buyerStatus === 'approved' ? '#f0fdf4' : buyerStatus === 'denied' ? '#fef2f2' : '#fffbeb'
                const buyerBorder= buyerStatus === 'approved' ? '#bbf7d0' : buyerStatus === 'denied' ? '#fecaca' : '#fde68a'
                const buyerColor = buyerStatus === 'approved' ? '#15803d' : buyerStatus === 'denied' ? '#b91c1c' : '#92400e'
                const buyerIcon  = buyerStatus === 'approved' ? '✓' : buyerStatus === 'denied' ? '✗' : '⏳'
                const buyerLabel = buyerStatus === 'approved' ? 'Approved' : buyerStatus === 'denied' ? 'Denied' : 'Pending response'

                const timerBg    = urgency === 'high' ? '#fef2f2' : urgency === 'medium' ? '#fffbeb' : '#f8fafc'
                const timerBorder= urgency === 'high' ? '#fecaca' : urgency === 'medium' ? '#fde68a' : '#e2e8f0'
                const timerColor = urgency === 'high' ? '#b91c1c' : urgency === 'medium' ? '#92400e' : '#475569'

                return (
                  <div className="bg-white rounded-2xl border border-black/5 p-5">
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Approval Status</div>

                    {/* Seller row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: 8 }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>🏢</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#262626', marginBottom: 1 }}>{localCard.seller}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Invoice submitted · {bas?.seller?.at ? new Date(bas.seller.at).toLocaleDateString('en-SA', { dateStyle: 'medium' }) : localCard.submittedAt}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d', background: '#dcfce7', padding: '3px 10px', borderRadius: 20, flexShrink: 0 }}>✓ Submitted</span>
                    </div>

                    {/* Buyer row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, background: buyerBg, border: `1px solid ${buyerBorder}`, marginBottom: 16 }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>👤</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#262626', marginBottom: 1 }}>{localCard.buyer || 'Buyer'}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                          {buyerStatus === 'pending' ? 'Confirmation sent via WhatsApp + SMS' : `Response recorded ${bas?.buyer?.at ? new Date(bas.buyer.at).toLocaleString('en-SA', { dateStyle: 'short', timeStyle: 'short' }) : ''}`}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: buyerColor, background: buyerBg, border: `1px solid ${buyerBorder}`, padding: '3px 10px', borderRadius: 20, flexShrink: 0 }}>{buyerIcon} {buyerLabel}</span>
                    </div>

                    {/* Timer */}
                    <div style={{ borderRadius: 10, background: timerBg, border: `1px solid ${timerBorder}`, overflow: 'hidden' }}>
                      <div style={{ padding: '7px 14px', borderBottom: `1px solid ${timerBorder}`, fontSize: 10, fontWeight: 700, color: timerColor, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>⏱</span> Response Window ({bas?.deadlineHours || 72}h)
                      </div>
                      <div style={{ display: 'flex', padding: '10px 14px', gap: 0 }}>
                        <div style={{ flex: 1, borderRight: `1px solid ${timerBorder}`, paddingRight: 14 }}>
                          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sent</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>{elapsedLabel}</div>
                        </div>
                        <div style={{ flex: 1, paddingLeft: 14 }}>
                          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{isExpired ? 'Status' : 'Deadline'}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: timerColor }}>{remainsLabel}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {localCard.stage === 'if_payment_plan' && (() => {
                const pps = localCard.paymentPlanStatus
                const sel = pps?.selection

                let elapsedLabel = '—', remainsLabel = '—', isExpired = false, urgency = 'normal'
                if (pps?.sentAt) {
                  const sent     = new Date(pps.sentAt).getTime()
                  const deadline = sent + (pps.deadlineHours || 48) * 3600 * 1000
                  const now      = Date.now()
                  const elapsed  = now - sent
                  const remains  = deadline - now
                  const fmtD = (ms) => {
                    const h = Math.floor(Math.abs(ms) / 3600000)
                    const m = Math.floor((Math.abs(ms) % 3600000) / 60000)
                    return h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h ${m}m`
                  }
                  elapsedLabel = fmtD(elapsed) + ' ago'
                  if (remains <= 0) { isExpired = true; remainsLabel = 'Expired ' + fmtD(remains) + ' ago'; urgency = 'high' }
                  else { remainsLabel = fmtD(remains) + ' remaining'; urgency = remains < 8 * 3600000 ? 'high' : remains < 20 * 3600000 ? 'medium' : 'normal' }
                }
                const timerBg     = urgency === 'high' ? '#fef2f2' : urgency === 'medium' ? '#fffbeb' : '#f8fafc'
                const timerBorder = urgency === 'high' ? '#fecaca' : urgency === 'medium' ? '#fde68a' : '#e2e8f0'
                const timerColor  = urgency === 'high' ? '#b91c1c' : urgency === 'medium' ? '#92400e' : '#475569'

                const freqLabel = (f) => f === 'lump_sum' ? 'Lump sum at end' : f === 'bimonthly' ? 'Bi-monthly' : f ? f.charAt(0).toUpperCase() + f.slice(1) : '—'

                return (
                  <div className="bg-white rounded-2xl border border-black/5 p-5">
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Payment Plan Selection</div>

                    {/* Auto-dispatched row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: '#dcfce7', border: '1px solid #bbf7d0', fontSize: 11, fontWeight: 700, color: '#15803d' }}>✓ WhatsApp sent</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: '#dcfce7', border: '1px solid #bbf7d0', fontSize: 11, fontWeight: 700, color: '#15803d' }}>✓ SMS sent</span>
                      {pps?.link && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: 'rgba(144,132,253,0.08)', border: '1px solid rgba(144,132,253,0.25)', fontSize: 10, fontWeight: 600, color: 'var(--color-primary)', fontFamily: 'monospace' }}>{pps.link}</span>
                      )}
                    </div>

                    {/* Plan options offered */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Options Offered to Buyer</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b', padding: '2px 8px', borderRadius: 6, background: '#f1f5f9', border: '1px solid #e2e8f0' }}>Tenure</span>
                        {['30 days', '60 days', '90 days'].map(t => (
                          <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: sel?.status === 'selected' && sel.tenure === parseInt(t) ? 'rgba(144,132,253,0.12)' : '#f8fafc', border: `1px solid ${sel?.status === 'selected' && sel.tenure === parseInt(t) ? 'rgba(144,132,253,0.35)' : '#e2e8f0'}`, color: sel?.status === 'selected' && sel.tenure === parseInt(t) ? 'var(--color-primary)' : '#475569' }}>{t}</span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b', padding: '2px 8px', borderRadius: 6, background: '#f1f5f9', border: '1px solid #e2e8f0' }}>Payment</span>
                        {[{ key: 'monthly', label: 'Monthly' }, { key: 'lump_sum', label: 'Lump sum at end' }].map(opt => (
                          <span key={opt.key} style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: sel?.status === 'selected' && sel.frequency === opt.key ? 'rgba(144,132,253,0.12)' : '#f8fafc', border: `1px solid ${sel?.status === 'selected' && sel.frequency === opt.key ? 'rgba(144,132,253,0.35)' : '#e2e8f0'}`, color: sel?.status === 'selected' && sel.frequency === opt.key ? 'var(--color-primary)' : '#475569' }}>{opt.label}</span>
                        ))}
                      </div>
                    </div>

                    {/* Buyer selection status */}
                    <div style={{ padding: '11px 14px', borderRadius: 10, marginBottom: 14,
                      background: sel?.status === 'selected' ? '#f0fdf4' : '#fffbeb',
                      border: `1px solid ${sel?.status === 'selected' ? '#bbf7d0' : '#fde68a'}` }}>
                      {sel?.status === 'selected' ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d', marginBottom: 2 }}>✓ Plan selected by buyer</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{sel.tenure} days · {freqLabel(sel.frequency)}{sel.advancePaidOnLink ? ' · Advance paid on link' : ''}</div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>⏳ Awaiting buyer selection</div>
                      )}
                    </div>

                    {sel?.status === 'selected' && <RepaymentSchedule schedule={localCard.instalmentSchedule} />}

                    {/* Timer */}
                    <div style={{ borderRadius: 10, background: timerBg, border: `1px solid ${timerBorder}`, overflow: 'hidden' }}>
                      <div style={{ padding: '7px 14px', borderBottom: `1px solid ${timerBorder}`, fontSize: 10, fontWeight: 700, color: timerColor, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>⏱</span> Response Window ({pps?.deadlineHours || 48}h)
                      </div>
                      <div style={{ display: 'flex', padding: '10px 14px' }}>
                        <div style={{ flex: 1, borderRight: `1px solid ${timerBorder}`, paddingRight: 14 }}>
                          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sent</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>{elapsedLabel}</div>
                        </div>
                        <div style={{ flex: 1, paddingLeft: 14 }}>
                          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{isExpired ? 'Status' : 'Deadline'}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: timerColor }}>{remainsLabel}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {localCard.stage === 'if_advance_payment' && (() => {
                const pps = localCard.paymentPlanStatus
                const sel = pps?.selection
                const advancePaid = sel?.advancePaidOnLink === true
                const freqLabel = (f) => f === 'lump_sum' ? 'Lump sum at end' : f === 'bimonthly' ? 'Bi-monthly' : f ? f.charAt(0).toUpperCase() + f.slice(1) : '—'

                return (
                  <div className="bg-white rounded-2xl border border-black/5 p-5">
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Advance Payment</div>

                    {/* Confirmed plan */}
                    <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Confirmed Payment Plan</div>
                      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>Tenure</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#262626' }}>{sel?.tenure || localCard.tenure || '—'} days</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>Repayment</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#262626' }}>{freqLabel(sel?.frequency || localCard.emiFrequency)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>Invoice Amount</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#262626' }}><SARAmount amount={localCard.amount} /></div>
                        </div>
                      </div>
                    </div>

                    {/* Advance payment status */}
                    <div style={{ padding: '12px 14px', borderRadius: 10, background: advancePaid ? '#f0fdf4' : '#fffbeb', border: `1px solid ${advancePaid ? '#bbf7d0' : '#fde68a'}`, marginBottom: advancePaid ? 14 : 0 }}>
                      {advancePaid ? (
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>✓ Advance paid on confirmation link</div>
                      ) : (
                        <>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>⏳ Advance payment pending</div>
                          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>Buyer can complete payment via the same link:</div>
                          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-primary)', fontFamily: 'monospace', padding: '4px 10px', borderRadius: 20, background: 'rgba(144,132,253,0.08)', border: '1px solid rgba(144,132,253,0.25)' }}>
                            {pps?.link || `yumna.finance/plan/${localCard.id}`}
                          </span>
                        </>
                      )}
                    </div>

                    {advancePaid && <RepaymentSchedule schedule={localCard.instalmentSchedule} />}
                  </div>
                )
              })()}

              {localCard.stage === 'if_ship_notice' && (() => {
                const sel = localCard.paymentPlanStatus?.selection
                const freqLabel = (f) => f === 'lump_sum' ? 'Lump sum at end' : f === 'bimonthly' ? 'Bi-monthly' : f ? f.charAt(0).toUpperCase() + f.slice(1) : '—'
                const tenure   = sel?.tenure    || localCard.tenure
                const frequency = sel?.frequency || localCard.emiFrequency
                const yumnaiMsg = localCard.correspondence?.find(m => m.from === 'Yumnai AI')
                return (
                  <div className="bg-white rounded-2xl border border-black/5 p-5">
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Deal Confirmed — Awaiting Shipment</div>

                    {/* Status checklist */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                      {[
                        'Buyer approved',
                        `Payment plan selected — ${tenure} days · ${freqLabel(frequency)}`,
                        'Advance payment confirmed',
                        'Merchant notified to ship',
                      ].map((label, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, fontWeight: 600, color: '#15803d' }}>
                          <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#dcfce7', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, flexShrink: 0 }}>✓</span>
                          {label}
                        </div>
                      ))}
                    </div>

                    {/* Repayment schedule */}
                    <RepaymentSchedule schedule={localCard.instalmentSchedule} />

                    {/* Yumnai merchant notification preview */}
                    {yumnaiMsg && (
                      <div style={{ border: '1px solid rgba(144,132,253,0.25)', borderRadius: 12, overflow: 'hidden' }}>
                        <div style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #9084fd 0%, #6a7bff 50%, #3da4ff 100%)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'white' }}>✦ Yumnai — Merchant Notification Sent</span>
                        </div>
                        <div style={{ padding: '12px 14px', background: 'rgba(144,132,253,0.03)', fontSize: 12, color: '#475569', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                          {yumnaiMsg.message}
                        </div>
                        <div style={{ padding: '5px 14px 8px', fontSize: 10, color: '#94a3b8' }}>{yumnaiMsg.time}</div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {localCard.stage === 'if_delivery_notice' && (() => {
                const sel = localCard.paymentPlanStatus?.selection
                const freqLabel = (f) => f === 'lump_sum' ? 'Lump sum at end' : f === 'bimonthly' ? 'Bi-monthly' : f ? f.charAt(0).toUpperCase() + f.slice(1) : '—'
                const tenure   = sel?.tenure    || localCard.tenure
                const frequency = sel?.frequency || localCard.emiFrequency
                return (
                  <div className="bg-white rounded-2xl border border-black/5 p-5">
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Goods in Transit</div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                      {[
                        'Buyer approved',
                        `Payment plan selected — ${tenure} days · ${freqLabel(frequency)}`,
                        'Advance payment confirmed',
                        'Merchant shipped',
                      ].map((label, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, fontWeight: 600, color: '#15803d' }}>
                          <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#dcfce7', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, flexShrink: 0 }}>✓</span>
                          {label}
                        </div>
                      ))}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, fontWeight: 600, color: '#92400e' }}>
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#fef3c7', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, flexShrink: 0 }}>⏳</span>
                        Awaiting delivery confirmation
                      </div>
                    </div>

                    <RepaymentSchedule schedule={localCard.instalmentSchedule} />
                  </div>
                )
              })()}

              {localCard.stage === 'if_disbursement' && (
                <div className="bg-white rounded-2xl border border-black/5 p-5">
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Disbursement Summary</div>
                  <div style={{ border: '1px solid #dcfce7', borderRadius: 12, padding: '14px 16px', background: '#f0fdf4', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>Invoice Amount</span>
                      <span style={{ fontWeight: 700, color: '#262626' }}><SARAmount amount={localCard.amount} /></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>MDR ({localCard.mdrRate}% — {localCard.mdrPayer === 'seller_full' ? 'Seller' : localCard.mdrPayer === 'buyer_full' ? 'Buyer' : 'Split'})</span>
                      <span style={{ fontWeight: 700, color: '#737373' }}>− <SARAmount amount={localCard.amount * localCard.mdrRate / 100} /></span>
                    </div>
                    {localCard.mdrPayer === 'split_50_50' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#a3a3a3', paddingLeft: 8 }}>
                        <span>Seller share</span><span>− <SARAmount amount={localCard.amount * localCard.mdrRate / 200} /></span>
                      </div>
                    )}
                    <div style={{ borderTop: '1px solid #bbf7d0', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ fontWeight: 600, color: '#15803d' }}>Net to Merchant</span>
                      <span style={{ fontWeight: 800, color: '#15803d' }}>
                        <SARAmount amount={localCard.amount - (localCard.mdrPayer === 'buyer_full' ? 0 : localCard.mdrPayer === 'seller_full' ? localCard.amount * localCard.mdrRate / 100 : localCard.amount * localCard.mdrRate / 200)} />
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>Payment Tenure</span>
                      <span style={{ fontWeight: 700, color: '#262626' }}>{localCard.tenure} days ({localCard.emiFrequency})</span>
                    </div>
                  </div>
                  <RepaymentSchedule schedule={localCard.instalmentSchedule} />
                </div>
              )}

              {localCard.stage === 'if_active' && (
                <div className="bg-white rounded-2xl border border-black/5 p-5">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: 16 }}>✅</span>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Payment Plan Active</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>Buyer</span>
                      <span style={{ fontWeight: 700, color: '#262626' }}>{localCard.buyer || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>Tenure</span>
                      <span style={{ fontWeight: 700, color: '#262626' }}>{localCard.tenure} days ({localCard.emiFrequency})</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>Total Financed</span>
                      <span style={{ fontWeight: 700, color: '#262626' }}><SARAmount amount={localCard.amount} /></span>
                    </div>
                  </div>
                  <RepaymentSchedule schedule={localCard.instalmentSchedule} />
                </div>
              )}

            </div>
          )}
          {activeTab === 'documents' && <div className="p-6"><DocumentsTab documents={localCard.documents} /></div>}
        </div>
        </div>
        <ChatterPanel correspondence={localCard.correspondence} onSend={handleSend} />
      </div>

      {/* ── Action bar — full width, above nothing, below both panels ── */}
      <div className="shrink-0" style={{ background: 'rgba(248,250,252,0.97)', backdropFilter: 'blur(8px)', borderTop: '1px solid #e2e8f0', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* Lane navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={onPrevInLane} disabled={!laneIdx || laneIdx <= 0}
            className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span style={{ fontSize: 11, color: '#525252', whiteSpace: 'nowrap' }}>
            {laneTotal === 1
              ? <span>Only ticket in <strong style={{ color: '#262626' }}>{stageLabel}</strong></span>
              : <><strong style={{ color: '#262626' }}>{(laneIdx ?? 0) + 1}</strong> / {laneTotal} in <strong style={{ color: '#262626' }}>{stageLabel}</strong></>}
          </span>
          <button onClick={onNextInLane} disabled={(laneIdx ?? 0) >= laneTotal - 1}
            className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        <span style={{ width: 1, height: 18, background: '#e5e5e5', flexShrink: 0 }} />
        {/* Stage hint */}
        {IF_STAGE_HINT[localCard.stage] && (
          <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>{IF_STAGE_HINT[localCard.stage]}</span>
        )}
        <div style={{ flex: 1 }} />
        {/* Primary CTA */}
        {(() => {
          const stageInfo = INVOICE_FINANCE_STAGES.find(s => s.id === localCard.stage)
          if (stageInfo?.terminal) {
            return <span style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>✅ Payment plan active</span>
          }
          if (localCard.stage === 'if_new_invoice') {
            return (
              <button onClick={handleAccept} style={{ padding: '7px 18px', borderRadius: 20, border: 'none', background: 'linear-gradient(135deg, #9084fd 0%, #6a7bff 50%, #3da4ff 100%)', fontSize: 13, fontWeight: 700, color: 'white', cursor: 'pointer', boxShadow: '0 2px 8px rgba(144,132,253,0.4)' }}>
                Move to Buyer Approval →
              </button>
            )
          }
          if (stageInfo?.auto) {
            return (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: '#f1f5f9', border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', display: 'inline-block' }} />
                Automated
              </span>
            )
          }
          return (
            <button onClick={handleAccept} style={{ padding: '7px 18px', borderRadius: 20, border: 'none', background: 'linear-gradient(135deg, #9084fd 0%, #6a7bff 50%, #3da4ff 100%)', fontSize: 13, fontWeight: 700, color: 'white', cursor: 'pointer', boxShadow: '0 2px 8px rgba(144,132,253,0.4)' }}>
              {IF_ACCEPT_LABEL[localCard.stage] || 'Advance →'}
            </button>
          )
        })()}
        {/* Assigned to */}
        <span style={{ fontSize: 11, color: '#a3a3a3' }}>
          Assigned: <strong style={{ color: '#404040' }}>{localCard.assignedTo || '—'}</strong>
        </span>
      </div>
    </div>
    {showInvoice && <InvoiceModal card={localCard} onClose={() => setShowInvoice(false)} />}
    </>
  )
}

// ── Shared kanban search + filter bar ─────────────────────────────────────────
function FilterBar({ searchQuery, setSearchQuery, showFilters, setShowFilters, activeFilterCount, filterAssignee, setFilterAssignee, filterRiskMin, setFilterRiskMin, filterRiskMax, setFilterRiskMax, filterDaysMin, setFilterDaysMin, clearFilters, allAssignees, totalCount, filteredCount }) {
  const inputStyle = { border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 10px', fontSize: 12, background: 'white', outline: 'none', color: '#262626' }
  return (
    <>
      <div className="px-4 py-2.5 border-b border-black/5 flex items-center gap-2.5 shrink-0 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[180px] border border-black/10 rounded-lg px-3 py-1.5 bg-white/70 backdrop-blur-sm focus-within:bg-white focus-within:border-slate-300 transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search buyer, seller, or ID…" className="flex-1 bg-transparent outline-none text-[12px] text-slate-700 placeholder-slate-400" />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>
        <button onClick={() => setShowFilters(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all border"
          style={{ background: showFilters ? 'rgba(0,0,0,0.03)' : '#f5f5f5', borderColor: showFilters ? 'rgba(0,0,0,0.1)' : '#e5e5e5', color: showFilters ? '#4f46e5' : '#64748b' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          Filters {activeFilterCount > 0 && <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: 'var(--color-primary)' }}>{activeFilterCount}</span>}
        </button>
        <div style={{ width: 1, height: 18, background: '#e5e5e5' }} />
        <div className="ml-auto">
          <span className="text-[11px] text-slate-400">
            {searchQuery || activeFilterCount > 0 ? <><strong style={{ color: '#262626' }}>{filteredCount}</strong> of {totalCount}</> : <>{totalCount} requests</>}
          </span>
        </div>
      </div>
      {showFilters && (
        <div className="px-4 py-2 border-b border-slate-100 shrink-0 flex items-center gap-4 flex-wrap" style={{ background: '#f5f5f5' }}>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Assigned to</span>
            <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} style={inputStyle}>
              <option value="">All</option>
              {allAssignees.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          {filterRiskMin !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Risk score</span>
              <input type="number" min="0" max="100" value={filterRiskMin} onChange={e => setFilterRiskMin(e.target.value)} placeholder="Min" style={{ ...inputStyle, width: 52 }} />
              <span className="text-[11px] text-slate-400">–</span>
              <input type="number" min="0" max="100" value={filterRiskMax} onChange={e => setFilterRiskMax(e.target.value)} placeholder="Max" style={{ ...inputStyle, width: 52 }} />
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Stale ≥</span>
            <input type="number" min="0" value={filterDaysMin} onChange={e => setFilterDaysMin(e.target.value)} placeholder="days" style={{ ...inputStyle, width: 56 }} />
            <span className="text-[11px] text-slate-400">days</span>
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors" style={{ background: 'rgba(0,0,0,0.04)', color: '#737373' }}>Clear all</button>
          )}
        </div>
      )}
    </>
  )
}

// ── Kanban board ──────────────────────────────────────────────────────────────
function KanbanBoard({ stages, filteredCards, onCardClick, showAboveLimit }) {
  const cardsForStage = (stageId) => filteredCards.filter(c => c.stage === stageId)
  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden">
      <div className="flex gap-4 p-6 h-full" style={{ minWidth: `${stages.length * 296}px` }}>
        {stages.map(stage => {
          const stageCards = cardsForStage(stage.id)
          return (
            <div key={stage.id} className="flex flex-col shrink-0" style={{ width: 280 }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: stage.terminal ? '#22c55e' : stage.color }} />
                <span className="font-semibold text-[12px] text-slate-700 flex-1 leading-tight">{stage.label}</span>
                <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-white border border-slate-100 text-slate-500">{stageCards.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {stageCards.length === 0 && (
                  <div className="p-4 rounded-xl border-2 border-dashed border-slate-100 text-center text-[12px] text-slate-400">No items</div>
                )}
                {stageCards.map(card => {
                  const missing   = card.documents.filter(d => d.status === 'missing' || d.status === 'pending').length
                  const hasYumnai = !!card.yumnaiSuggestion?.message
                  const borderColor = card.daysInStage >= 3 ? '#ef4444' : card.daysInStage >= 1 ? '#f59e0b' : '#e5e5e5'
                  const borderWidth = card.daysInStage >= 1 ? '1.5px' : '1px'
                  const daysChipStyle = card.daysInStage >= 3
                    ? { background: '#fef2f2', color: '#dc2626' }
                    : card.daysInStage >= 1
                      ? { background: '#fffbeb', color: '#b45309' }
                      : { background: '#f1f5f9', color: '#64748b' }
                  return (
                    <button key={card.id} onClick={() => onCardClick(card)}
                      className="w-full text-start bg-white rounded-2xl p-4 hover:shadow-md transition-all"
                      style={{ border: `${borderWidth} solid ${borderColor}` }}>

                      {/* Row 1: ID + days badge */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-mono font-semibold text-slate-600">{card.id}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={daysChipStyle}>
                          {card.daysInStage === 0 ? 'new' : `${card.daysInStage}d`}
                        </span>
                      </div>

                      {/* Row 2: Seller */}
                      <div className="text-[13px] font-semibold text-slate-800 leading-tight mb-0.5 truncate">{card.seller}</div>

                      {/* Row 3: Buyer */}
                      {card.buyer && <div className="text-[11px] text-slate-400 mb-0.5">→ {card.buyer}</div>}

                      {/* Row 4: Sector */}
                      {card.sector && <div className="text-[11px] text-slate-400 mb-2">{card.sector}</div>}

                      {/* Row 5: Amount */}
                      <div className="text-[14px] font-bold tabular-nums text-slate-900 mb-2"><SARAmount amount={card.amount} /></div>

                      {/* Row 6: Stage status + flags */}
                      <div className="mb-3 flex flex-wrap items-center gap-1.5">
                        <span style={{ fontSize: 11, color: '#525252' }}>{IF_CARD_STATUS[card.stage]?.(card)}</span>
                        {missing > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">{missing} doc{missing > 1 ? 's' : ''} pending</span>}
                      </div>

                      {/* Row 7: Assignee + Yumnai */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 truncate">👤 {card.assignedTo || '—'}</span>
                        {hasYumnai && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1" style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--color-primary)' }}>✦ Yumnai</span>
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
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function FinanceRequestsPipeline({ onBreadcrumb }) {
  const { state } = useApp()
  const adminRole = state.currentUser?.adminRole

  const [activeSubView, setActiveSubView] = useState('invoice_finance')

  // Direct state
  const [frCards, setFrCards]               = useState(FINANCE_REQUEST_CARDS)
  const [selectedFrCard, setSelectedFrCard] = useState(null)
  const [frSearch, setFrSearch]             = useState('')
  const [frAssignee, setFrAssignee]         = useState('')
  const [frRiskMin, setFrRiskMin]           = useState('')
  const [frRiskMax, setFrRiskMax]           = useState('')
  const [frDaysMin, setFrDaysMin]           = useState('')
  const [frFilters, setFrFilters]           = useState(false)

  // Invoice Finance state
  const [ifCards, setIfCards]               = useState(INVOICE_FINANCE_CARDS)
  const [selectedIfCard, setSelectedIfCard] = useState(null)
  const [ifSearch, setIfSearch]             = useState('')
  const [ifAssignee, setIfAssignee]         = useState('')
  const [ifDaysMin, setIfDaysMin]           = useState('')
  const [ifFilters, setIfFilters]           = useState(false)

  const selectedCard = selectedFrCard || selectedIfCard
  useEffect(() => {
    onBreadcrumb?.(selectedCard ? { label: selectedCard.seller, id: selectedCard.id, onHome: () => { setSelectedFrCard(null); setSelectedIfCard(null) } } : null)
    return () => onBreadcrumb?.(null)
  }, [selectedFrCard, selectedIfCard])

  // Direct handlers
  const handleFrUpdate = (updated) => { setFrCards(prev => prev.map(c => c.id === updated.id ? updated : c)); setSelectedFrCard(updated) }
  const frIdx      = selectedFrCard ? frCards.findIndex(c => c.id === selectedFrCard.id) : -1
  const frLaneCards = selectedFrCard ? frCards.filter(c => c.stage === selectedFrCard.stage) : []
  const frLaneIdx   = selectedFrCard ? frLaneCards.findIndex(c => c.id === selectedFrCard.id) : 0

  // IF handlers
  const handleIfUpdate = (updated) => { setIfCards(prev => prev.map(c => c.id === updated.id ? updated : c)); setSelectedIfCard(updated) }
  const ifIdx      = selectedIfCard ? ifCards.findIndex(c => c.id === selectedIfCard.id) : -1
  const ifLaneCards = selectedIfCard ? ifCards.filter(c => c.stage === selectedIfCard.stage) : []
  const ifLaneIdx   = selectedIfCard ? ifLaneCards.findIndex(c => c.id === selectedIfCard.id) : 0

  // Card detail overlays
  if (selectedFrCard) return (
    <FRCardDetailPage key={selectedFrCard.id} card={selectedFrCard} currentIdx={frIdx} totalCards={frCards.length}
      onClose={() => setSelectedFrCard(null)}
      onPrev={() => frIdx > 0 && setSelectedFrCard(frCards[frIdx - 1])}
      onNext={() => frIdx < frCards.length - 1 && setSelectedFrCard(frCards[frIdx + 1])}
      laneCards={frLaneCards} laneIdx={frLaneIdx}
      onPrevInLane={() => frLaneIdx > 0 && setSelectedFrCard(frLaneCards[frLaneIdx - 1])}
      onNextInLane={() => frLaneIdx < frLaneCards.length - 1 && setSelectedFrCard(frLaneCards[frLaneIdx + 1])}
      onCardUpdate={handleFrUpdate} />
  )
  if (selectedIfCard) return (
    <IFCardDetailPage key={selectedIfCard.id} card={selectedIfCard} currentIdx={ifIdx} totalCards={ifCards.length}
      onClose={() => setSelectedIfCard(null)}
      onPrev={() => ifIdx > 0 && setSelectedIfCard(ifCards[ifIdx - 1])}
      onNext={() => ifIdx < ifCards.length - 1 && setSelectedIfCard(ifCards[ifIdx + 1])}
      laneCards={ifLaneCards} laneIdx={ifLaneIdx}
      onPrevInLane={() => ifLaneIdx > 0 && setSelectedIfCard(ifLaneCards[ifLaneIdx - 1])}
      onNextInLane={() => ifLaneIdx < ifLaneCards.length - 1 && setSelectedIfCard(ifLaneCards[ifLaneIdx + 1])}
      onCardUpdate={handleIfUpdate} />
  )

  // Filter helpers
  const applyFilters = (cards, q, assignee, rMin, rMax, dMin) => cards.filter(card => {
    const ql = q.trim().toLowerCase()
    if (ql && !(card.buyer || '').toLowerCase().includes(ql) && !(card.seller || '').toLowerCase().includes(ql) && !card.id.toLowerCase().includes(ql)) return false
    if (assignee && card.assignedTo !== assignee) return false
    if (rMin !== '' && card.riskScore !== null && card.riskScore < Number(rMin)) return false
    if (rMax !== '' && card.riskScore !== null && card.riskScore > Number(rMax)) return false
    if (dMin !== '' && card.daysInStage < Number(dMin)) return false
    return true
  })

  const filteredFr = applyFilters(frCards, frSearch, frAssignee, frRiskMin, frRiskMax, frDaysMin)
  const filteredIf = applyFilters(ifCards, ifSearch, ifAssignee, '', '', ifDaysMin)
  const frActiveFilters = [frAssignee, frRiskMin, frRiskMax, frDaysMin].filter(Boolean).length
  const ifActiveFilters = [ifAssignee, ifDaysMin].filter(Boolean).length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sub-view tab bar */}
      <div className="px-4 pt-2.5 pb-0 shrink-0 flex items-end gap-1 border-b border-black/5">
        {[
          { id: 'invoice_finance', label: 'Invoice Finance', count: ifCards.filter(c => c.stage !== 'if_active').length },
          { id: 'direct',          label: 'Direct',          count: frCards.filter(c => c.stage !== 'fr_closed').length },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveSubView(tab.id)} style={{
            padding: '6px 14px 8px', fontSize: 12,
            fontWeight: tab.id === activeSubView ? 700 : 500,
            color: tab.id === activeSubView ? 'var(--color-primary)' : '#64748b',
            background: 'none', border: 'none',
            borderBottom: tab.id === activeSubView ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
            cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {tab.label}
            <span style={{
              fontSize: 10, fontWeight: 600, minWidth: 18, height: 18, borderRadius: 20, padding: '0 5px',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: tab.id === activeSubView ? 'var(--color-primary)' : '#e5e5e5',
              color: tab.id === activeSubView ? 'white' : '#64748b',
            }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {activeSubView === 'direct' && (
        <>
          <FilterBar
            searchQuery={frSearch} setSearchQuery={setFrSearch}
            showFilters={frFilters} setShowFilters={setFrFilters}
            activeFilterCount={frActiveFilters}
            filterAssignee={frAssignee} setFilterAssignee={setFrAssignee}
            filterRiskMin={frRiskMin} setFilterRiskMin={setFrRiskMin}
            filterRiskMax={frRiskMax} setFilterRiskMax={setFrRiskMax}
            filterDaysMin={frDaysMin} setFilterDaysMin={setFrDaysMin}
            clearFilters={() => { setFrAssignee(''); setFrRiskMin(''); setFrRiskMax(''); setFrDaysMin('') }}
            allAssignees={[...new Set(frCards.map(c => c.assignedTo))].sort()}
            totalCount={frCards.length} filteredCount={filteredFr.length}
          />
          <KanbanBoard stages={FINANCE_REQUESTS_STAGES} filteredCards={filteredFr} onCardClick={setSelectedFrCard} />
        </>
      )}

      {activeSubView === 'invoice_finance' && (
        <>
          <FilterBar
            searchQuery={ifSearch} setSearchQuery={setIfSearch}
            showFilters={ifFilters} setShowFilters={setIfFilters}
            activeFilterCount={ifActiveFilters}
            filterAssignee={ifAssignee} setFilterAssignee={setIfAssignee}
            filterDaysMin={ifDaysMin} setFilterDaysMin={setIfDaysMin}
            clearFilters={() => { setIfAssignee(''); setIfDaysMin('') }}
            allAssignees={[...new Set(ifCards.map(c => c.assignedTo))].sort()}
            totalCount={ifCards.length} filteredCount={filteredIf.length}
          />
          <KanbanBoard stages={INVOICE_FINANCE_STAGES} filteredCards={filteredIf} onCardClick={setSelectedIfCard} />
        </>
      )}
    </div>
  )
}
