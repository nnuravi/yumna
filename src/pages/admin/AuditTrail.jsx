import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { AUDIT_LOG } from '../../data/mockData'

export default function AuditTrail() {
  const { state } = useApp()
  const [search, setSearch] = useState('')

  // Merge live actions into audit log
  const liveEntries = []
  if (state.liveStatus) {
    if (state.liveStatus === 'submitted') {
      liveEntries.push({
        id: 'live-1',
        timestamp: new Date().toLocaleString('en-SA') + ' AST',
        actor: state.currentUser?.name || 'Khalid Al-Zahrani',
        role: 'Seller',
        action: 'Finance Request Submitted',
        entity: `${state.liveData?.id} · SAR ${state.liveData?.amt?.toLocaleString()}`,
        ip: '109.200.45.12',
        result: 'Success',
      })
    }
    if (['approved','denied','stalled'].includes(state.liveStatus) && state.adminDecision) {
      liveEntries.push({
        id: 'live-2',
        timestamp: new Date().toLocaleString('en-SA') + ' AST',
        actor: state.currentUser?.name || 'Admin',
        role: state.currentUser?.title || 'Admin',
        action: `Invoice ${state.adminDecision.charAt(0).toUpperCase() + state.adminDecision.slice(1)}`,
        entity: `${state.liveData?.id}`,
        ip: '10.0.1.99',
        result: 'Success',
      })
    }
    if (state.buyerConfirmed) {
      liveEntries.push({
        id: 'live-3',
        timestamp: new Date().toLocaleString('en-SA') + ' AST',
        actor: 'Ahmed Al-Otaibi',
        role: 'Buyer',
        action: 'Delivery Confirmed + eSign',
        entity: `${state.liveData?.id} · OTP Verified`,
        ip: '109.200.45.99',
        result: 'Success',
      })
    }
    if (state.disbursed) {
      liveEntries.push({
        id: 'live-4',
        timestamp: new Date().toLocaleString('en-SA') + ' AST',
        actor: 'System',
        role: 'Auto',
        action: 'Disbursement Processed',
        entity: `${state.liveData?.id} · SAR ${((state.liveData?.amt || 0) * 0.975).toLocaleString('en', { maximumFractionDigits: 0 })} → Seller IBAN`,
        ip: '—',
        result: 'Success',
      })
    }
  }

  const allEntries = [...liveEntries, ...AUDIT_LOG]
  const filtered = allEntries.filter(e =>
    !search || [e.actor, e.action, e.entity, e.role].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="max-w-6xl">
      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="2" className="absolute left-3.5 top-1/2 -translate-y-1/2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Search audit log…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-[13px] outline-none focus:border-primary transition-colors"
          style={{ borderColor: 'var(--color-line)' }}
        />
      </div>

      {/* Compliance note */}
      <div className="mb-4 px-4 py-3 rounded-xl border text-[12px]" style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#3b82f6' }}>
        Complete audit trail — all actions logged with actor ID, timestamp (UTC + AST), IP address, and result.
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-black/5 bg-card">
                {['Timestamp', 'Actor', 'Role', 'Action', 'Entity', 'IP Address', 'Result'].map(col => (
                  <th key={col} className="text-start px-4 py-3 eyebrow whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(entry => (
                <tr
                  key={entry.id}
                  className="border-b border-black/5 last:border-0 hover:bg-card transition-colors"
                  style={{ background: String(entry.id).startsWith('live') ? 'rgba(239,246,255,0.6)' : undefined }}
                >
                  <td className="px-4 py-3 text-[11px] font-mono text-muted whitespace-nowrap">{entry.timestamp}</td>
                  <td className="px-4 py-3 text-[12px] font-medium text-ink whitespace-nowrap">{entry.actor}</td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: entry.role === 'System' ? '#f3f4f6' : entry.role === 'Buyer' ? '#ecfdf5' : entry.role === 'Seller' ? 'rgba(143,133,255,0.1)' : '#eff6ff',
                        color: entry.role === 'System' ? '#6b7280' : entry.role === 'Buyer' ? '#059669' : entry.role === 'Seller' ? 'var(--color-primary)' : '#3b82f6',
                      }}>
                      {entry.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-ink-soft">{entry.action}</td>
                  <td className="px-4 py-3 text-[12px] text-muted max-w-[200px] truncate">{entry.entity}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-muted">{entry.ip}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-emerald-100 flex items-center justify-center">
                        <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-600">{entry.result}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-10 text-muted text-[13px]">No matching audit entries</div>
        )}

        <div className="px-4 py-3 border-t border-black/5 flex items-center justify-between">
          <span className="text-[12px] text-muted">{filtered.length} entries</span>
          <button className="text-[12px] font-semibold" style={{ color: 'var(--color-primary)' }}>
            Export CSV →
          </button>
        </div>
      </div>
    </div>
  )
}
