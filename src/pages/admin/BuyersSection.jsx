import { useState } from 'react'
import { MOCK_BUYERS, MOCK_INVOICES_BUYER, formatSAR } from '../../data/mockData'
import Badge from '../../components/Badge'
import Avatar from '../../components/Avatar'

const BUYER_DOCS = {
  'buyer-001': [
    { name: 'Commercial Registration', status: 'verified' },
    { name: 'Nafath Verification', status: 'verified' },
    { name: 'Bank Statements (3 months)', status: 'verified' },
    { name: 'Signed Framework Agreement', status: 'verified' },
  ],
  'buyer-002': [
    { name: 'Commercial Registration', status: 'verified' },
    { name: 'Nafath Verification', status: 'verified' },
    { name: 'Bank Statements (3 months)', status: 'pending' },
  ],
  'buyer-003': [
    { name: 'Commercial Registration', status: 'verified' },
    { name: 'Nafath Verification', status: 'verified' },
    { name: 'Bank Statements (3 months)', status: 'verified' },
    { name: 'VAT Certificate', status: 'verified' },
  ],
  'buyer-004': [
    { name: 'Commercial Registration', status: 'verified' },
    { name: 'Nafath Verification', status: 'missing' },
    { name: 'Bank Statements (3 months)', status: 'missing' },
  ],
}

const BUYER_LINKED_SELLERS = {
  'buyer-001': ['Zahrani Trading Co.', 'Amoudi Distribution'],
  'buyer-002': ['Zahrani Trading Co.'],
  'buyer-003': ['Zahrani Trading Co.', 'Amoudi Distribution'],
  'buyer-004': ['Amoudi Distribution'],
}

const BUYER_CORRESPONDENCE = {
  'buyer-001': [
    { from: 'Yumi AI', message: 'Pre-payment reminder sent for INV-0041 (due 2026-07-20).', time: '2026-05-28 09:00', autoRead: true },
    { from: 'Ahmed Al-Otaibi', message: 'Confirmed. Will pay on the due date.', time: '2026-05-28 11:42', autoRead: true },
  ],
  'buyer-002': [
    { from: 'Yumi AI', message: 'Automated alert: credit utilisation reached 90%.', time: '2026-05-27 10:00', autoRead: true },
    { from: 'Yumi AI', message: 'Payment reminder sent for overdue INV-0036 (21 days past due).', time: '2026-05-28 09:00', autoRead: true },
    { from: 'Mohammed Al-Rashid', message: 'We will settle by end of week, apologies for the delay.', time: '2026-05-29 14:22', autoRead: true },
  ],
  'buyer-003': [],
  'buyer-004': [],
}

export default function BuyersSection() {
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('Overview')
  const TABS = ['Overview', 'Finance Requests', 'Linked Sellers', 'Credit Health', 'Documents', 'Correspondence']

  return (
    <div className="flex gap-5 max-w-6xl">
      {/* List */}
      <div className={selected ? 'w-[340px] shrink-0' : 'flex-1'}>
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50">
            <h3 className="font-semibold text-slate-800 text-[14px]">Buyers</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="text-start px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Buyer</th>
                {!selected && <th className="text-start px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">SIMAH</th>}
                <th className="text-start px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Utilisation</th>
                <th className="text-start px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Risk</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_BUYERS.map(b => {
                const pct = Math.round((b.creditUsed / b.creditLimit) * 100)
                return (
                  <tr key={b.id}
                    className="border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50 transition-colors"
                    style={{ borderLeft: selected?.id === b.id ? '3px solid var(--color-primary)' : undefined }}
                    onClick={() => { setSelected(b); setTab('Overview') }}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={b.initials} bg={b.risk === 'High' ? '#737373' : 'var(--color-primary)'} size="sm" />
                        <div>
                          <div className="font-semibold text-[13px] text-slate-800">{b.name}</div>
                          <div className="text-[11px] text-slate-400">{b.city}</div>
                        </div>
                      </div>
                    </td>
                    {!selected && <td className="px-5 py-3.5 text-[13px] font-semibold tabular-nums">{b.simahScore}</td>}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct > 80 ? '#737373' : 'var(--color-primary)' }} />
                        </div>
                        <span className="text-[11px] font-semibold tabular-nums" style={{ color: pct > 80 ? '#737373' : 'var(--color-ink)' }}>{pct}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><Badge stage={b.risk} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile */}
      {selected && (
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-3">
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
              <Avatar initials={selected.initials} bg={selected.risk === 'High' ? '#737373' : 'var(--color-primary)'} size="sm" />
              <div className="flex-1">
                <div className="font-bold text-slate-800 text-[14px]">{selected.name}</div>
                <div className="text-[11px] text-slate-400">{selected.city} · SIMAH {selected.simahScore} · CR {selected.cr}</div>
              </div>
              <Badge stage={selected.risk} />
            </div>

            <div className="flex border-b border-slate-50 overflow-x-auto">
              {TABS.map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className="px-4 py-2.5 text-[12px] font-semibold whitespace-nowrap border-b-2 transition-all"
                  style={{ borderColor: tab === t ? 'var(--color-primary)' : 'transparent', color: tab === t ? 'var(--color-primary)' : 'var(--color-muted)' }}>
                  {t}
                </button>
              ))}
            </div>

            <div className="p-5">
              {tab === 'Overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Credit Limit', value: formatSAR(selected.creditLimit) },
                      { label: 'Credit Used', value: formatSAR(selected.creditUsed) },
                      { label: 'SIMAH Score', value: selected.simahScore },
                      { label: 'Risk Tier', value: selected.risk },
                    ].map(f => (
                      <div key={f.label} className="bg-slate-50 rounded-xl px-3 py-2.5">
                        <div className="text-[10px] text-slate-400 mb-0.5">{f.label}</div>
                        <div className="text-[14px] font-bold text-slate-800">{f.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5 text-[13px]">
                    {[{ label: 'Phone', value: selected.phone }, { label: 'Email', value: selected.email }].map(r => (
                      <div key={r.label} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                        <span className="text-slate-400">{r.label}</span>
                        <span className="font-medium text-slate-700">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'Finance Requests' && (
                <div className="space-y-2">
                  {(() => {
                    const EMI_LABELS = { weekly: 'Weekly', bimonthly: 'Bi-Monthly', monthly: 'Monthly' }
                    const today = new Date().toISOString().slice(0, 10)
                    const filtered = (MOCK_INVOICES_BUYER || []).filter(inv => inv.buyerId === selected.id)
                    if (filtered.length === 0) {
                      return <div className="text-[13px] text-slate-400 text-center py-8">No finance requests on record.</div>
                    }
                    return filtered.map(inv => {
                      const nextOverdue = inv.nextInstalmentDate && inv.nextInstalmentDate < today
                      return (
                        <div key={inv.id} className="p-3 rounded-xl border border-slate-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-[13px] text-slate-800">{inv.id}</div>
                              <div className="text-[11px] text-slate-400">{inv.frId} · Due {inv.dueDate}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold tabular-nums text-[13px]">{formatSAR(inv.amount)}</div>
                              <Badge stage={inv.status} />
                            </div>
                          </div>
                          {inv.emiFrequency && (
                            <div className="flex items-center gap-3 pt-1 border-t border-slate-50 text-[11px]">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">{EMI_LABELS[inv.emiFrequency]}</span>
                              <span className="text-slate-500">{inv.paidInstalments}/{inv.totalInstalments} instalments paid</span>
                              {inv.nextInstalmentDate && (
                                <span className="ml-auto font-semibold" style={{ color: nextOverdue ? '#737373' : '#a3a3a3' }}>
                                  {nextOverdue ? 'Overdue' : 'Next:'} {inv.nextInstalmentDate}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })
                  })()}
                </div>
              )}

              {tab === 'Linked Sellers' && (
                <div className="space-y-2">
                  {(BUYER_LINKED_SELLERS[selected.id] || []).map((seller, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[11px] font-bold" style={{ background: 'var(--color-primary)' }}>
                        {seller[0]}
                      </div>
                      <span className="text-[13px] font-medium text-slate-700">{seller}</span>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'Credit Health' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border" style={{ background: '#fafafa', borderColor: '#e5e5e5' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[13px]">✦</span>
                      <span className="text-[12px] font-bold" style={{ color: 'var(--color-primary)' }}>Yumi Credit Narrative</span>
                    </div>
                    <p className="text-[12px] text-slate-600 leading-relaxed">
                      {selected.risk === 'High'
                        ? `${selected.name} has a credit utilisation of ${Math.round((selected.creditUsed / selected.creditLimit) * 100)}% — above the 80% threshold. SIMAH score of ${selected.simahScore} suggests elevated risk. Recommend pausing new credit issuance until utilisation drops below 75%.`
                        : `${selected.name} maintains a healthy credit utilisation of ${Math.round((selected.creditUsed / selected.creditLimit) * 100)}%. SIMAH score of ${selected.simahScore} is strong. Payment history is clean with no late payments in the last 12 months. Eligible for limit increase consideration.`}
                    </p>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[12px] text-slate-500">Credit utilisation</span>
                      <span className="text-[12px] font-semibold" style={{ color: (selected.creditUsed/selected.creditLimit) > 0.8 ? '#737373' : '#262626' }}>
                        {Math.round((selected.creditUsed / selected.creditLimit) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.round((selected.creditUsed / selected.creditLimit) * 100)}%`, background: (selected.creditUsed/selected.creditLimit) > 0.8 ? '#737373' : 'var(--color-primary)' }} />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                      <span>{formatSAR(selected.creditUsed)} used</span>
                      <span>{formatSAR(selected.creditLimit)} limit</span>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'Documents' && (
                <div className="space-y-2">
                  {(BUYER_DOCS[selected.id] || []).map((doc, i) => {
                    const color = doc.status === 'verified' ? '#262626' : doc.status === 'missing' ? '#737373' : '#525252'
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <div className="flex-1 text-[13px] font-medium text-slate-700">{doc.name}</div>
                        <span className="text-[11px] font-semibold capitalize" style={{ color }}>{doc.status}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {tab === 'Correspondence' && (
                <div className="space-y-3">
                  {(BUYER_CORRESPONDENCE[selected.id] || []).length === 0 && (
                    <div className="text-[13px] text-slate-400 text-center py-8">No correspondence.</div>
                  )}
                  {(BUYER_CORRESPONDENCE[selected.id] || []).map((msg, i) => (
                    <div key={i} className="rounded-xl border p-3" style={{
                      borderColor: '#e5e5e5',
                      background: '#fafafa',
                    }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12px] font-semibold text-slate-700">{msg.from}</span>
                        {msg.autoRead && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--color-primary)' }}>🤖 Yumi</span>}
                        <span className="ml-auto text-[10px] text-slate-400">{msg.time}</span>
                      </div>
                      <p className="text-[12px] text-slate-600 leading-relaxed">{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
