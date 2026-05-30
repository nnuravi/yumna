import { useState } from 'react'
import { formatSAR } from '../../data/mockData'

const SELLERS = [
  {
    id: 's1',
    initials: 'KZ',
    name: 'Zahrani Trading Co.',
    contact: 'Khalid Al-Zahrani',
    city: 'Jeddah',
    cr: '4030123456',
    phone: '+966 50 234 5678',
    email: 'khalid@zahranitrading.sa',
    txCount: 8,
    volume: 1240000,
    addedDate: '2025-01-12',
    lastTx: '2026-05-27',
    status: 'Active',
    transactions: [
      { id: 'FR-0038', amount: 85000, status: 'disbursed', date: '2026-05-20' },
      { id: 'FR-0035', amount: 120000, status: 'disbursed', date: '2026-05-15' },
      { id: 'FR-0033', amount: 65000, status: 'repaid', date: '2026-04-10' },
      { id: 'FR-0029', amount: 95000, status: 'repaid', date: '2026-03-05' },
    ],
  },
  {
    id: 's2',
    initials: 'TA',
    name: 'Amoudi Distribution',
    contact: 'Tariq Al-Amoudi',
    city: 'Jeddah',
    cr: '4030654321',
    phone: '+966 55 876 5432',
    email: 'tariq@amoudidist.sa',
    txCount: 3,
    volume: 480000,
    addedDate: '2025-09-03',
    lastTx: '2026-04-18',
    status: 'Active',
    transactions: [
      { id: 'FR-0031', amount: 200000, status: 'repaid', date: '2026-04-18' },
      { id: 'FR-0024', amount: 180000, status: 'repaid', date: '2026-03-01' },
    ],
  },
]

export default function BuyerSellers() {
  const [selected, setSelected] = useState(null)
  const [sellerTab, setSellerTab] = useState('Transactions')

  if (selected) {
    return <SellerDetail seller={selected} activeTab={sellerTab} onTabChange={setSellerTab} onBack={() => setSelected(null)} />
  }

  return (
    <div className="px-5 pb-8">
      <h1 className="display text-xl text-ink mt-5 mb-4">My Sellers</h1>
      <div className="flex flex-col gap-2.5">
        {SELLERS.map(s => (
          <button
            key={s.id}
            onClick={() => { setSelected(s); setSellerTab('Transactions') }}
            className="bg-white rounded-2xl border border-black/5 p-4 text-start hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-[13px] shrink-0"
                style={{ background: 'var(--color-primary)' }}>
                {s.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-ink text-[14px]">{s.name}</div>
                <div className="text-[11px] text-muted">{s.city} · {s.txCount} transactions</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-semibold text-[13px] tabular">{formatSAR(s.volume)}</div>
                <div className="text-[10px]" style={{ color: '#10b981' }}>{s.status}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <div className="text-[11px] text-muted">Last tx: {new Date(s.lastTx).toLocaleDateString('en-SA', { month: 'short', day: 'numeric' })}</div>
              <div className="text-[11px] text-muted">Added: {new Date(s.addedDate).toLocaleDateString('en-SA', { month: 'short', year: 'numeric' })}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function SellerDetail({ seller, activeTab, onTabChange, onBack }) {
  const TABS = ['Transactions', 'Contact', 'Activities']

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="px-5 pt-4 pb-4 bg-white border-b border-black/5">
        <button onClick={onBack} className="flex items-center gap-2 text-[13px] font-medium mb-3" style={{ color: 'var(--color-primary)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          My Sellers
        </button>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold shrink-0"
            style={{ background: 'var(--color-primary)' }}>
            {seller.initials}
          </div>
          <div>
            <div className="font-semibold text-ink text-[15px]">{seller.name}</div>
            <div className="text-[12px] text-muted">{seller.contact} · {seller.city}</div>
          </div>
        </div>
        {/* Contact strip */}
        <div className="flex gap-2">
          {[
            { label: 'Call', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.17 1.19 2 2 0 012.18 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.14a16 16 0 006.95 6.95l1.41-1.41a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg> },
            { label: 'WhatsApp', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg> },
            { label: 'Email', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
          ].map(a => (
            <button key={a.label} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-black/5 bg-card text-[11px] font-medium text-muted">
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="px-5 flex gap-2 py-3 border-b border-black/5 bg-white">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => onTabChange(t)}
            className="px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all"
            style={{
              background: activeTab === t ? 'var(--color-primary)' : '#fff',
              color: activeTab === t ? '#fff' : 'var(--color-muted)',
              borderColor: activeTab === t ? 'transparent' : 'var(--color-line)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-5 pt-4">
        {activeTab === 'Transactions' && (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white rounded-2xl border border-black/5 p-4">
                <div className="eyebrow mb-1">Volume</div>
                <div className="display text-xl tabular text-ink">{formatSAR(seller.volume)}</div>
              </div>
              <div className="bg-white rounded-2xl border border-black/5 p-4">
                <div className="eyebrow mb-1">Transactions</div>
                <div className="display text-xl tabular text-ink">{seller.txCount}</div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {seller.transactions.map(tx => (
                <div key={tx.id} className="bg-white rounded-2xl border border-black/5 p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[13px] text-ink">{tx.id}</div>
                    <div className="text-[11px] text-muted">{new Date(tx.date).toLocaleDateString('en-SA', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold tabular text-[13px]">{formatSAR(tx.amount)}</div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: tx.status === 'repaid' ? '#ecfdf5' : '#eff6ff', color: tx.status === 'repaid' ? '#059669' : '#3b82f6' }}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Contact' && (
          <div className="bg-white rounded-2xl border border-black/5 p-4">
            {[
              { label: 'Business', value: seller.name },
              { label: 'Contact', value: seller.contact },
              { label: 'City', value: seller.city },
              { label: 'CR Number', value: seller.cr },
              { label: 'Phone', value: seller.phone },
              { label: 'Email', value: seller.email },
              { label: 'Added', value: new Date(seller.addedDate).toLocaleDateString('en-SA', { month: 'long', year: 'numeric' }) },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-black/5 last:border-0">
                <span className="text-[12px] text-muted">{row.label}</span>
                <span className="text-[13px] font-medium text-ink">{row.value}</span>
              </div>
            ))}
            <button className="w-full mt-4 py-2.5 rounded-xl text-white font-semibold text-[13px]" style={{ background: '#25D366' }}>
              Message on WhatsApp
            </button>
          </div>
        )}

        {activeTab === 'Activities' && (
          <div className="relative">
            <div className="absolute left-3.5 top-4 bottom-4 w-0.5 rounded-full" style={{ background: 'var(--color-line)' }} />
            {[
              { text: `Invoice ${seller.transactions[0]?.id} disbursed`, time: '3 days ago', icon: '✓' },
              { text: `Delivery confirmed for ${seller.transactions[0]?.id}`, time: '4 days ago', icon: '📦' },
              { text: `Invoice ${seller.transactions[0]?.id} sent by seller`, time: '5 days ago', icon: '📄' },
              { text: `${seller.transactions[1]?.id} repaid — SAR ${(seller.transactions[1]?.amount||0).toLocaleString()}`, time: '15 days ago', icon: '💰' },
            ].map((event, i) => (
              <div key={i} className="relative flex items-start gap-4 mb-5 pl-10">
                <div className="absolute left-0 w-7 h-7 rounded-full bg-white border-2 border-line flex items-center justify-center text-[12px] shrink-0 z-10">
                  {event.icon}
                </div>
                <div className="bg-white rounded-xl border border-black/5 p-3 flex-1">
                  <p className="text-[12px] text-ink">{event.text}</p>
                  <p className="text-[10px] text-muted mt-0.5">{event.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
