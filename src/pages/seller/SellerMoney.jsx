import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import Badge from '../../components/Badge'
import { MOCK_REQUESTS, formatSAR } from '../../data/mockData'

const SUB_TABS = ['All Transactions', 'Total Business', 'Active Requests']

export default function SellerMoney() {
  const [subTab, setSubTab] = useState('All Transactions')
  const { state } = useApp()

  const allRequests = [...state.requests, ...MOCK_REQUESTS.filter(r => !state.requests.find(sr => sr.id === r.id))]
  const active = allRequests.filter(r => !['repaid', 'denied'].includes(r.stage))

  return (
    <div className="px-5 pb-8">
      <h1 className="display text-xl text-ink mt-5 mb-4">Money</h1>

      {/* Sub-tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {SUB_TABS.map(t => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className="shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-all"
            style={{
              background: subTab === t ? 'var(--color-primary)' : 'var(--color-white)',
              color: subTab === t ? '#fff' : 'var(--color-muted)',
              borderColor: subTab === t ? 'transparent' : 'var(--color-line)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {subTab === 'All Transactions' && (
        <div className="flex flex-col gap-2.5">
          {allRequests.length === 0 ? (
            <div className="text-center py-12 text-muted text-[14px]">No transactions yet</div>
          ) : (
            allRequests.map(req => (
              <div key={req.id} className="bg-white rounded-2xl p-4 border border-black/5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-ink text-[14px]">{req.id}</div>
                    <div className="text-[12px] text-muted mt-0.5">{req.buyer} · {(req.submitted || '').slice(0, 10)}</div>
                    <div className="text-[11px] text-muted mt-0.5">{req.tenure}d tenure · MDR {req.mdr}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold tabular text-[15px]">{formatSAR(req.amt || req.amount)}</div>
                    <Badge stage={req.stage} className="mt-1" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {subTab === 'Total Business' && (
        <div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Total Disbursed', value: 'SAR 8.1M', delta: '+18% 30d' },
              { label: 'Active Requests', value: active.length.toString(), delta: `${active.reduce((s,r)=>s+(r.amt||r.amount||0),0).toLocaleString()} SAR` },
              { label: 'Avg MDR Rate', value: '2.50%', delta: 'Platform rate' },
              { label: 'Success Rate', value: '94.2%', delta: 'Last 90 days' },
            ].map(kpi => (
              <div key={kpi.label} className="bg-white rounded-2xl p-4 border border-black/5">
                <div className="eyebrow mb-1">{kpi.label}</div>
                <div className="display text-xl tabular text-ink">{kpi.value}</div>
                <div className="text-[11px] text-muted mt-0.5">{kpi.delta}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'Active Requests' && (
        <div className="flex flex-col gap-2.5">
          {active.length === 0 ? (
            <div className="text-center py-12 text-muted text-[14px]">No active requests</div>
          ) : (
            active.map(req => (
              <div key={req.id} className="bg-white rounded-2xl p-4 border border-black/5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-[14px] text-ink">{req.id}</div>
                    <div className="text-[12px] text-muted">{req.buyer}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold tabular">{formatSAR(req.amt || req.amount)}</div>
                    <Badge stage={req.stage} className="mt-0.5" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-1.5 rounded-xl text-[11px] font-semibold bg-card border border-black/5 text-muted">
                    Raise Dispute
                  </button>
                  <button className="flex-1 py-1.5 rounded-xl text-[11px] font-semibold bg-card border border-black/5 text-muted">
                    Increase Limit
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
