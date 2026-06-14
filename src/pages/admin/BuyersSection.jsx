import { useState, useEffect, useMemo } from 'react'
import { MOCK_BUYERS, MOCK_INVOICES_BUYER, REPAYMENTS_CARDS, formatSAR } from '../../data/mockData'
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
    { from: 'Yumnai AI', message: 'Pre-payment reminder sent for INV-0041 (due 2026-07-20).', time: '2026-05-28 09:00', autoRead: true },
    { from: 'Ahmed Al-Otaibi', message: 'Confirmed. Will pay on the due date.', time: '2026-05-28 11:42', autoRead: true },
  ],
  'buyer-002': [
    { from: 'Yumnai AI', message: 'Automated alert: credit utilisation reached 90%.', time: '2026-05-27 10:00', autoRead: true },
    { from: 'Yumnai AI', message: 'Payment reminder sent for overdue INV-0036 (21 days past due).', time: '2026-05-28 09:00', autoRead: true },
    { from: 'Mohammed Al-Rashid', message: 'We will settle by end of week, apologies for the delay.', time: '2026-05-29 14:22', autoRead: true },
  ],
  'buyer-003': [],
  'buyer-004': [],
}

const overdueBuyerIds = new Set(
  REPAYMENTS_CARDS
    .filter(c => c.stage === 'rp_overdue' || c.stage.startsWith('rp_escalation'))
    .map(c => c.buyerId)
    .filter(Boolean)
)

const TABS = ['Overview', 'Finance Requests', 'Documents', 'Correspondence']

export default function BuyersSection({ onBreadcrumb }) {
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('Overview')
  const [search, setSearch] = useState('')
  const [filterChip, setFilterChip] = useState('All')

  useEffect(() => {
    setSelected(MOCK_BUYERS[0])
  }, [])

  useEffect(() => {
    onBreadcrumb?.(selected ? { label: selected.name, id: selected.cr ? `CR ${selected.cr}` : null, onHome: () => {} } : null)
    return () => onBreadcrumb?.(null)
  }, [selected])

  const filtered = useMemo(() => {
    let list = MOCK_BUYERS
    if (filterChip === 'High Risk') list = list.filter(b => b.risk === 'High')
    else if (filterChip === 'Overdue') list = list.filter(b => overdueBuyerIds.has(b.id))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        (b.email || '').toLowerCase().includes(q) ||
        (b.phone || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [search, filterChip])

  useEffect(() => {
    if (selected && !filtered.find(b => b.id === selected.id)) {
      setSelected(filtered[0] || null)
    }
  }, [filtered])

  const highRiskCount = MOCK_BUYERS.filter(b => b.risk === 'High').length
  const overdueCount  = MOCK_BUYERS.filter(b => overdueBuyerIds.has(b.id)).length

  const CHIPS = [
    { key: 'All',       label: 'All',       count: null },
    { key: 'High Risk', label: 'High Risk', count: highRiskCount, bg: '#fee2e2', color: '#b91c1c' },
    { key: 'Overdue',   label: 'Overdue',   count: overdueCount,  bg: '#fef3c7', color: '#92400e' },
  ]

  return (
    <div className="flex gap-5 h-full">

      {/* List — always 340 px */}
      <div className="w-[340px] shrink-0 flex flex-col min-h-0">
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden flex flex-col flex-1">
          <div className="px-4 py-3 border-b border-slate-50 space-y-2.5">
            <h3 className="font-semibold text-slate-800 text-[14px]">Buyers</h3>

            {/* Search */}
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search buyers…"
                className="w-full pl-7 pr-3 py-1.5 text-[12px] rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>

            {/* Filter chips */}
            <div className="flex gap-1.5 flex-wrap">
              {CHIPS.map(chip => {
                const active = filterChip === chip.key
                return (
                  <button key={chip.key} onClick={() => setFilterChip(chip.key)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all"
                    style={active
                      ? { background: chip.bg || 'var(--color-primary)', color: chip.color || '#fff', outline: '2px solid ' + (chip.color || 'var(--color-primary)'), outlineOffset: '1px' }
                      : { background: chip.bg || '#f1f5f9', color: chip.color || '#64748b' }
                    }>
                    {chip.label}
                    {chip.count != null && (
                      <span className="px-1 rounded-full text-[10px] font-bold" style={{ background: 'rgba(0,0,0,0.12)' }}>{chip.count}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Buyer rows */}
          <div className="divide-y divide-slate-50 flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="px-5 py-8 text-[12px] text-slate-400 text-center">No buyers found</div>
            )}
            {filtered.map(b => {
              const pct = Math.round((b.creditUsed / b.creditLimit) * 100)
              const isHighRisk = b.risk === 'High'
              const isOverdue  = overdueBuyerIds.has(b.id)
              const dotColor = isHighRisk ? '#b91c1c' : isOverdue ? '#92400e' : null
              return (
                <div key={b.id}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                  style={{ borderLeft: selected?.id === b.id ? '3px solid var(--color-primary)' : '3px solid transparent' }}
                  onClick={() => { setSelected(b); setTab('Overview') }}>
                  <Avatar initials={b.initials} bg={isHighRisk ? '#737373' : 'var(--color-primary)'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[13px] text-slate-800 truncate">{b.name}</span>
                      {dotColor && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dotColor }} />}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">{b.city}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge stage={b.risk} />
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct > 80 ? '#737373' : 'var(--color-primary)' }} />
                      </div>
                      <span className="text-[10px] font-semibold tabular-nums" style={{ color: pct > 80 ? '#737373' : '#a3a3a3' }}>{pct}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          <div className="bg-white rounded-2xl border border-black/5 overflow-hidden flex flex-col flex-1">

            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-3">
              <Avatar initials={selected.initials} bg={selected.risk === 'High' ? '#737373' : 'var(--color-primary)'} size="sm" />
              <div className="flex-1">
                <div className="font-bold text-slate-800 text-[14px]">{selected.name}</div>
                <div className="text-[11px] text-slate-400">{selected.city} · CR {selected.cr}</div>
              </div>
              <Badge stage={selected.risk} />
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-50 overflow-x-auto">
              {TABS.map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className="px-4 py-2.5 text-[12px] font-semibold whitespace-nowrap border-b-2 transition-all"
                  style={{ borderColor: tab === t ? 'var(--color-primary)' : 'transparent', color: tab === t ? 'var(--color-primary)' : 'var(--color-muted)' }}>
                  {t}
                </button>
              ))}
            </div>

            <div className="p-5 flex-1 overflow-y-auto min-h-0">

              {tab === 'Overview' && (
                <div className="space-y-6">

                  {/* KPI grid + contact */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Credit Limit', value: formatSAR(selected.creditLimit) },
                        { label: 'Credit Used', value: formatSAR(selected.creditUsed) },
                        { label: 'Risk Tier', value: selected.risk },
                      ].map(f => (
                        <div key={f.label} className="bg-slate-50 rounded-xl px-3 py-2.5">
                          <div className="text-[10px] text-slate-400 mb-0.5">{f.label}</div>
                          <div className="text-[14px] font-bold text-slate-800">{f.value}</div>
                        </div>
                      ))}
                    </div>
                    <div className="text-[13px]">
                      {[{ label: 'Phone', value: selected.phone }, { label: 'Email', value: selected.email }].map(r => (
                        <div key={r.label} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                          <span className="text-slate-400">{r.label}</span>
                          <span className="font-medium text-slate-700">{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Credit Health */}
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2.5">Credit Health</div>
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl border" style={{ background: '#fafafa', borderColor: '#e5e5e5' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[13px]">✦</span>
                          <span className="text-[12px] font-bold" style={{ color: 'var(--color-primary)' }}>Yumnai Credit Narrative</span>
                        </div>
                        <p className="text-[12px] text-slate-600 leading-relaxed">
                          {selected.risk === 'High'
                            ? `${selected.name} has a credit utilisation of ${Math.round((selected.creditUsed / selected.creditLimit) * 100)}% — above the 80% threshold, which suggests elevated risk. Recommend pausing new credit issuance until utilisation drops below 75%.`
                            : `${selected.name} maintains a healthy credit utilisation of ${Math.round((selected.creditUsed / selected.creditLimit) * 100)}%. Payment history is clean with no late payments in the last 12 months. Eligible for limit increase consideration.`}
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
                  </div>

                  {/* Linked Sellers */}
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2.5">Linked Sellers</div>
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
                  </div>

                </div>
              )}

              {tab === 'Finance Requests' && (
                <div className="space-y-2">
                  {(() => {
                    const EMI_LABELS = { weekly: 'Weekly', bimonthly: 'Bi-Monthly', monthly: 'Monthly' }
                    const today = new Date().toISOString().slice(0, 10)
                    const items = (MOCK_INVOICES_BUYER || []).filter(inv => inv.buyerId === selected.id)
                    if (items.length === 0) {
                      return <div className="text-[13px] text-slate-400 text-center py-8">No finance requests on record.</div>
                    }
                    return items.map(inv => {
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

              {tab === 'Documents' && (
                <div className="space-y-2">
                  {(BUYER_DOCS[selected.id] || []).map((doc, i) => {
                    const color = doc.status === 'verified' ? '#262626' : doc.status === 'missing' ? '#737373' : '#525252'
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
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
                    <div key={i} className="rounded-xl border p-3" style={{ borderColor: '#e5e5e5', background: '#fafafa' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12px] font-semibold text-slate-700">{msg.from}</span>
                        {msg.autoRead && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--color-primary)' }}>🤖 Yumnai</span>}
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
