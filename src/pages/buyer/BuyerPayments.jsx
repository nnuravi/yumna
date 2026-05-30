import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { MOCK_INVOICES_BUYER, formatSAR } from '../../data/mockData'
import Badge from '../../components/Badge'

const STATUS_ORDER = { overdue: 0, due_today: 1, due_soon: 2, upcoming: 3 }

export default function BuyerPayments() {
  const [subTab, setSubTab] = useState('Outstanding')
  const [payingId, setPayingId] = useState(null)
  const [payMethod, setPayMethod] = useState('SADAD')
  const [paid, setPaid] = useState([])
  const { dispatch, addToast, state } = useApp()

  const allInvoices = [...MOCK_INVOICES_BUYER.filter(i => !paid.includes(i.id))]
  const sorted = [...allInvoices].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
  const total = sorted.reduce((s, i) => s + i.amount, 0)

  const handlePay = (inv) => {
    setTimeout(() => {
      setPaid(p => [...p, inv.id])
      addToast(`Payment initiated for ${inv.id}`)
      setPayingId(null)
      if (state.liveData?.id === inv.frId) {
        dispatch({ type: 'BUYER_REPAY' })
      }
    }, 800)
  }

  return (
    <div className="px-5 pb-8">
      <h1 className="display text-xl text-ink mt-5 mb-4">Payments</h1>

      {/* Sub-tabs */}
      <div className="flex gap-2 mb-5">
        {['Outstanding', 'Payment Schedule'].map(t => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-all"
            style={{
              background: subTab === t ? 'var(--color-primary)' : '#fff',
              color: subTab === t ? '#fff' : 'var(--color-muted)',
              borderColor: subTab === t ? 'transparent' : 'var(--color-line)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {subTab === 'Outstanding' && (
        <div>
          {/* Summary */}
          <div className="bg-white rounded-2xl border border-black/5 p-4 mb-4">
            <div className="eyebrow mb-1">Total Outstanding</div>
            <div className="display text-2xl tabular text-ink">{formatSAR(total)}</div>
            <div className="text-[12px] text-muted mt-0.5">{sorted.length} invoices</div>
          </div>

          {sorted.length === 0 && (
            <div className="text-center py-12 text-muted text-[14px]">
              <div className="text-3xl mb-2">🎉</div>
              All payments are up to date
            </div>
          )}

          {sorted.map(inv => (
            <div key={inv.id} className="mb-2.5">
              <div
                className="bg-white rounded-2xl border p-4"
                style={{ borderColor: inv.status === 'overdue' ? '#fca5a5' : 'rgba(0,0,0,0.05)' }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-[14px] text-ink">{inv.id}</div>
                    <div className="text-[12px] text-muted">{inv.seller}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-[14px] tabular">{formatSAR(inv.amount)}</div>
                    <Badge stage={inv.status} className="mt-0.5" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted">
                    Due {new Date(inv.dueDate).toLocaleDateString('en-SA', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {inv.daysOverdue && ` · ${inv.daysOverdue} DPD`}
                  </span>
                  <button
                    onClick={() => setPayingId(inv.id)}
                    className="px-3 py-1.5 rounded-full text-white text-[11px] font-semibold"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    Pay Now →
                  </button>
                </div>
              </div>

              {/* Payment flow — inline */}
              {payingId === inv.id && (
                <div className="mt-2 bg-white rounded-2xl border border-black/5 p-4">
                  <div className="eyebrow mb-3">Payment Method</div>
                  <div className="flex gap-2 mb-4">
                    {['SADAD', 'Bank Transfer', 'Direct Debit'].map(m => (
                      <button
                        key={m}
                        onClick={() => setPayMethod(m)}
                        className="flex-1 py-2 rounded-xl border-2 text-[11px] font-semibold text-center transition-all"
                        style={{
                          borderColor: payMethod === m ? 'var(--color-primary)' : 'var(--color-line)',
                          background: payMethod === m ? 'rgba(143,133,255,0.06)' : '#fff',
                          color: payMethod === m ? 'var(--color-primary)' : 'var(--color-muted)',
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  {payMethod === 'SADAD' && (
                    <div className="bg-card rounded-xl p-3 mb-4 text-center">
                      <div className="eyebrow mb-1">SADAD Bill Code</div>
                      <div className="display text-2xl tabular tracking-widest text-ink">4521 8763</div>
                      <div className="text-[11px] text-muted mt-1">Valid until {new Date(inv.dueDate).toLocaleDateString()}</div>
                    </div>
                  )}

                  {payMethod === 'Bank Transfer' && (
                    <div className="bg-card rounded-xl p-3 mb-4">
                      <InfoRow label="Bank" value="Al Rajhi Bank" />
                      <InfoRow label="Account Name" value="Yumna Finance Co." />
                      <InfoRow label="IBAN" value="SA29 1000 0000 0001 9999" mono />
                      <InfoRow label="Reference" value={inv.id} />
                    </div>
                  )}

                  {payMethod === 'Direct Debit' && (
                    <div className="bg-card rounded-xl p-3 mb-4">
                      <p className="text-[12px] text-muted leading-relaxed">
                        Direct debit from your registered bank account ending in <strong>6789</strong> will be initiated for{' '}
                        <strong>{formatSAR(inv.amount)}</strong>.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => handlePay(inv)}
                    className="w-full py-3 rounded-xl text-white font-semibold text-[14px]"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    Confirm Payment
                  </button>
                  <button onClick={() => setPayingId(null)} className="w-full mt-2 py-2 text-[13px] text-muted">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {subTab === 'Payment Schedule' && (
        <div className="flex flex-col gap-2">
          {Object.entries({ Overdue: 'overdue', 'Due Today': 'due_today', 'Due Soon': 'due_soon', Upcoming: 'upcoming' }).map(([group, status]) => {
            const items = MOCK_INVOICES_BUYER.filter(i => i.status === status)
            if (!items.length) return null
            return (
              <div key={group}>
                <div className="eyebrow mb-2">{group}</div>
                {items.map(inv => (
                  <div key={inv.id} className="bg-white rounded-2xl border border-black/5 p-4 mb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-[14px] text-ink">{inv.id}</div>
                        <div className="text-[11px] text-muted">
                          {inv.daysOverdue ? `${inv.daysOverdue} days past due` :
                            `Due ${new Date(inv.dueDate).toLocaleDateString('en-SA', { month: 'short', day: 'numeric' })}`
                          }
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold tabular text-[14px]">{formatSAR(inv.amount)}</div>
                        <button className="text-[11px] font-semibold mt-1" style={{ color: 'var(--color-primary)' }}>
                          Pay →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-black/5 last:border-0">
      <span className="text-[11px] text-muted">{label}</span>
      <span className={`text-[12px] font-medium text-ink ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}
