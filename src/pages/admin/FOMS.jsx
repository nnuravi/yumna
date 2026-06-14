import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import Badge from '../../components/Badge'
import { MOCK_REQUESTS, formatSAR } from '../../data/mockData'

const DETAIL_TABS = ['Related Documents', 'Activity Timeline', 'Risk Score', 'Decision', 'Assign Investigation']

export default function FOMS() {
  const { state, dispatch, addToast } = useApp()
  const navigate = useNavigate()
  const [selectedReq, setSelectedReq] = useState(null)
  const [detailTab, setDetailTab] = useState('Decision')
  const [decision, setDecision] = useState('')
  const [note, setNote] = useState('')
  const [kanbanTab, setKanbanTab] = useState('Pipeline')

  // Merge live request with mock
  const allRequests = [
    ...(state.liveData && state.liveStatus ? [{ id: state.liveData.id, buyer: state.liveData.buyer, seller: state.liveData.seller, amount: state.liveData.amt, riskScore: state.liveData.riskScore, stage: state.liveStatus, submitted: 'just now', tenure: state.liveData.tenure, mdr: state.liveData.mdr }] : []),
    ...MOCK_REQUESTS.filter(r => !state.liveData || r.id !== state.liveData.id),
  ]

  const handleDecision = (dec) => {
    if (!selectedReq || !note) return
    dispatch({ type: 'ADMIN_DECIDE', payload: { decision: dec, note } })
    addToast(`${selectedReq.id} ${dec === 'approved' ? 'approved' : dec === 'denied' ? 'denied' : 'placed on hold'}`)
    setDecision(dec)
  }

  const handleDisburse = () => {
    dispatch({ type: 'DISBURSE' })
    addToast('Disbursement processed successfully!')
    setDecision('disbursed')
  }

  const liveId = state.liveData?.id

  return (
    <div className="max-w-7xl">
      {/* Tab bar */}
      <div className="flex gap-2 mb-5">
        {['Pipeline', 'Sales Pipelines'].map(t => (
          <button
            key={t}
            onClick={() => setKanbanTab(t)}
            className="px-4 py-2 rounded-full text-[13px] font-semibold border transition-all"
            style={{
              background: kanbanTab === t ? 'var(--color-primary)' : '#fff',
              color: kanbanTab === t ? '#fff' : 'var(--color-muted)',
              borderColor: kanbanTab === t ? 'transparent' : 'var(--color-line)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {kanbanTab === 'Pipeline' && (
        <div className={`flex gap-5 ${selectedReq ? 'items-start' : ''}`}>
          {/* Table */}
          <div className={selectedReq ? 'w-[420px] shrink-0' : 'flex-1'}>
            <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/5 bg-card">
                    <th className="text-start px-4 py-3 eyebrow">Request</th>
                    {!selectedReq && <th className="text-start px-4 py-3 eyebrow">Buyer → Seller</th>}
                    <th className="text-start px-4 py-3 eyebrow">Amount</th>
                    {!selectedReq && <th className="text-start px-4 py-3 eyebrow">Risk</th>}
                    <th className="text-start px-4 py-3 eyebrow">Stage</th>
                    {!selectedReq && <th className="text-start px-4 py-3 eyebrow">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {allRequests.map(req => {
                    const isLive = req.id === liveId
                    const isSelected = selectedReq?.id === req.id
                    return (
                      <tr
                        key={req.id}
                        className="border-b border-black/5 last:border-0 cursor-pointer hover:bg-card transition-colors"
                        style={{
                          background: isLive ? 'rgba(239,246,255,0.8)' : isSelected ? 'rgba(143,133,255,0.06)' : undefined,
                          borderLeft: isSelected ? '3px solid var(--color-primary)' : undefined,
                        }}
                        onClick={() => { setSelectedReq(req); setDetailTab('Decision'); setDecision(''); setNote('') }}
                      >
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-[13px] text-ink flex items-center gap-1.5">
                            {req.id}
                            {isLive && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 live-dot inline-block" />}
                          </div>
                          <div className="text-[11px] text-muted">{req.submitted?.slice(0,10) || 'just now'}</div>
                        </td>
                        {!selectedReq && (
                          <td className="px-4 py-3.5 text-[12px] text-ink-soft">
                            {req.buyer}<br/>
                            <span className="text-muted">→ {req.seller || 'Zahrani Trading'}</span>
                          </td>
                        )}
                        <td className="px-4 py-3.5 font-semibold tabular text-[13px]">{formatSAR(req.amount || req.amt)}</td>
                        {!selectedReq && (
                          <td className="px-4 py-3.5">
                            <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full"
                              style={{
                                background: req.riskScore < 30 ? '#ecfdf5' : req.riskScore < 60 ? '#fffbeb' : '#fff1f2',
                                color: req.riskScore < 30 ? '#059669' : req.riskScore < 60 ? '#d97706' : '#e5484d',
                              }}>
                              {req.riskScore} · {req.riskScore < 30 ? 'Low' : req.riskScore < 60 ? 'Med' : 'High'}
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-3.5"><Badge stage={req.stage} /></td>
                        {!selectedReq && (
                          <td className="px-4 py-3.5">
                            <button
                              onClick={e => { e.stopPropagation(); setSelectedReq(req); setDetailTab('Decision') }}
                              className="text-[12px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
                              style={{ background: 'rgba(143,133,255,0.1)', color: 'var(--color-primary)' }}
                            >
                              Review →
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail panel */}
          {selectedReq && (
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-black/5 flex items-center gap-3">
                  <button onClick={() => setSelectedReq(null)} className="text-muted hover:text-ink transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                  <div className="flex-1">
                    <div className="font-semibold text-ink text-[14px]">{selectedReq.id}</div>
                    <div className="text-[11px] text-muted">{selectedReq.buyer} · {formatSAR(selectedReq.amount || selectedReq.amt)}</div>
                  </div>
                  <Badge stage={selectedReq.id === liveId ? state.liveStatus : selectedReq.stage} />
                </div>

                {/* Sub-tabs */}
                <div className="flex overflow-x-auto border-b border-black/5">
                  {DETAIL_TABS.map(t => (
                    <button
                      key={t}
                      onClick={() => setDetailTab(t)}
                      className="px-4 py-2.5 text-[12px] font-semibold whitespace-nowrap border-b-2 transition-all"
                      style={{
                        borderColor: detailTab === t ? 'var(--color-primary)' : 'transparent',
                        color: detailTab === t ? 'var(--color-primary)' : 'var(--color-muted)',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="p-5">
                  {detailTab === 'Related Documents' && <DocumentsTab />}
                  {detailTab === 'Activity Timeline' && <ActivityTab req={selectedReq} liveStatus={selectedReq.id === liveId ? state.liveStatus : selectedReq.stage} />}
                  {detailTab === 'Risk Score' && <RiskTab req={selectedReq} />}
                  {detailTab === 'Decision' && (
                    <DecisionTab
                      req={selectedReq}
                      isLive={selectedReq.id === liveId}
                      liveStatus={state.liveStatus}
                      note={note}
                      setNote={setNote}
                      decision={decision}
                      onDecide={handleDecision}
                      onDisburse={handleDisburse}
                      onSwitchToBuyer={() => navigate('/buyer')}
                      adminDecision={state.adminDecision}
                      buyerConfirmed={state.buyerConfirmed}
                      disbursed={state.disbursed}
                    />
                  )}
                  {detailTab === 'Assign Investigation' && <InvestigationTab />}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {kanbanTab === 'Sales Pipelines' && <KanbanBoard />}
    </div>
  )
}

function DocumentsTab() {
  return (
    <div className="space-y-3">
      {[
        { name: 'Commercial Registration', status: 'verified' },
        { name: 'Nafath Verification Result', status: 'verified' },
        { name: 'VAT Certificate', status: 'verified' },
        { name: 'Bank Statements (6 months)', status: 'pending' },
        { name: 'Signed Framework Agreement', status: 'verified' },
      ].map(doc => (
        <div key={doc.name} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-black/5">
          <div className="w-8 h-8 rounded-lg bg-white border border-black/5 flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-ink truncate">{doc.name}</div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {doc.status === 'verified'
              ? <><div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg></div><span className="text-[11px] text-emerald-600 font-semibold">Verified</span></>
              : <><div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div><span className="text-[11px] text-amber-600 font-semibold">Pending</span></>
            }
          </div>
        </div>
      ))}
    </div>
  )
}

function ActivityTab({ req, liveStatus }) {
  const events = [
    { text: `Finance request ${req.id} submitted by ${req.seller || 'Zahrani Trading'}`, time: req.submitted || 'just now', actor: 'Seller' },
    { text: 'Automated risk scoring completed — Score: ' + (req.riskScore || 28), time: '2 min later', actor: 'System' },
    ...(liveStatus === 'approved' || liveStatus === 'delivery_confirmed' || liveStatus === 'disbursed' || liveStatus === 'repaid' ? [
      { text: 'Invoice approved by Risk Analyst', time: '1 hr later', actor: 'Admin' },
    ] : []),
    ...(liveStatus === 'delivery_confirmed' || liveStatus === 'disbursed' || liveStatus === 'repaid' ? [
      { text: 'Delivery confirmed by buyer + MDR consent signed', time: '4 hrs later', actor: 'Buyer' },
    ] : []),
    ...(liveStatus === 'disbursed' || liveStatus === 'repaid' ? [
      { text: 'Disbursement processed — funds transferred to seller IBAN', time: '30 min later', actor: 'System' },
    ] : []),
  ]
  return (
    <div className="relative">
      <div className="absolute left-3.5 top-3 bottom-3 w-0.5 rounded-full bg-line" />
      {events.map((e, i) => (
        <div key={i} className="relative flex gap-4 mb-4 pl-10">
          <div className="absolute left-0 w-7 h-7 rounded-full bg-white border-2 border-line flex items-center justify-center text-[10px] font-semibold z-10"
            style={{ color: e.actor === 'System' ? 'var(--color-muted)' : e.actor === 'Admin' ? 'var(--color-primary)' : e.actor === 'Buyer' ? '#10b981' : '#6b7280' }}>
            {e.actor[0]}
          </div>
          <div>
            <p className="text-[13px] text-ink">{e.text}</p>
            <p className="text-[11px] text-muted mt-0.5">{e.time} · {e.actor}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function RiskTab({ req }) {
  const score = req.riskScore || 28
  const scoreColor = score < 30 ? '#10b981' : score < 60 ? '#d97706' : '#e5484d'
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
          style={{ background: scoreColor }}>
          {score}
        </div>
        <div>
          <div className="font-semibold text-ink text-[15px]">
            {score < 30 ? 'Low Risk' : score < 60 ? 'Medium Risk' : 'High Risk'}
          </div>
          <div className="text-[12px] text-muted">Automated risk assessment</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Credit Utilisation', value: '37%', status: 'good' },
          { label: 'Fraud Signals', value: 'None', status: 'good' },
          { label: 'AML Status', value: 'Clear', status: 'good' },
          { label: 'Sector Exposure', value: 'FMCG', status: 'neutral' },
          { label: 'Relationship Age', value: '18 months', status: 'good' },
        ].map(item => (
          <div key={item.label} className="p-3 rounded-xl bg-card border border-black/5">
            <div className="text-[11px] text-muted mb-0.5">{item.label}</div>
            <div className="font-semibold text-[13px]" style={{
              color: item.status === 'good' ? '#10b981' : item.status === 'bad' ? '#e5484d' : 'var(--color-ink)'
            }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DecisionTab({ req, isLive, liveStatus, note, setNote, decision, onDecide, onDisburse, onSwitchToBuyer, adminDecision, buyerConfirmed, disbursed }) {
  const effectiveStatus = isLive ? liveStatus : req.stage
  const isActionable = isLive && liveStatus === 'submitted'
  const canDisburse = isLive && liveStatus === 'delivery_confirmed' && !disbursed
  const alreadyDisbursed = isLive && (liveStatus === 'disbursed' || liveStatus === 'repaid')

  return (
    <div className="space-y-4">
      {isActionable && (
        <>
          <div>
            <label className="eyebrow mb-2 block">Decision Note</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add a note for the seller / record your rationale…"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border bg-card text-[13px] outline-none resize-none focus:border-primary transition-colors"
              style={{ borderColor: 'var(--color-line)' }}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onDecide('approved')}
              disabled={!note}
              className="flex-1 py-2.5 rounded-xl text-white font-semibold text-[13px] disabled:opacity-40 transition-opacity"
              style={{ background: '#10b981' }}
            >
              ✓ Approve
            </button>
            <button
              onClick={() => onDecide('stalled')}
              disabled={!note}
              className="flex-1 py-2.5 rounded-xl font-semibold text-[13px] disabled:opacity-40"
              style={{ background: '#fffbeb', color: '#d97706' }}
            >
              ⏸ Stall
            </button>
            <button
              onClick={() => onDecide('denied')}
              disabled={!note}
              className="flex-1 py-2.5 rounded-xl font-semibold text-[13px] disabled:opacity-40"
              style={{ background: '#fff1f2', color: '#e5484d' }}
            >
              ✕ Deny
            </button>
          </div>
        </>
      )}

      {isLive && liveStatus === 'approved' && !buyerConfirmed && (
        <div className="rounded-xl border p-4" style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}>
          <div className="font-semibold text-emerald-700 text-[13px] mb-1">✓ Approved</div>
          <p className="text-emerald-700 text-[12px] mb-3">Invoice sent to buyer for delivery confirmation. Waiting for buyer to confirm receipt.</p>
          <button onClick={onSwitchToBuyer} className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-white text-emerald-700 border border-emerald-200">
            → Switch to Buyer Experience
          </button>
        </div>
      )}

      {isLive && buyerConfirmed && !disbursed && (
        <div className="rounded-xl border p-4" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
          <div className="font-semibold text-blue-700 text-[13px] mb-1">📦 Delivery Confirmed</div>
          <p className="text-blue-700 text-[12px] mb-3">Buyer has confirmed receipt. Ready to disburse {formatSAR(req.amount || req.amt)} to seller.</p>
          <button
            onClick={onDisburse}
            className="w-full py-2.5 rounded-xl text-white font-semibold text-[13px]"
            style={{ background: 'var(--color-primary)' }}
          >
            Process Disbursement →
          </button>
        </div>
      )}

      {alreadyDisbursed && (
        <div className="rounded-xl border p-4" style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}>
          <div className="font-semibold text-emerald-700 text-[13px] mb-1">✓ Disbursement Complete</div>
          <p className="text-emerald-700 text-[12px]">
            {formatSAR((req.amount || req.amt) * 0.975)} transferred to seller IBAN. Buyer repayment due in {req.tenure} days.
          </p>
        </div>
      )}

      {!isLive && (
        <div className="rounded-xl bg-card border border-black/5 p-4">
          <div className="font-semibold text-[13px] text-ink mb-1">Historical Record</div>
          <p className="text-[12px] text-muted">This request was processed as <strong>{req.stage}</strong>.</p>
        </div>
      )}
    </div>
  )
}

function InvestigationTab() {
  return (
    <div className="space-y-4">
      <div>
        <label className="eyebrow mb-2 block">Assign To</label>
        <select className="w-full px-4 py-3 rounded-xl border bg-white text-[13px] outline-none" style={{ borderColor: 'var(--color-line)' }}>
          <option>Sara Al-Ghamdi — Loan Verification</option>
          <option>Faisal Al-Dosari — Credit Manager</option>
          <option>Noura Al-Shehri — Risk Analyst</option>
          <option>Omar Al-Mutairi — Collections</option>
        </select>
      </div>
      <div>
        <label className="eyebrow mb-2 block">Investigation Notes</label>
        <textarea rows={4} placeholder="Describe the investigation scope…" className="w-full px-4 py-3 rounded-xl border bg-card text-[13px] outline-none resize-none" style={{ borderColor: 'var(--color-line)' }} />
      </div>
      <button className="w-full py-2.5 rounded-xl text-white font-semibold text-[13px]" style={{ background: 'var(--color-primary)' }}>
        Assign Investigation
      </button>
    </div>
  )
}

function KanbanBoard() {
  const COLUMNS = [
    { id: 'pending', label: 'Pending Collection', color: '#d97706', cards: [
      { id: 'FR-0033', buyer: 'Ahmed Al-Otaibi', amount: 65000, days: 20 },
      { id: 'FR-0030', buyer: 'Mohammed Al-Rashid', amount: 120000, days: 8 },
    ]},
    { id: 'visits', label: 'Visits Planned', color: '#8f85ff', cards: [
      { id: 'FR-0028', buyer: 'Abdullah Al-Qahtani', amount: 95000, days: 3 },
    ]},
    { id: 'docs', label: 'Document Pending Update', color: '#6b7280', cards: [
      { id: 'FR-0025', buyer: 'Turki Al-Harbi', amount: 200000, days: 0 },
    ]},
  ]

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map(col => (
        <div key={col.id} className="w-72 shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
            <span className="font-semibold text-[13px] text-ink">{col.label}</span>
            <span className="ml-auto text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-card text-muted">{col.cards.length}</span>
          </div>
          <div className="flex flex-col gap-2">
            {col.cards.map(card => (
              <div key={card.id} className="bg-white rounded-xl border border-black/5 p-3.5">
                <div className="font-semibold text-[13px] text-ink mb-0.5">{card.id}</div>
                <div className="text-[11px] text-muted mb-2">{card.buyer}</div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold tabular text-[13px]">{formatSAR(card.amount)}</span>
                  {card.days > 0 && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">
                      {card.days}d overdue
                    </span>
                  )}
                </div>
              </div>
            ))}
            <button className="w-full py-2 rounded-xl border-2 border-dashed border-line text-[12px] text-muted font-medium hover:border-primary hover:text-primary transition-colors">
              + Add card
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
