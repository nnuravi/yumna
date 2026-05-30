import { useApp } from '../../context/AppContext'
import { MOCK_BUYERS, formatSAR } from '../../data/mockData'

const TAT_TEAMS = [
  { team: 'Loan Verification', avg: '2.8 hrs', target: '4 hrs', pct: 70 },
  { team: 'Credit Scoring', avg: '3.4 hrs', target: '4 hrs', pct: 85 },
  { team: 'Risk Analysis', avg: '4.1 hrs', target: '4 hrs', pct: 103 },
  { team: 'Collections', avg: '6.2 hrs', target: '8 hrs', pct: 78 },
]

export default function BizOverview({ onNavigate }) {
  const { state } = useApp()
  const pendingRequests = state.liveStatus === 'submitted' ? 1 : 0

  return (
    <div className="space-y-6 max-w-6xl">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Overall Credit Distributed', value: 'SAR 142M', delta: '+18% vs last 30d', positive: true },
          { label: 'Risk-to-Credit Ratio', value: '4.2%', delta: 'Within SAMA threshold', positive: true },
          { label: 'Avg TAT – Verification', value: '3.1 hrs', delta: 'Target < 4 hrs', positive: true },
          { label: 'Pending Reviews', value: `${pendingRequests + 2}`, delta: `${pendingRequests} new today`, positive: null },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-black/5 p-5">
            <div className="eyebrow mb-2">{kpi.label}</div>
            <div className="display text-3xl tabular text-ink mb-1">{kpi.value}</div>
            <div className="text-[11px] font-medium" style={{
              color: kpi.positive === true ? '#10b981' : kpi.positive === false ? '#e5484d' : 'var(--color-muted)'
            }}>
              {kpi.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Two-column panel */}
      <div className="grid grid-cols-2 gap-4">
        {/* Finance Pipeline */}
        <div className="bg-white rounded-2xl border border-black/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink text-[14px]">Finance Requests Pipeline</h3>
            <button onClick={() => onNavigate('foms')} className="text-[12px] font-semibold" style={{ color: 'var(--color-primary)' }}>
              View FOMS →
            </button>
          </div>
          <div className="space-y-2">
            {[
              { stage: 'Submitted / Pending', count: pendingRequests + 2, color: '#6b7280' },
              { stage: 'Under Review', count: 3, color: '#d97706' },
              { stage: 'Approved / Disbursed', count: 8, color: '#10b981' },
              { stage: 'Overdue Collection', count: 2, color: '#e5484d' },
            ].map(row => (
              <div key={row.stage} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: row.color }} />
                <div className="flex-1 text-[13px] text-ink-soft">{row.stage}</div>
                <div className="font-semibold text-[13px] tabular">{row.count}</div>
              </div>
            ))}
          </div>
          {state.liveStatus === 'submitted' && (
            <div className="mt-4 px-3 py-2.5 rounded-xl flex items-center gap-2 border" style={{ background: 'rgba(143,133,255,0.06)', borderColor: 'rgba(143,133,255,0.3)' }}>
              <div className="w-2 h-2 rounded-full live-dot" style={{ background: 'var(--color-primary)' }}/>
              <span className="text-[12px] font-medium" style={{ color: 'var(--color-primary)' }}>
                {state.liveData?.id} — New submission from {state.liveData?.seller}
              </span>
            </div>
          )}
        </div>

        {/* Credit Trends */}
        <div className="bg-white rounded-2xl border border-black/5 p-5">
          <h3 className="font-semibold text-ink text-[14px] mb-4">Credit Utilisation by Buyer</h3>
          <div className="space-y-3">
            {MOCK_BUYERS.map(b => {
              const pct = Math.round((b.creditUsed / b.creditLimit) * 100)
              return (
                <div key={b.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] text-ink-soft">{b.name}</span>
                    <span className="text-[12px] font-semibold tabular" style={{ color: pct > 80 ? '#e5484d' : 'var(--color-ink)' }}>
                      {pct}%
                    </span>
                  </div>
                  <div className="progress-track h-1.5">
                    <div className="progress-fill h-full" style={{
                      width: `${pct}%`,
                      background: pct > 80 ? '#e5484d' : 'var(--color-primary)',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* TAT Table */}
      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-black/5">
          <h3 className="font-semibold text-ink text-[14px]">Team TAT Score</h3>
          <p className="text-[12px] text-muted mt-0.5">Turn-around time per team vs. target</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/5">
              <th className="text-start px-5 py-3 eyebrow">Team</th>
              <th className="text-start px-5 py-3 eyebrow">Avg TAT</th>
              <th className="text-start px-5 py-3 eyebrow">Target</th>
              <th className="text-start px-5 py-3 eyebrow">Status</th>
            </tr>
          </thead>
          <tbody>
            {TAT_TEAMS.map(row => (
              <tr key={row.team} className="border-b border-black/5 last:border-0 hover:bg-card transition-colors">
                <td className="px-5 py-3.5 text-[13px] font-medium text-ink">{row.team}</td>
                <td className="px-5 py-3.5 text-[13px] tabular">{row.avg}</td>
                <td className="px-5 py-3.5 text-[13px] text-muted">{row.target}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full bg-line overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: `${Math.min(100, row.pct)}%`,
                        background: row.pct > 100 ? '#e5484d' : '#10b981',
                      }} />
                    </div>
                    <span className={`text-[11px] font-semibold ${row.pct > 100 ? 'text-red-500' : 'text-emerald-600'}`}>
                      {row.pct > 100 ? 'Over target' : 'On track'}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
