import { useState } from 'react'
import Badge from '../../components/Badge'
import Avatar from '../../components/Avatar'
import { MOCK_BUYERS, MOCK_SELLERS, formatSAR } from '../../data/mockData'

export default function BuyerSellerSection() {
  const [tab, setTab] = useState('Buyers')
  const [selectedBuyer, setSelectedBuyer] = useState(null)
  const [buyerDetailTab, setBuyerDetailTab] = useState('Profile Details')

  return (
    <div className="max-w-6xl">
      {/* Tab toggle */}
      <div className="flex gap-2 mb-5">
        {['Buyers', 'Sellers'].map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setSelectedBuyer(null) }}
            className="px-4 py-2 rounded-full text-[13px] font-semibold border transition-all"
            style={{
              background: tab === t ? 'var(--color-primary)' : '#fff',
              color: tab === t ? '#fff' : 'var(--color-muted)',
              borderColor: tab === t ? 'transparent' : 'var(--color-line)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Buyers' && (
        <div className="flex gap-5">
          {/* Table */}
          <div className={selectedBuyer ? 'w-[420px] shrink-0' : 'flex-1'}>
            <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/5 bg-card">
                    <th className="text-start px-4 py-3 eyebrow">Buyer</th>
                    {!selectedBuyer && <th className="text-start px-4 py-3 eyebrow">SIMAH</th>}
                    <th className="text-start px-4 py-3 eyebrow">Credit Limit</th>
                    {!selectedBuyer && <th className="text-start px-4 py-3 eyebrow">Utilisation</th>}
                    <th className="text-start px-4 py-3 eyebrow">Risk</th>
                    {!selectedBuyer && <th className="text-start px-4 py-3 eyebrow">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_BUYERS.map(b => {
                    const pct = Math.round((b.creditUsed / b.creditLimit) * 100)
                    return (
                      <tr
                        key={b.id}
                        className="border-b border-black/5 last:border-0 cursor-pointer hover:bg-card transition-colors"
                        style={{ borderLeft: selectedBuyer?.id === b.id ? '3px solid var(--color-primary)' : undefined }}
                        onClick={() => { setSelectedBuyer(b); setBuyerDetailTab('Profile Details') }}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar initials={b.initials} bg={b.risk === 'High' ? '#e5484d' : 'var(--color-primary)'} size="sm" />
                            <div>
                              <div className="font-semibold text-[13px] text-ink">{b.name}</div>
                              <div className="text-[11px] text-muted">CR {b.cr}</div>
                            </div>
                          </div>
                        </td>
                        {!selectedBuyer && <td className="px-4 py-3.5 text-[13px] font-semibold tabular">{b.simahScore}</td>}
                        <td className="px-4 py-3.5 text-[13px] tabular">{formatSAR(b.creditLimit)}</td>
                        {!selectedBuyer && (
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-line overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct > 80 ? '#e5484d' : 'var(--color-primary)' }} />
                              </div>
                              <span className="text-[11px] font-semibold" style={{ color: pct > 80 ? '#e5484d' : 'var(--color-ink-soft)' }}>{pct}%</span>
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3.5"><Badge stage={b.risk} /></td>
                        {!selectedBuyer && (
                          <td className="px-4 py-3.5">
                            <button onClick={e => { e.stopPropagation(); setSelectedBuyer(b) }}
                              className="text-[12px] font-semibold px-2.5 py-1 rounded-lg"
                              style={{ background: 'rgba(143,133,255,0.1)', color: 'var(--color-primary)' }}>
                              View →
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

          {/* Buyer detail */}
          {selectedBuyer && (
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
                <div className="px-5 py-4 border-b border-black/5 flex items-center gap-3">
                  <button onClick={() => setSelectedBuyer(null)} className="text-muted hover:text-ink">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                  <Avatar initials={selectedBuyer.initials} bg={selectedBuyer.risk === 'High' ? '#e5484d' : 'var(--color-primary)'} size="sm" />
                  <div className="flex-1">
                    <div className="font-semibold text-ink">{selectedBuyer.name}</div>
                    <div className="text-[11px] text-muted">{selectedBuyer.city} · SIMAH {selectedBuyer.simahScore}</div>
                  </div>
                  <Badge stage={selectedBuyer.risk} />
                </div>

                <div className="flex border-b border-black/5 overflow-x-auto">
                  {['Profile Details', 'Ledger', 'Finance Requests', 'Credit Ratio'].map(t => (
                    <button key={t} onClick={() => setBuyerDetailTab(t)}
                      className="px-4 py-2.5 text-[12px] font-semibold whitespace-nowrap border-b-2 transition-all"
                      style={{ borderColor: buyerDetailTab === t ? 'var(--color-primary)' : 'transparent', color: buyerDetailTab === t ? 'var(--color-primary)' : 'var(--color-muted)' }}>
                      {t}
                    </button>
                  ))}
                </div>

                <div className="p-5">
                  {buyerDetailTab === 'Profile Details' && (
                    <div>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {[
                          { label: 'Credit Limit', value: formatSAR(selectedBuyer.creditLimit) },
                          { label: 'Credit Used', value: formatSAR(selectedBuyer.creditUsed) },
                          { label: 'SIMAH Score', value: selectedBuyer.simahScore },
                          { label: 'Risk Category', value: selectedBuyer.risk },
                        ].map(kpi => (
                          <div key={kpi.label} className="p-3 rounded-xl bg-card border border-black/5">
                            <div className="eyebrow mb-0.5">{kpi.label}</div>
                            <div className="font-semibold text-[15px] tabular text-ink">{kpi.value}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mb-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-[12px] text-muted">Credit utilisation</span>
                          <span className="text-[12px] font-semibold">{Math.round((selectedBuyer.creditUsed/selectedBuyer.creditLimit)*100)}%</span>
                        </div>
                        <div className="progress-track h-2">
                          <div className="progress-fill h-full" style={{ width: `${Math.round((selectedBuyer.creditUsed/selectedBuyer.creditLimit)*100)}%` }} />
                        </div>
                      </div>
                      {[
                        { label: 'CR Number', value: selectedBuyer.cr },
                        { label: 'City', value: selectedBuyer.city },
                        { label: 'Phone', value: selectedBuyer.phone },
                        { label: 'Email', value: selectedBuyer.email },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between py-2 border-b border-black/5 last:border-0">
                          <span className="text-[12px] text-muted">{row.label}</span>
                          <span className="text-[12px] font-medium text-ink">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {buyerDetailTab === 'Ledger' && (
                    <table className="w-full text-[12px]">
                      <thead><tr className="border-b border-black/5"><th className="text-start py-2 eyebrow">Invoice</th><th className="text-start py-2 eyebrow">Debit</th><th className="text-start py-2 eyebrow">Credit</th><th className="text-start py-2 eyebrow">Balance</th></tr></thead>
                      <tbody>
                        {[
                          { inv: 'INV-0038', debit: 85000, credit: 0, balance: 85000 },
                          { inv: 'INV-0035', debit: 120000, credit: 0, balance: 205000 },
                          { inv: 'INV-0033', debit: 65000, credit: 65000, balance: 140000 },
                        ].map(row => (
                          <tr key={row.inv} className="border-b border-black/5 last:border-0">
                            <td className="py-2.5 font-medium">{row.inv}</td>
                            <td className="py-2.5 tabular text-red-500">{row.debit > 0 ? formatSAR(row.debit) : '—'}</td>
                            <td className="py-2.5 tabular text-emerald-600">{row.credit > 0 ? formatSAR(row.credit) : '—'}</td>
                            <td className="py-2.5 tabular font-semibold">{formatSAR(row.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {buyerDetailTab === 'Finance Requests' && (
                    <div className="space-y-2">
                      {[
                        { id: 'FR-0038', amount: 85000, stage: 'disbursed', date: '2026-05-20' },
                        { id: 'FR-0033', amount: 65000, stage: 'overdue', date: '2026-04-10' },
                      ].map(r => (
                        <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-black/5">
                          <div>
                            <div className="font-semibold text-[13px]">{r.id}</div>
                            <div className="text-[11px] text-muted">{r.date}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold tabular text-[13px]">{formatSAR(r.amount)}</div>
                            <Badge stage={r.stage} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {buyerDetailTab === 'Credit Ratio' && (
                    <div>
                      <div className={`p-4 rounded-xl mb-4 border ${selectedBuyer.creditUsed / selectedBuyer.creditLimit > 0.9 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                        <div className="font-semibold text-[13px] mb-1" style={{ color: selectedBuyer.creditUsed / selectedBuyer.creditLimit > 0.9 ? '#e5484d' : '#059669' }}>
                          {selectedBuyer.creditUsed / selectedBuyer.creditLimit > 0.9 ? '⚠ Credit utilisation above 90%' : '✓ Credit utilisation within safe range'}
                        </div>
                        <div className="text-[12px]" style={{ color: 'var(--color-ink-soft)' }}>
                          {formatSAR(selectedBuyer.creditUsed)} used of {formatSAR(selectedBuyer.creditLimit)} limit ({Math.round((selectedBuyer.creditUsed/selectedBuyer.creditLimit)*100)}%)
                        </div>
                      </div>
                      <div className="progress-track h-3">
                        <div className="progress-fill h-full" style={{
                          width: `${Math.round((selectedBuyer.creditUsed/selectedBuyer.creditLimit)*100)}%`,
                          background: selectedBuyer.creditUsed / selectedBuyer.creditLimit > 0.9 ? '#e5484d' : 'var(--color-primary)',
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'Sellers' && (
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/5 bg-card">
                <th className="text-start px-4 py-3 eyebrow">Seller</th>
                <th className="text-start px-4 py-3 eyebrow">CR</th>
                <th className="text-start px-4 py-3 eyebrow">Volume MTD</th>
                <th className="text-start px-4 py-3 eyebrow">Invoices</th>
                <th className="text-start px-4 py-3 eyebrow">MDR Rate</th>
                <th className="text-start px-4 py-3 eyebrow">Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_SELLERS.map(s => (
                <tr key={s.id} className="border-b border-black/5 last:border-0 hover:bg-card transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-[13px] text-ink">{s.business}</div>
                    <div className="text-[11px] text-muted">{s.name} · {s.city}</div>
                  </td>
                  <td className="px-4 py-3.5 text-[12px] text-muted">{s.cr}</td>
                  <td className="px-4 py-3.5 font-semibold tabular text-[13px]">{formatSAR(s.volumeMTD)}</td>
                  <td className="px-4 py-3.5 text-[13px]">{s.invoiceCount}</td>
                  <td className="px-4 py-3.5 text-[13px] font-semibold">{s.mdrRate}%</td>
                  <td className="px-4 py-3.5"><Badge stage={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
