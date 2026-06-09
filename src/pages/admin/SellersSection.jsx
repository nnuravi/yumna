import { useState, useEffect, useMemo } from 'react'
import { MOCK_SELLERS, MOCK_BUYERS, MOCK_REQUESTS, REPAYMENTS_CARDS, formatSAR } from '../../data/mockData'
import Badge from '../../components/Badge'
import Avatar from '../../components/Avatar'

const SELLER_EXTRA = {
  'seller-001': { sector: 'ICT / FMCG', iban: 'SA29 1000 0000 0001 2345 6789', linkedBuyers: ['buyer-001', 'buyer-002', 'buyer-003', 'buyer-004'], docs: [
    { name: 'Commercial Registration', status: 'verified' },
    { name: 'VAT Certificate', status: 'verified' },
    { name: 'Signed MDR Agreement', status: 'verified' },
    { name: 'Bank Details', status: 'verified' },
  ]},
  'seller-002': { sector: 'Consumer Staples', iban: 'SA29 2000 0000 0006 5432 1098', linkedBuyers: ['buyer-001', 'buyer-003'], docs: [
    { name: 'Commercial Registration', status: 'verified' },
    { name: 'VAT Certificate', status: 'verified' },
    { name: 'Signed MDR Agreement', status: 'verified' },
    { name: 'ISO Certificate', status: 'missing' },
  ]},
}

const overdueSellerIds    = new Set(REPAYMENTS_CARDS.filter(c => c.stage === 'rp_overdue').map(c => c.merchantId))
const escalationSellerIds = new Set(REPAYMENTS_CARDS.filter(c => c.stage.startsWith('rp_escalation')).map(c => c.merchantId))

function HealthScore({ seller }) {
  const score = seller.id === 'seller-001' ? 82 : 74
  const color = score >= 80 ? '#262626' : score >= 60 ? '#525252' : '#737373'
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold" style={{ background: color }}>{score}</div>
      <div>
        <div className="text-[11px] font-semibold" style={{ color }}>✦ Yumnai Health Score</div>
        <div className="text-[10px] text-slate-400">{score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Monitor'}</div>
      </div>
    </div>
  )
}

const TABS = ['Overview', 'Transactions', 'Documents']

export default function SellersSection({ onBreadcrumb }) {
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('Overview')
  const [search, setSearch] = useState('')
  const [filterChip, setFilterChip] = useState('All')

  useEffect(() => {
    setSelected(MOCK_SELLERS[0])
  }, [])

  useEffect(() => {
    onBreadcrumb?.(selected ? { label: selected.business, id: selected.cr ? `CR ${selected.cr}` : null, onHome: () => {} } : null)
    return () => onBreadcrumb?.(null)
  }, [selected])

  const filtered = useMemo(() => {
    let list = MOCK_SELLERS
    if (filterChip === 'Overdue') list = list.filter(s => overdueSellerIds.has(s.id))
    else if (filterChip === 'Escalation') list = list.filter(s => escalationSellerIds.has(s.id))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        s.business.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q)
      )
    }
    return list
  }, [search, filterChip])

  useEffect(() => {
    if (selected && !filtered.find(s => s.id === selected.id)) {
      setSelected(filtered[0] || null)
    }
  }, [filtered])

  const overdueCount    = MOCK_SELLERS.filter(s => overdueSellerIds.has(s.id)).length
  const escalationCount = MOCK_SELLERS.filter(s => escalationSellerIds.has(s.id)).length

  const CHIPS = [
    { key: 'All',        label: 'All',        count: null },
    { key: 'Overdue',    label: 'Overdue',    count: overdueCount,    bg: '#fee2e2', color: '#b91c1c' },
    { key: 'Escalation', label: 'Escalation', count: escalationCount, bg: '#fef3c7', color: '#92400e' },
  ]

  return (
    <div className="flex gap-5 h-full">

      {/* List — always 320 px */}
      <div className="w-80 shrink-0 flex flex-col min-h-0">
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden flex flex-col flex-1">
          <div className="px-4 py-3 border-b border-slate-50 space-y-2.5">
            <h3 className="font-semibold text-slate-800 text-[14px]">Sellers</h3>

            {/* Search */}
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search sellers…"
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

          {/* Seller rows */}
          <div className="divide-y divide-slate-50 flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="px-5 py-8 text-[12px] text-slate-400 text-center">No sellers found</div>
            )}
            {filtered.map(s => {
              const isEscalation = escalationSellerIds.has(s.id)
              const isOverdue    = overdueSellerIds.has(s.id)
              const dotColor = isEscalation ? '#92400e' : isOverdue ? '#b91c1c' : null
              return (
                <div key={s.id}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                  style={{ borderLeft: selected?.id === s.id ? '3px solid var(--color-primary)' : '3px solid transparent' }}
                  onClick={() => { setSelected(s); setTab('Overview') }}>
                  <Avatar initials={s.name.split(' ').map(w => w[0]).join('').slice(0, 2)} bg="var(--color-primary)" size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[13px] text-slate-800 truncate">{s.business}</span>
                      {dotColor && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dotColor }} />}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">{s.name} · {s.city}</div>
                  </div>
                  <Badge stage={s.status} />
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
              <Avatar initials={selected.name.split(' ').map(w=>w[0]).join('').slice(0,2)} bg="var(--color-primary)" size="sm" />
              <div className="flex-1">
                <div className="font-bold text-slate-800 text-[14px]">{selected.business}</div>
                <div className="text-[11px] text-slate-400">{selected.name} · {selected.city} · CR {selected.cr}</div>
              </div>
              <HealthScore seller={selected} />
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

                  {/* KPI grid + static fields */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Volume MTD', value: formatSAR(selected.volumeMTD) },
                        { label: 'Invoice Count', value: selected.invoiceCount },
                        { label: 'MDR Rate', value: `${selected.mdrRate}%` },
                        { label: 'Sector', value: SELLER_EXTRA[selected.id]?.sector || 'General' },
                      ].map(f => (
                        <div key={f.label} className="bg-slate-50 rounded-xl px-3 py-2.5">
                          <div className="text-[10px] text-slate-400 mb-0.5">{f.label}</div>
                          <div className="text-[14px] font-bold text-slate-800">{f.value}</div>
                        </div>
                      ))}
                    </div>
                    <div className="text-[13px]">
                      {[
                        { label: 'IBAN', value: SELLER_EXTRA[selected.id]?.iban },
                        { label: 'CR Number', value: selected.cr },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                          <span className="text-slate-400">{r.label}</span>
                          <span className="font-medium text-slate-700">{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Linked Buyers */}
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2.5">Linked Buyers</div>
                    <div className="space-y-2">
                      {(SELLER_EXTRA[selected.id]?.linkedBuyers || []).map(bId => {
                        const buyer = MOCK_BUYERS.find(b => b.id === bId)
                        if (!buyer) return null
                        const pct = Math.round((buyer.creditUsed / buyer.creditLimit) * 100)
                        return (
                          <div key={bId} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100">
                            <Avatar initials={buyer.initials} bg={buyer.risk === 'High' ? '#737373' : 'var(--color-primary)'} size="sm" />
                            <div className="flex-1">
                              <div className="text-[13px] font-semibold text-slate-800">{buyer.name}</div>
                              <div className="text-[11px] text-slate-400">SIMAH {buyer.simahScore} · {buyer.city}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[11px] font-semibold mb-1" style={{ color: pct > 80 ? '#737373' : '#262626' }}>{pct}% used</div>
                              <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct > 80 ? '#737373' : 'var(--color-primary)' }} />
                              </div>
                            </div>
                          </div>
                        )
                      })}
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
                          {selected.id === 'seller-001'
                            ? 'Zahrani Trading Co. has maintained consistent volume over 12+ months with a 97.5% on-time disbursement record. MDR rate of 2.5% is within standard range. No payment disputes on record. Recommended for limit increase consideration.'
                            : 'Amoudi Distribution shows strong growth trajectory with 14.2M MTD volume. One ISO certification is outstanding which may affect eligibility for premium tier. Recommend following up on document.'}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Active Credit Exposure', value: formatSAR(selected.volumeMTD * 0.6) },
                          { label: 'MDR Rate', value: `${selected.mdrRate}%` },
                        ].map(f => (
                          <div key={f.label} className="bg-slate-50 rounded-xl px-3 py-2.5">
                            <div className="text-[10px] text-slate-400 mb-0.5">{f.label}</div>
                            <div className="text-[14px] font-bold text-slate-800">{f.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {tab === 'Transactions' && (
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-slate-50">
                      {['ID', 'Buyer', 'Amount', 'Date', 'Stage'].map(h => (
                        <th key={h} className="text-start py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_REQUESTS.map(r => (
                      <tr key={r.id} className="border-b border-slate-50 last:border-0">
                        <td className="py-2.5 font-mono text-slate-500">{r.id}</td>
                        <td className="py-2.5 text-slate-700">{r.buyer}</td>
                        <td className="py-2.5 font-semibold tabular-nums">{formatSAR(r.amount)}</td>
                        <td className="py-2.5 text-slate-400">{r.submitted?.slice(0,10)}</td>
                        <td className="py-2.5"><Badge stage={r.stage} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {tab === 'Documents' && (
                <div className="space-y-2">
                  {(SELLER_EXTRA[selected.id]?.docs || []).map((doc, i) => {
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

            </div>
          </div>
        </div>
      )}

    </div>
  )
}
