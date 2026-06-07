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

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
      <div>{children}</div>
    </div>
  )
}

// ── Shared Yumnai Briefing Block ───────────────────────────────────────────────
function YumnaiBriefing({ message }) {
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
        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #9084fd 0%, #3da4ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 5 }}>
              <img src="/yumnai.svg" alt="" style={{ width: '100%', height: '100%', filter: 'brightness(0) invert(1)' }} />
            </div>
            <div style={{ flex: 1, background: 'linear-gradient(135deg, #efedff 0%, #e9edff 50%, #e6f4ff 100%)', border: '1px solid rgba(144,132,253,0.30)', borderRadius: '4px 16px 16px 16px', padding: '10px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 4 }}>Yumnai</div>
              <p style={{ fontSize: 13, color: '#262626', lineHeight: 1.55, margin: 0 }}>{message}</p>
            </div>
          </div>
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

// ── Direct Finance Request card detail ────────────────────────────────────────
const FR_NEXT_STAGE = { fr_checking: 'fr_credit', fr_credit: 'fr_buyer_confirm', fr_buyer_confirm: 'fr_dispersal', fr_dispersal: 'fr_closed' }
const FR_ACCEPT_LABEL = {
  fr_checking: 'Send for Credit Review →',
  fr_credit: 'Send for Buyer Confirmation →',
  fr_buyer_confirm: 'Mark as Buyer Confirmed →',
  fr_dispersal: 'Confirm Disbursement →',
}

function FRCardDetailPage({ card, onClose, onCardUpdate, onPrev, onNext, currentIdx, totalCards }) {
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

  const stageIdx  = FINANCE_REQUESTS_STAGES.findIndex(s => s.id === localCard.stage)
  const buyerInfo = localCard.buyerId ? MOCK_BUYERS.find(b => b.id === localCard.buyerId) || null : null

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
          <span className="flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[12px] font-bold text-slate-700">{formatSAR(localCard.amount)}</span>
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
          <div className="shrink-0 flex items-end gap-0 px-6 pt-2 border-b border-black/5" style={{ background: 'var(--color-page)' }}>
            {[{ id: 'overview', label: 'Overview' }, { id: 'documents', label: `Documents (${localCard.documents.length})` }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: '7px 16px 8px', fontSize: 12, fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? 'var(--color-primary)' : '#525252', background: 'none', border: 'none',
                borderBottom: activeTab === tab.id ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}>{tab.label}</button>
            ))}
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
                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-primary)', marginLeft: 'auto' }}>{formatSAR(localCard.amount)}</span>
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

              <YumnaiBriefing message={localCard.yumnaiSuggestion?.message} />

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
                        <span>Limit: <strong style={{ color: '#262626' }}>{formatSAR(buyerInfo.creditLimit)}</strong></span>
                        <span>Used: <strong>{formatSAR(buyerInfo.creditUsed)}</strong></span>
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
                    <div style={{ fontSize: 10, color: '#a3a3a3', marginTop: 3 }}>Original: {formatSAR(card.amount)}</div>
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
                  <span>MDR Fee: <strong style={{ color: '#262626' }}>{formatSAR(mdrFee)}</strong></span>
                  <span>Net to Seller: <strong style={{ color: '#262626' }}>{formatSAR(netToSeller)}</strong></span>
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
                      <span style={{ fontWeight: 700, color: '#262626' }}>{formatSAR(inst.amount)}</span>
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
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#262626', lineHeight: 1 }}>{formatSAR(available)}</div>
                            <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>of {formatSAR(buyerInfo.creditLimit)} limit</div>
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
                            Requested {formatSAR(Number(editAmt))} {fits ? 'fits within available credit' : 'exceeds available credit'}
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
                      <span>Amount: <strong style={{ color: '#262626' }}>{formatSAR(Number(editAmt))}</strong></span>
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
                      <span style={{ fontWeight: 700, color: '#262626' }}>{formatSAR(Number(editAmt))}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>MDR ({editMdr}% — {editPayer === 'seller_full' ? 'Seller' : editPayer === 'buyer_full' ? 'Buyer' : 'Split'})</span>
                      <span style={{ fontWeight: 700, color: '#737373' }}>− {formatSAR(mdrFee)}</span>
                    </div>
                    <div style={{ borderTop: '1px solid #bbf7d0', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ fontWeight: 600, color: '#15803d' }}>Net Credit to Buyer</span>
                      <span style={{ fontWeight: 800, color: '#15803d' }}>
                        {formatSAR(Number(editAmt) - (editPayer === 'buyer_full' ? 0 : editPayer === 'seller_full' ? mdrFee : mdrFee / 2))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
          {activeTab === 'documents' && <div className="p-6"><DocumentsTab documents={localCard.documents} /></div>}
        </div>
        {localCard.stage !== 'fr_closed' ? (
          <div className="shrink-0 border-t border-black/5 bg-white px-6 py-3.5 flex items-center gap-3">
            <button onClick={handleContinue}
              style={{ padding: '9px 20px', borderRadius: 20, border: '1.5px solid #e5e5e5', background: 'white', fontSize: 12, fontWeight: 600, color: '#525252', cursor: 'pointer' }}>
              Continue
            </button>
            <button onClick={handleSuggest}
              style={{ padding: '9px 20px', borderRadius: 20, border: '1.5px solid rgba(144,132,253,0.3)', background: 'rgba(144,132,253,0.06)', fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', cursor: 'pointer' }}>
              Suggest
            </button>
            <button onClick={handleAccept}
              style={{ marginLeft: 'auto', padding: '9px 24px', borderRadius: 20, border: 'none', background: 'linear-gradient(135deg, #9084fd 0%, #6a7bff 50%, #3da4ff 100%)', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 12px rgba(144,132,253,0.35)' }}>
              {FR_ACCEPT_LABEL[localCard.stage] || 'Accept →'}
            </button>
          </div>
        ) : (
          <div className="shrink-0 border-t border-black/5 bg-white px-6 py-3.5 flex items-center gap-8">
            <span style={{ fontSize: 16 }}>✅</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>This request has been closed and credit disbursed.</span>
          </div>
        )}
      </div>
      <ChatterPanel correspondence={localCard.correspondence} onSend={handleSend} />
    </div>
    </div>
  )
}

// ── Invoice Finance card detail ────────────────────────────────────────────────
function IFCardDetailPage({ card, onClose, onCardUpdate, onPrev, onNext, currentIdx, totalCards }) {
  const { state } = useApp()
  const [localCard, setLocalCard] = useState(card)
  const [activeTab, setActiveTab] = useState('overview')
  const [editMdr, setEditMdr]     = useState(String(card.proposedMdrRate ?? card.mdrRate))
  const [editAmt, setEditAmt]     = useState(String(card.proposedAmount  ?? card.amount))
  const [editTen, setEditTen]     = useState(String(card.proposedTenure  ?? card.tenure))
  const [editPayer, setEditPayer] = useState(card.mdrPayer || 'seller_full')
  const [offerIssued, setOfferIssued] = useState(!!card.offerIssuedAt)
  const [accepted, setAccepted]   = useState(!!card.acceptedAt)

  useEffect(() => { setLocalCard(card) }, [card])

  const buyerInfo = localCard.buyerId ? MOCK_BUYERS.find(b => b.id === localCard.buyerId) || null : null
  const stageIdx  = INVOICE_FINANCE_STAGES.findIndex(s => s.id === localCard.stage)

  const handleStageMove = (newStageId) => {
    const updated = { ...localCard, stage: newStageId, daysInStage: 0 }
    setLocalCard(updated); onCardUpdate?.(updated)
  }
  const handleSend = (msg) => {
    const updated = { ...localCard, correspondence: [...localCard.correspondence, { from: state.currentUser?.name || 'You', message: msg, time: new Date().toLocaleString('en-SA', { dateStyle: 'short', timeStyle: 'short' }), autoRead: false }] }
    setLocalCard(updated); onCardUpdate?.(updated)
  }
  const handleSaveProposal = () => {
    const updated = { ...localCard, proposedAmount: Number(editAmt), proposedMdrRate: Number(editMdr), proposedTenure: Number(editTen), mdrPayer: editPayer }
    setLocalCard(updated); onCardUpdate?.(updated)
  }
  const mdrFee     = localCard.amount * (Number(editMdr) / 100)
  const netToSeller = localCard.amount - (editPayer === 'seller_full' ? mdrFee : editPayer === 'split_50_50' ? mdrFee / 2 : 0)

  return (
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
            <span className="flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[12px] font-bold text-slate-700">{formatSAR(localCard.amount)}</span>
          )}
          {localCard.riskScore !== null && localCard.riskScore !== undefined && (
            <span className="flex items-center px-3 py-1.5 rounded-lg border text-[11px] font-bold"
              style={{ background: riskColor(localCard.riskScore).bg, borderColor: riskColor(localCard.riskScore).bg, color: riskColor(localCard.riskScore).text }}>
              Risk {localCard.riskScore}
            </span>
          )}
          {localCard.aboveLimit && <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold" style={{ background: '#fff7ed', borderColor: '#fed7aa', color: '#c2410c' }}>⚠️ Above Limit</span>}
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
        <div className="flex-1 overflow-y-auto">
          {/* Tab bar */}
          <div className="sticky top-0 z-20 flex items-end gap-0 px-6 pt-2 border-b border-black/5" style={{ background: 'var(--color-page)' }}>
            {[{ id: 'overview', label: 'Overview' }, { id: 'documents', label: `Documents (${localCard.documents.length})` }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: '7px 16px 8px', fontSize: 12, fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? 'var(--color-primary)' : '#525252', background: 'none', border: 'none',
                borderBottom: activeTab === tab.id ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}>{tab.label}</button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="p-6 space-y-6">
              {/* Yumnai briefing */}
              <YumnaiBriefing message={localCard.yumnaiSuggestion?.message} />

              {/* Customer + deal info */}
              <div className="bg-white rounded-2xl border border-black/5 p-5">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <Field label="Seller (Merchant)"><span className="text-[13px] font-semibold" style={{ color: 'var(--color-primary)' }}>{localCard.seller}</span></Field>
                  {localCard.buyer && <Field label="Buyer (Borrower)"><span className="text-[13px] font-semibold" style={{ color: 'var(--color-primary)' }}>{localCard.buyer}</span></Field>}
                  <Field label="Invoice Amount"><span className="text-[15px] font-bold text-slate-900">{formatSAR(localCard.amount)}</span></Field>
                  <Field label="MDR Rate"><span className="text-[13px] text-slate-700">{localCard.mdrRate}%</span></Field>
                  <Field label="Tenure"><span className="text-[13px] text-slate-700">{localCard.tenure} days</span></Field>
                  <Field label="EMI Frequency"><span className="text-[13px] text-slate-700 capitalize">{localCard.emiFrequency}</span></Field>
                  <Field label="Invoice No."><span className="text-[13px] font-mono text-slate-600">{localCard.invoiceNumber}</span></Field>
                  <Field label="Commodity Broker"><span className="text-[13px] text-slate-700">{localCard.commodityBroker}</span></Field>
                  {localCard.saleBroker && <Field label="Sale Broker"><span className="text-[13px] text-slate-700">{localCard.saleBroker}</span></Field>}
                  <Field label="Sector"><span className="text-[13px] text-slate-700">{localCard.sector}</span></Field>
                  <Field label="Assigned To"><span className="text-[13px] text-slate-700">{localCard.assignedTo || '—'}</span></Field>
                  {localCard.riskScore !== null && (
                    <Field label="Risk Score">
                      <span className="text-[12px] font-bold px-2 py-0.5 rounded-full" style={{ background: riskColor(localCard.riskScore).bg, color: riskColor(localCard.riskScore).text }}>{localCard.riskScore}</span>
                    </Field>
                  )}
                  {buyerInfo && (
                    <Field label="Buyer Credit">
                      <div style={{ fontSize: 12, color: '#525252', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span>Limit: <strong style={{ color: '#262626' }}>{formatSAR(buyerInfo.creditLimit)}</strong></span>
                        <span>Used: <strong>{formatSAR(buyerInfo.creditUsed)}</strong></span>
                        {localCard.aboveLimit && <span style={{ fontSize: 10, fontWeight: 700, color: '#c2410c', background: '#fff7ed', padding: '1px 6px', borderRadius: 8 }}>⚠️ Exceeds limit</span>}
                      </div>
                    </Field>
                  )}
                </div>
              </div>

              {/* Stage-specific panel */}
              {localCard.stage === 'if_review' && (
                <div className="bg-white rounded-2xl border border-black/5 p-5">
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Adjust Terms (Above-Limit Review)</div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#525252', marginBottom: 4 }}>Adjusted Amount</div>
                      <input type="number" value={editAmt} onChange={e => setEditAmt(e.target.value)}
                        style={{ width: '100%', border: '1.5px solid #e5e5e5', borderRadius: 8, padding: '6px 10px', fontSize: 13, outline: 'none', color: '#262626' }} />
                      <div style={{ fontSize: 10, color: '#a3a3a3', marginTop: 3 }}>Original: {formatSAR(localCard.amount)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#525252', marginBottom: 4 }}>Adjusted MDR Rate (%)</div>
                      <input type="number" step="0.1" value={editMdr} onChange={e => setEditMdr(e.target.value)}
                        style={{ width: '100%', border: '1.5px solid #e5e5e5', borderRadius: 8, padding: '6px 10px', fontSize: 13, outline: 'none', color: '#262626' }} />
                      <div style={{ fontSize: 10, color: '#a3a3a3', marginTop: 3 }}>Original: {localCard.mdrRate}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#525252', marginBottom: 4 }}>Adjusted Tenure (days)</div>
                      <input type="number" value={editTen} onChange={e => setEditTen(e.target.value)}
                        style={{ width: '100%', border: '1.5px solid #e5e5e5', borderRadius: 8, padding: '6px 10px', fontSize: 13, outline: 'none', color: '#262626' }} />
                      <div style={{ fontSize: 10, color: '#a3a3a3', marginTop: 3 }}>Original: {localCard.tenure}d</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#525252', marginBottom: 4 }}>MDR Payer</div>
                      <select value={editPayer} onChange={e => setEditPayer(e.target.value)}
                        style={{ width: '100%', border: '1.5px solid #e5e5e5', borderRadius: 8, padding: '6px 10px', fontSize: 13, outline: 'none', background: 'white', color: '#262626' }}>
                        <option value="seller_full">Seller bears full MDR</option>
                        <option value="buyer_full">Buyer bears full MDR</option>
                        <option value="split_50_50">Split 50/50</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e5e5e5', marginBottom: 14, display: 'flex', gap: 16, fontSize: 12, color: '#475569' }}>
                    <span>MDR Fee: <strong style={{ color: '#262626' }}>{formatSAR(mdrFee)}</strong></span>
                    <span>Net to Seller: <strong style={{ color: '#262626' }}>{formatSAR(netToSeller)}</strong></span>
                  </div>
                  <button onClick={handleSaveProposal}
                    style={{ padding: '8px 20px', borderRadius: 20, border: 'none', background: 'linear-gradient(135deg, #9084fd 0%, #6a7bff 50%, #3da4ff 100%)', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 12px rgba(144,132,253,0.35)' }}>
                    Save Adjusted Terms
                  </button>
                </div>
              )}

              {localCard.stage === 'if_offer' && (
                <div className="bg-white rounded-2xl border border-black/5 p-5">
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Murabaha Offer Details</div>
                  <div style={{ border: '1px solid rgba(144,132,253,0.2)', borderRadius: 12, padding: '14px 16px', background: 'rgba(144,132,253,0.03)', marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>Commodity Broker (Purchase)</span>
                      <span style={{ fontWeight: 700, color: '#262626' }}>{localCard.commodityBroker}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>Principal (Cost Price)</span>
                      <span style={{ fontWeight: 700, color: '#262626' }}>{formatSAR(localCard.amount)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>Murabaha Profit (MDR {localCard.mdrRate}%)</span>
                      <span style={{ fontWeight: 700, color: '#262626' }}>{formatSAR(localCard.amount * localCard.mdrRate / 100)}</span>
                    </div>
                    <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>Total Deferred Payment</span>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>{formatSAR(localCard.amount + localCard.amount * localCard.mdrRate / 100)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>Payment Tenure</span>
                      <span style={{ fontWeight: 700, color: '#262626' }}>{localCard.tenure} days ({localCard.emiFrequency})</span>
                    </div>
                    {localCard.offerIssuedAt && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: '#64748b' }}>Offer Issued At</span>
                        <span style={{ fontWeight: 700, color: '#262626' }}>{localCard.offerIssuedAt}</span>
                      </div>
                    )}
                  </div>
                  {!offerIssued
                    ? <button onClick={() => setOfferIssued(true)} style={{ padding: '8px 20px', borderRadius: 20, border: 'none', background: 'linear-gradient(135deg, #9084fd 0%, #6a7bff 50%, #3da4ff 100%)', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 12px rgba(144,132,253,0.35)' }}>
                        Issue Murabaha Offer →
                      </button>
                    : <div style={{ padding: '8px 14px', borderRadius: 12, background: 'rgba(144,132,253,0.06)', border: '1px solid rgba(144,132,253,0.15)', fontSize: 12, fontWeight: 600, color: 'var(--color-primary)' }}>✓ Offer issued — awaiting borrower acceptance this session</div>
                  }
                </div>
              )}

              {localCard.stage === 'if_accepted' && (
                <div className="bg-white rounded-2xl border border-black/5 p-5">
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Murabaha Acceptance & Transfer</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #86efac' }}>
                      <span style={{ fontSize: 18 }}>✅</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>Borrower accepted Murabaha offer</div>
                        {localCard.acceptedAt && <div style={{ fontSize: 11, color: '#64748b' }}>Accepted at {localCard.acceptedAt}</div>}
                      </div>
                    </div>
                    {localCard.saleBroker && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                        <span style={{ fontSize: 18 }}>📦</span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#0369a1' }}>Commodity sale in progress</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>Via {localCard.saleBroker} — proceeds being settled</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {localCard.stage === 'if_disbursed' && (
                <div className="bg-white rounded-2xl border border-black/5 p-5">
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Disbursement Summary</div>
                  <div style={{ border: '1px solid #dcfce7', borderRadius: 12, padding: '14px 16px', background: '#f0fdf4', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>Gross Proceeds</span>
                      <span style={{ fontWeight: 700, color: '#262626' }}>{formatSAR(localCard.amount)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>MDR ({localCard.mdrRate}% — {localCard.mdrPayer === 'seller_full' ? 'Seller' : localCard.mdrPayer === 'buyer_full' ? 'Buyer' : 'Split'})</span>
                      <span style={{ fontWeight: 700, color: '#737373' }}>− {formatSAR(localCard.amount * localCard.mdrRate / 100)}</span>
                    </div>
                    {localCard.mdrPayer === 'split_50_50' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#a3a3a3', paddingLeft: 8 }}>
                        <span>Seller share</span><span>− {formatSAR(localCard.amount * localCard.mdrRate / 200)}</span>
                      </div>
                    )}
                    <div style={{ borderTop: '1px solid #bbf7d0', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ fontWeight: 600, color: '#15803d' }}>Net Disbursed to Borrower</span>
                      <span style={{ fontWeight: 800, color: '#15803d' }}>
                        {formatSAR(localCard.amount - (localCard.mdrPayer === 'buyer_full' ? 0 : localCard.mdrPayer === 'seller_full' ? localCard.amount * localCard.mdrRate / 100 : localCard.amount * localCard.mdrRate / 200))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Stage movement */}
              <div className="bg-white rounded-2xl border border-black/5 p-5">
                <div style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Move Stage</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {INVOICE_FINANCE_STAGES.map((s, i) => (
                    <button key={s.id} onClick={() => handleStageMove(s.id)} disabled={s.id === localCard.stage}
                      style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: 'none', cursor: s.id === localCard.stage ? 'default' : 'pointer', background: s.id === localCard.stage ? 'var(--color-primary)' : '#f1f5f9', color: s.id === localCard.stage ? 'white' : '#475569', opacity: s.id === localCard.stage ? 1 : 0.85 }}>
                      {i + 1}. {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'documents' && <div className="p-6"><DocumentsTab documents={localCard.documents} /></div>}
        </div>
        <ChatterPanel correspondence={localCard.correspondence} onSend={handleSend} />
      </div>
    </div>
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
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Risk score</span>
            <input type="number" min="0" max="100" value={filterRiskMin} onChange={e => setFilterRiskMin(e.target.value)} placeholder="Min" style={{ ...inputStyle, width: 52 }} />
            <span className="text-[11px] text-slate-400">–</span>
            <input type="number" min="0" max="100" value={filterRiskMax} onChange={e => setFilterRiskMax(e.target.value)} placeholder="Max" style={{ ...inputStyle, width: 52 }} />
          </div>
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
                  const rc      = riskColor(card.riskScore)
                  const missing = card.documents.filter(d => d.status === 'missing' || d.status === 'pending').length
                  const hasYumnai = !!card.yumnaiSuggestion?.message
                  return (
                    <button key={card.id} onClick={() => onCardClick(card)}
                      className="w-full text-start bg-white rounded-2xl border p-4 hover:shadow-md transition-all"
                      style={{ borderColor: card.aboveLimit ? '#fed7aa' : '#e5e5e5' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-mono text-slate-400">{card.id}</span>
                        {card.riskScore !== null
                          ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: rc.bg, color: rc.text }}>Risk {card.riskScore}</span>
                          : <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-400">Scoring…</span>}
                      </div>
                      <div className="text-[13px] font-semibold text-slate-800 leading-tight mb-0.5 truncate">{card.seller}</div>
                      {card.buyer && <div className="text-[11px] text-slate-400 mb-2">→ {card.buyer}</div>}
                      <div className="text-[14px] font-bold tabular-nums text-slate-900 mb-2">{formatSAR(card.amount)}</div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {card.aboveLimit && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: '#fff7ed', color: '#c2410c' }}>⚠️ Above Limit</span>}
                        {card.daysInStage > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 font-medium">{card.daysInStage}d here</span>}
                        {missing > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">{missing} doc{missing > 1 ? 's' : ''} pending</span>}
                        {hasYumnai && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1" style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--color-primary)' }}>✦ Yumnai</span>}
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
  const [ifRiskMin, setIfRiskMin]           = useState('')
  const [ifRiskMax, setIfRiskMax]           = useState('')
  const [ifDaysMin, setIfDaysMin]           = useState('')
  const [ifFilters, setIfFilters]           = useState(false)

  const selectedCard = selectedFrCard || selectedIfCard
  useEffect(() => {
    onBreadcrumb?.(selectedCard ? { label: selectedCard.seller, id: selectedCard.id, onHome: () => { setSelectedFrCard(null); setSelectedIfCard(null) } } : null)
    return () => onBreadcrumb?.(null)
  }, [selectedFrCard, selectedIfCard])

  // Direct handlers
  const handleFrUpdate = (updated) => { setFrCards(prev => prev.map(c => c.id === updated.id ? updated : c)); setSelectedFrCard(updated) }
  const frIdx = selectedFrCard ? frCards.findIndex(c => c.id === selectedFrCard.id) : -1

  // IF handlers
  const handleIfUpdate = (updated) => { setIfCards(prev => prev.map(c => c.id === updated.id ? updated : c)); setSelectedIfCard(updated) }
  const ifIdx = selectedIfCard ? ifCards.findIndex(c => c.id === selectedIfCard.id) : -1

  // Card detail overlays
  if (selectedFrCard) return (
    <FRCardDetailPage key={selectedFrCard.id} card={selectedFrCard} currentIdx={frIdx} totalCards={frCards.length}
      onClose={() => setSelectedFrCard(null)}
      onPrev={() => frIdx > 0 && setSelectedFrCard(frCards[frIdx - 1])}
      onNext={() => frIdx < frCards.length - 1 && setSelectedFrCard(frCards[frIdx + 1])}
      onCardUpdate={handleFrUpdate} />
  )
  if (selectedIfCard) return (
    <IFCardDetailPage key={selectedIfCard.id} card={selectedIfCard} currentIdx={ifIdx} totalCards={ifCards.length}
      onClose={() => setSelectedIfCard(null)}
      onPrev={() => ifIdx > 0 && setSelectedIfCard(ifCards[ifIdx - 1])}
      onNext={() => ifIdx < ifCards.length - 1 && setSelectedIfCard(ifCards[ifIdx + 1])}
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
  const filteredIf = applyFilters(ifCards, ifSearch, ifAssignee, ifRiskMin, ifRiskMax, ifDaysMin)
  const frActiveFilters = [frAssignee, frRiskMin, frRiskMax, frDaysMin].filter(Boolean).length
  const ifActiveFilters = [ifAssignee, ifRiskMin, ifRiskMax, ifDaysMin].filter(Boolean).length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sub-view tab bar */}
      <div className="px-4 pt-2.5 pb-0 shrink-0 flex items-end gap-1 border-b border-black/5">
        {[
          { id: 'invoice_finance', label: 'Invoice Finance', count: ifCards.filter(c => c.stage !== 'if_closed').length },
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
            filterRiskMin={ifRiskMin} setFilterRiskMin={setIfRiskMin}
            filterRiskMax={ifRiskMax} setFilterRiskMax={setIfRiskMax}
            filterDaysMin={ifDaysMin} setFilterDaysMin={setIfDaysMin}
            clearFilters={() => { setIfAssignee(''); setIfRiskMin(''); setIfRiskMax(''); setIfDaysMin('') }}
            allAssignees={[...new Set(ifCards.map(c => c.assignedTo))].sort()}
            totalCount={ifCards.length} filteredCount={filteredIf.length}
          />
          <KanbanBoard stages={INVOICE_FINANCE_STAGES} filteredCards={filteredIf} onCardClick={setSelectedIfCard} />
        </>
      )}
    </div>
  )
}
