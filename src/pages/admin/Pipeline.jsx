import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { PIPELINE_STAGES, PIPELINE_CARDS, formatSAR } from '../../data/mockData'

const ROLE_STAGE_MAP = {
  verifier:    ['submitted', 'kyc'],
  credit:      ['credit_score'],
  risk:        ['risk'],
  legal:       ['legal'],
  account_mgr: ['approved', 'disbursed'],
  collections: ['repayment', 'overdue'],
  super:       null, // sees all
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

// ── Lane AI Action Popover ────────────────────────────────────────────────────

function LaneActions({ stage, onClose }) {
  const [applied, setApplied] = useState(null)
  const actions = [
    { id: 'chase', label: 'Auto-chase missing documents', desc: `Yumi will message all buyers in ${stage.label} with incomplete documents.` },
    { id: 'flag',  label: 'Flag stale cards (>3 days)',    desc: 'Yumi will mark cards sitting here longer than 3 days as overdue for review.' },
    { id: 'assign', label: 'Auto-assign unassigned cards', desc: 'Yumi will distribute unassigned cards to available team members based on capacity.' },
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
          <button key={a.id}
            onClick={() => setApplied(a.id)}
            className="w-full text-start p-3 rounded-xl border transition-colors"
            style={{
              borderColor: applied === a.id ? '#8f85ff' : '#f1f5f9',
              background: applied === a.id ? 'rgba(143,133,255,0.06)' : 'transparent',
            }}>
            <div className="text-[12px] font-semibold text-slate-800 mb-0.5">{a.label}</div>
            <div className="text-[11px] text-slate-400 leading-snug">{a.desc}</div>
            {applied === a.id && (
              <div className="mt-2 text-[11px] font-semibold text-indigo-600">✓ Yumi is on it</div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Card Detail Panel ─────────────────────────────────────────────────────────

function CardDetailPanel({ card, onClose, onNavigate, adminRole }) {
  const [activeTab, setActiveTab] = useState('Yumi')
  const [sent, setSent] = useState(false)
  const [draftText, setDraftText] = useState(card.yumiSuggestion.draftText)
  const [mdrPayer, setMdrPayer] = useState('split_50_50')
  const [emiFreq, setEmiFreq] = useState(card.emiFrequency || 'bimonthly')
  const [invoiceGenerated, setInvoiceGenerated] = useState(false)
  const [thread, setThread] = useState(card.correspondence)

  const TABS = ['Overview', 'Documents', 'Correspondence', 'Yumi', 'History']

  const missingDocs = card.documents.filter(d => d.status === 'missing').length

  const handleSend = () => {
    setSent(true)
    setThread(prev => [
      ...prev,
      { from: 'You', message: draftText, time: 'Just now', autoRead: false },
      { from: 'Yumi AI', message: 'Message sent. I will monitor the reply and auto-attach any documents received from the client.', time: 'Just now', autoRead: true },
    ])
    setActiveTab('Correspondence')
  }

  const mdrFee = card.amount * (card.mdrRate / 100)

  const EMI_FREQS = { weekly: 7, bimonthly: 15, monthly: 30 }
  const EMI_FREQ_LABELS = { weekly: 'Weekly (7d)', bimonthly: 'Bi-Monthly (15d)', monthly: 'Monthly (30d)' }

  const buyerFee = mdrPayer === 'buyer_full' ? mdrFee : mdrPayer === 'split_50_50' ? mdrFee / 2 : 0
  const merchantMDR = mdrPayer === 'merchant_full' ? mdrFee : mdrPayer === 'split_50_50' ? mdrFee / 2 : 0
  const totalBuyerRepayment = card.amount + buyerFee
  const merchantDisbursement = card.amount - merchantMDR

  const emiDays = EMI_FREQS[emiFreq]
  const instalmentCount = Math.ceil(card.tenure / emiDays)
  const perEMI = totalBuyerRepayment / instalmentCount

  return (
    <div className="fixed inset-y-0 right-0 z-30 w-[460px] bg-white shadow-2xl flex flex-col border-l border-slate-100">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 shrink-0">
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-800 text-[14px]">{card.id}</div>
          <div className="text-[11px] text-slate-400">{card.seller} → {card.buyer} · {formatSAR(card.amount)}</div>
        </div>
        {missingDocs > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-red-500">{missingDocs} missing</span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 overflow-x-auto shrink-0">
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className="px-4 py-2.5 text-[12px] font-semibold whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5"
            style={{ borderColor: activeTab === t ? 'var(--color-primary)' : 'transparent', color: activeTab === t ? 'var(--color-primary)' : 'var(--color-muted)' }}>
            {t === 'Yumi' && <span className="text-[11px]">✦</span>}
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Overview */}
        {activeTab === 'Overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Amount', value: formatSAR(card.amount) },
                { label: 'MDR Rate', value: `${card.mdrRate}%` },
                { label: 'Tenure', value: `${card.tenure} days` },
                { label: 'Sector', value: card.sector },
                { label: 'Risk Score', value: card.riskScore !== null ? card.riskScore : 'Pending' },
                { label: 'Days in Stage', value: card.daysInStage },
              ].map(f => (
                <div key={f.label} className="bg-slate-50 rounded-xl px-3 py-2.5">
                  <div className="text-[10px] text-slate-400 mb-0.5">{f.label}</div>
                  <div className="text-[13px] font-semibold text-slate-800">{f.value}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => onNavigate && onNavigate('sellers')}
                className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                → View Seller Profile
              </button>
              <button onClick={() => onNavigate && onNavigate('buyers')}
                className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                → View Buyer Profile
              </button>
            </div>
          </div>
        )}

        {/* Documents */}
        {activeTab === 'Documents' && (
          <div className="space-y-2">
            {card.documents.map((doc, i) => {
              const sc = statusColor(doc.status)
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: '#f1f5f9', background: sc.bg + '40' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={sc.color} strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <div className="flex-1 text-[13px] font-medium text-slate-700">{doc.name}</div>
                  <span className="text-[11px] font-semibold capitalize" style={{ color: sc.color }}>{doc.status}</span>
                  {doc.status === 'missing' && (
                    <button onClick={() => { setDraftText(card.yumiSuggestion.draftText); setActiveTab('Yumi') }}
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-lg whitespace-nowrap"
                      style={{ background: 'rgba(143,133,255,0.1)', color: 'var(--color-primary)' }}>
                      Request via Yumi →
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Correspondence */}
        {activeTab === 'Correspondence' && (
          <div className="space-y-3">
            {thread.length === 0 && (
              <div className="text-[13px] text-slate-400 text-center py-8">No correspondence yet.</div>
            )}
            {thread.map((msg, i) => (
              <div key={i} className="rounded-xl border p-3" style={{
                borderColor: msg.autoRead ? 'rgba(143,133,255,0.2)' : '#f1f5f9',
                background: msg.autoRead ? 'rgba(143,133,255,0.04)' : '#fafafa',
              }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[12px] font-semibold text-slate-700">{msg.from}</span>
                  {msg.autoRead && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(143,133,255,0.1)', color: 'var(--color-primary)' }}>
                      🤖 Auto-processed by Yumi
                    </span>
                  )}
                  <span className="ml-auto text-[10px] text-slate-400">{msg.time}</span>
                </div>
                <p className="text-[12px] text-slate-600 leading-relaxed">{msg.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Yumi */}
        {activeTab === 'Yumi' && (
          <div className="space-y-4">
            {/* Suggestion card */}
            <div className="rounded-xl overflow-hidden border border-indigo-100">
              <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: 'var(--color-primary)' }}>
                <span className="text-white text-[13px]">✦</span>
                <span className="text-[12px] font-bold text-white">Yumi · Suggested Action</span>
              </div>
              <div className="p-4" style={{ background: 'rgba(143,133,255,0.04)' }}>
                <p className="text-[13px] text-slate-700 leading-relaxed">{card.yumiSuggestion.message}</p>
              </div>
            </div>

            {/* Document request flow */}
            {card.yumiSuggestion.action === 'request_document' && !sent && (
              <div className="space-y-3">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Draft Message</div>
                <textarea
                  value={draftText}
                  onChange={e => setDraftText(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl border text-[12px] outline-none resize-none leading-relaxed"
                  style={{ borderColor: '#e2e8f0', fontFamily: 'inherit' }}
                />
                <button onClick={handleSend}
                  className="w-full py-2.5 rounded-xl text-white font-semibold text-[13px] transition-colors"
                  style={{ background: 'var(--color-primary)' }}>
                  Send Message →
                </button>
              </div>
            )}

            {sent && (
              <div className="p-4 rounded-xl border" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                <div className="font-semibold text-emerald-700 text-[13px] mb-1">✓ Message sent</div>
                <p className="text-[12px] text-emerald-600">Yumi is monitoring the reply. Any documents received will be automatically attached to this card and to the buyer's profile.</p>
              </div>
            )}

            {/* Invoice generation — Account Manager */}
            {card.yumiSuggestion.action === 'generate_invoice' && (
              <div className="space-y-3">
                {/* Fee sharing model */}
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Fee Sharing Model</div>
                <div className="space-y-1.5">
                  {[
                    { id: 'merchant_full', label: 'Merchant Bears Full Cost', desc: 'Buyer repays principal only — MDR deducted from merchant disbursement' },
                    { id: 'split_50_50',  label: 'Split 50/50 (Merchant & Buyer)', desc: 'Each party pays half the MDR' },
                    { id: 'buyer_full',   label: 'Buyer Bears Full Cost', desc: 'Buyer repays principal + full MDR — merchant receives full disbursement' },
                  ].map(opt => (
                    <button key={opt.id} onClick={() => { setMdrPayer(opt.id); setInvoiceGenerated(false) }}
                      className="w-full text-start p-3 rounded-xl border transition-all"
                      style={{
                        borderColor: mdrPayer === opt.id ? 'var(--color-primary)' : '#e2e8f0',
                        background: mdrPayer === opt.id ? 'rgba(143,133,255,0.06)' : 'transparent',
                      }}>
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center"
                          style={{ borderColor: mdrPayer === opt.id ? 'var(--color-primary)' : '#cbd5e1' }}>
                          {mdrPayer === opt.id && <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-primary)' }} />}
                        </div>
                        <span className="text-[12px] font-semibold" style={{ color: mdrPayer === opt.id ? 'var(--color-primary)' : '#334155' }}>{opt.label}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 ml-5">{opt.desc}</div>
                    </button>
                  ))}
                </div>

                {/* EMI Frequency */}
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mt-2">EMI Frequency</div>
                <div className="flex gap-1.5">
                  {Object.entries(EMI_FREQ_LABELS).map(([key, lbl]) => (
                    <button key={key} onClick={() => { setEmiFreq(key); setInvoiceGenerated(false) }}
                      className="flex-1 py-2 rounded-xl text-[11px] font-semibold border transition-all"
                      style={{
                        background: emiFreq === key ? 'var(--color-primary)' : 'transparent',
                        color: emiFreq === key ? 'white' : '#64748b',
                        borderColor: emiFreq === key ? 'transparent' : '#e2e8f0',
                      }}>
                      {lbl}
                    </button>
                  ))}
                </div>

                <button onClick={() => setInvoiceGenerated(true)}
                  className="w-full py-2.5 rounded-xl font-semibold text-[13px] transition-colors"
                  style={{ background: 'rgba(143,133,255,0.1)', color: 'var(--color-primary)' }}>
                  Generate Invoice Preview
                </button>

                {invoiceGenerated && (
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    {/* Invoice header */}
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-[13px]">INVOICE · INV-{card.id.replace('FR-', '')}</span>
                      <span className="text-[11px] text-slate-400">2026-05-31</span>
                    </div>

                    {/* Parties + amounts */}
                    <div className="p-4 space-y-2 text-[12px]">
                      <div className="flex justify-between"><span className="text-slate-500">Merchant (Seller)</span><span className="font-medium">{card.seller}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Buyer</span><span className="font-medium">{card.buyer}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Product Value</span><span className="font-medium tabular-nums">{formatSAR(card.amount)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">MDR Rate</span><span className="font-medium">{card.mdrRate}% ({EMI_FREQ_LABELS[emiFreq]})</span></div>
                      {buyerFee > 0 && (
                        <div className="flex justify-between"><span className="text-slate-500">Buyer Fee</span><span className="tabular-nums text-red-500">+{formatSAR(buyerFee)}</span></div>
                      )}
                      {merchantMDR > 0 && (
                        <div className="flex justify-between"><span className="text-slate-500">Merchant MDR</span><span className="tabular-nums text-orange-500">-{formatSAR(merchantMDR)}</span></div>
                      )}
                      <div className="border-t border-slate-100 pt-2 mt-1 space-y-1.5">
                        <div className="flex justify-between"><span className="font-semibold text-slate-700">Merchant Disbursement</span><span className="font-bold tabular-nums text-emerald-600">{formatSAR(merchantDisbursement)}</span></div>
                        <div className="flex justify-between"><span className="font-semibold text-slate-700">Buyer Total Repayment</span><span className="font-bold tabular-nums text-slate-800">{formatSAR(totalBuyerRepayment)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Per EMI Amount</span><span className="font-semibold tabular-nums text-slate-800">{formatSAR(perEMI)} × {instalmentCount}</span></div>
                      </div>
                    </div>

                    {/* Instalment preview */}
                    <div className="border-t border-slate-100">
                      <div className="px-4 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Instalment Schedule (preview)</div>
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="border-b border-slate-50">
                            <th className="px-4 py-1.5 text-start font-semibold text-slate-400">No.</th>
                            <th className="px-4 py-1.5 text-start font-semibold text-slate-400">Due Date</th>
                            <th className="px-4 py-1.5 text-end font-semibold text-slate-400">Amount</th>
                            <th className="px-4 py-1.5 text-end font-semibold text-slate-400">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: Math.min(instalmentCount, 4) }, (_, i) => {
                            const dueMs = new Date('2026-06-01').getTime() + (i + 1) * emiDays * 86400000
                            const dueDate = new Date(dueMs).toISOString().slice(0, 10)
                            return (
                              <tr key={i} className="border-b border-slate-50 last:border-0">
                                <td className="px-4 py-2 text-slate-500">{i + 1}</td>
                                <td className="px-4 py-2 text-slate-600">{dueDate}</td>
                                <td className="px-4 py-2 text-end tabular-nums font-medium text-slate-700">{formatSAR(perEMI)}</td>
                                <td className="px-4 py-2 text-end"><span className="text-slate-400">Pending</span></td>
                              </tr>
                            )
                          })}
                          {instalmentCount > 4 && (
                            <tr><td colSpan={4} className="px-4 py-2 text-[10px] text-slate-400 text-center">+ {instalmentCount - 4} more instalments</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="px-4 pb-4 pt-3 flex gap-2">
                      <button className="flex-1 py-2 rounded-lg text-white font-semibold text-[12px]" style={{ background: '#10b981' }}>Share with Buyer →</button>
                      <button className="px-3 py-2 rounded-lg font-semibold text-[12px] border border-slate-200 text-slate-600">Hold</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Legal template suggestion */}
            {card.yumiSuggestion.action === 'suggest_template' && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-indigo-100" style={{ background: 'rgba(143,133,255,0.04)' }}>
                  <div className="text-[12px] font-semibold text-slate-700 mb-2">Suggested Template</div>
                  <div className="text-[13px] font-bold text-slate-900 mb-1">Standard ICT Credit Framework v2.1</div>
                  <div className="text-[11px] text-slate-400">Conditions: ICT sector · Full Credit · SAR 50K–500K · tenure ≤ 90 days</div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 rounded-xl text-white font-semibold text-[12px]" style={{ background: 'var(--color-primary)' }}>Apply Template ✓</button>
                  <button className="flex-1 py-2 rounded-xl font-semibold text-[12px] border border-slate-200 text-slate-600">Dismiss</button>
                </div>
              </div>
            )}

            {/* Escalation action */}
            {card.yumiSuggestion.action === 'escalate' && !sent && (
              <div className="space-y-3">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Draft Formal Notice</div>
                <textarea
                  value={draftText}
                  onChange={e => setDraftText(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl border text-[12px] outline-none resize-none leading-relaxed"
                  style={{ borderColor: '#e2e8f0', fontFamily: 'inherit' }}
                />
                <button onClick={handleSend}
                  className="w-full py-2.5 rounded-xl text-white font-semibold text-[13px]"
                  style={{ background: '#e5484d' }}>
                  Send Formal Notice →
                </button>
              </div>
            )}

            {/* Monitor state */}
            {(card.yumiSuggestion.action === 'monitor' || card.yumiSuggestion.action === 'score') && (
              <div className="p-4 rounded-xl border" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                <div className="font-semibold text-emerald-700 text-[13px] mb-1">✓ Yumi is on it</div>
                <p className="text-[12px] text-emerald-600">{card.yumiSuggestion.message}</p>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {activeTab === 'History' && (
          <div className="relative">
            <div className="absolute left-3.5 top-3 bottom-3 w-0.5 bg-slate-100 rounded-full" />
            {[
              { icon: '📋', text: `FR submitted — ${card.seller} → ${card.buyer}`, time: '2026-05-28 08:00' },
              { icon: '🤖', text: 'Automated intake check complete', time: '2026-05-28 08:02' },
              { icon: '👤', text: `Assigned to ${card.assignedTo}`, time: '2026-05-28 08:05' },
              { icon: '📄', text: `Moved to ${PIPELINE_STAGES.find(s => s.id === card.stage)?.label}`, time: `2026-05-${30 - card.daysInStage} 09:00` },
            ].map((e, i) => (
              <div key={i} className="relative flex gap-3 mb-4 pl-9">
                <div className="absolute left-0 w-7 h-7 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-[13px] z-10">{e.icon}</div>
                <div>
                  <p className="text-[12px] text-slate-700">{e.text}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{e.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
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

  const myStages = ROLE_STAGE_MAP[adminRole] || PIPELINE_STAGES.map(s => s.id)

  const visibleStages = adminRole === 'super'
    ? PIPELINE_STAGES
    : filterRole === 'mine'
    ? PIPELINE_STAGES.filter(s => myStages.includes(s.id))
    : PIPELINE_STAGES

  const cardsForStage = (stageId) => PIPELINE_CARDS.filter(c => c.stage === stageId)

  const myCardCount = PIPELINE_CARDS.filter(c => myStages.includes(c.stage)).length

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
        <span className="text-[11px] text-slate-400">{PIPELINE_CARDS.length} active transactions</span>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 p-6 h-full" style={{ minWidth: `${visibleStages.length * 296}px` }}>
          {visibleStages.map(stage => {
            const cards = cardsForStage(stage.id)
            const isMyLane = myStages.includes(stage.id)
            return (
              <div key={stage.id} className="flex flex-col shrink-0" style={{ width: 280 }}>
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3 relative">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: stage.color }} />
                  <span className="font-semibold text-[13px] text-slate-700 flex-1">{stage.label}</span>
                  <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-white border border-slate-100 text-slate-500">{cards.length}</span>
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
                  {cards.length === 0 && (
                    <div className="p-4 rounded-xl border-2 border-dashed border-slate-100 text-center text-[12px] text-slate-400">
                      No items
                    </div>
                  )}
                  {cards.map(card => {
                    const rc = riskColor(card.riskScore)
                    const missing = card.documents.filter(d => d.status === 'missing').length
                    const hasYumi = !!card.yumiSuggestion.message
                    return (
                      <button key={card.id}
                        onClick={() => { setSelectedCard(card); setLaneActionStage(null) }}
                        className="w-full text-start bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md hover:border-indigo-100 transition-all">
                        {/* Card header */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-mono text-slate-400">{card.id}</span>
                          {card.riskScore !== null && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: rc.bg, color: rc.text }}>
                              Risk {card.riskScore}
                            </span>
                          )}
                          {card.riskScore === null && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-400">Scoring…</span>
                          )}
                        </div>
                        {/* Seller → Buyer */}
                        <div className="text-[13px] font-semibold text-slate-800 leading-tight mb-0.5 truncate">{card.seller}</div>
                        <div className="text-[11px] text-slate-400 mb-2">→ {card.buyer}</div>
                        {/* Amount */}
                        <div className="text-[14px] font-bold tabular-nums text-slate-900 mb-3">{formatSAR(card.amount)}</div>
                        {/* Footer chips */}
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

      {/* Card detail panel */}
      {selectedCard && (
        <>
          <div className="fixed inset-0 z-20 bg-black/20" onClick={() => setSelectedCard(null)} />
          <CardDetailPanel
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
            onNavigate={onNavigate}
            adminRole={adminRole}
          />
        </>
      )}
    </div>
  )
}
