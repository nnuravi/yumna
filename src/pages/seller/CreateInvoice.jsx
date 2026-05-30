import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { MOCK_BUYERS, formatSAR } from '../../data/mockData'
import AddBuyerSheet from './AddBuyerSheet'

const STEPS = ['Invoice Details', 'Credit Terms', 'MDR Config', 'Review & Sign']

const MDR_SCENARIOS = [
  { id: 'A', label: 'Seller Covers MDR', labelAr: 'البائع يتحمل الرسوم', desc: 'Buyer pays only the invoice amount. You absorb the MDR cost.', icon: '↓' },
  { id: 'B', label: 'Buyer Covers MDR', labelAr: 'المشتري يتحمل الرسوم', desc: 'Buyer is charged the full MDR on top of the invoice value.', icon: '↑' },
  { id: 'C', label: 'Split MDR', labelAr: 'تقسيم الرسوم', desc: 'MDR cost is shared between you and the buyer at a custom ratio.', icon: '⇄' },
]

const MDR_RATE = 2.5
const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB

export default function CreateInvoice() {
  const navigate = useNavigate()
  const { state, dispatch, addToast } = useApp()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    buyer: null,
    poRef: '',
    amount: '',
    uploadedFile: null,
    lineItems: [],
    tenure: 60,
    mdrScenario: 'A',
    splitRatio: 50,
    notes: '',
  })
  const [showInviteSheet, setShowInviteSheet] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [showOtp, setShowOtp] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const otpRefs = useRef([])

  const amount = parseFloat(form.amount) || 0
  const vat = amount * 0.15
  const total = amount + vat
  const mdrAmount = total * (MDR_RATE / 100)
  const sellerPct = form.mdrScenario === 'A' ? 100 : form.mdrScenario === 'B' ? 0 : (100 - form.splitRatio)
  const netPayout = total - mdrAmount * (sellerPct / 100)

  const canContinue = () => {
    if (step === 0) return form.buyer && form.poRef && amount >= 10000
    if (step === 1) return form.tenure > 0
    return true
  }

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    if (val && i < 5) otpRefs.current[i + 1]?.focus()
  }

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
  }

  const handleSubmit = () => {
    if (otp.join('').length < 6) return
    setSubmitting(true)
    setTimeout(() => {
      const frId = `FR-${String(Date.now()).slice(-4)}`
      dispatch({
        type: 'SUBMIT',
        payload: {
          id: frId,
          buyer: form.buyer.name,
          seller: 'Zahrani Trading Co.',
          amt: total,
          raw: amount,
          tenure: form.tenure,
          mdr: form.mdrScenario,
          mdrRate: MDR_RATE,
          riskScore: Math.floor(Math.random() * 40) + 10,
        },
      })
      addToast(`Finance request ${frId} submitted!`)
      setSubmitting(false)
      navigate('/seller/status')
    }, 1200)
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--color-page)' }}>
      {/* Header */}
      <header className="px-5 pt-4 pb-3 flex items-center gap-3 bg-white border-b border-black/5">
        <button
          onClick={() => step === 0 ? navigate(-1) : setStep(s => s - 1)}
          className="w-9 h-9 rounded-full bg-card border border-black/5 flex items-center justify-center"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className="flex-1">
          <div className="font-semibold text-ink text-[15px]">New Finance Request</div>
          <div className="text-[11px] text-muted">{STEPS[step]}</div>
        </div>
        <div className="text-[12px] font-semibold text-muted">{step + 1}/{STEPS.length}</div>
      </header>

      {/* Step progress */}
      <div className="px-5 py-3 bg-white border-b border-black/5">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className="h-1 flex-1 rounded-full transition-all duration-500"
              style={{ background: i <= step ? 'var(--color-primary)' : 'var(--color-line)' }} />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">
        {step === 0 && (
          <StepInvoiceDetails
            form={form}
            setForm={setForm}
            amount={amount}
            vat={vat}
            total={total}
            onInvite={() => setShowInviteSheet(true)}
          />
        )}
        {step === 1 && <StepCreditTerms form={form} setForm={setForm} total={total} />}
        {step === 2 && <StepMDR form={form} setForm={setForm} total={total} mdrAmount={mdrAmount} netPayout={netPayout} />}
        {step === 3 && !showOtp && (
          <StepReview form={form} total={total} mdrAmount={mdrAmount} netPayout={netPayout} />
        )}
        {step === 3 && showOtp && (
          <div className="px-5 pt-8 pb-8">
            <h2 className="display text-xl text-ink mb-2">Enter OTP</h2>
            <p className="text-muted text-[13px] mb-6">Sent to {form.buyer?.phone || '+966 5X XXX X678'}</p>
            <div className="flex gap-2 justify-center mb-6">
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={el => otpRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  className="w-11 h-13 text-center text-xl font-semibold rounded-xl border-2 bg-white outline-none transition-colors"
                  style={{ borderColor: d ? 'var(--color-primary)' : 'var(--color-line)' }}
                />
              ))}
            </div>
            <p className="text-center text-[12px] text-muted mb-8">Resend code in 00:45</p>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="px-5 pb-6 pt-3 bg-white border-t border-black/5 safe-bottom">
        {step < 3 ? (
          <button
            onClick={() => canContinue() && setStep(s => s + 1)}
            disabled={!canContinue()}
            className="w-full py-3.5 rounded-full text-white font-semibold text-[15px] transition-all disabled:opacity-40"
            style={{ background: 'var(--color-primary)' }}
          >
            Continue →
          </button>
        ) : !showOtp ? (
          <button
            onClick={() => setShowOtp(true)}
            className="w-full py-3.5 rounded-full text-white font-semibold text-[15px]"
            style={{ background: 'var(--color-primary)' }}
          >
            Sign & Submit
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={otp.join('').length < 6 || submitting}
            className="w-full py-3.5 rounded-full text-white font-semibold text-[15px] transition-all disabled:opacity-40"
            style={{ background: 'var(--color-primary)' }}
          >
            {submitting ? 'Submitting…' : 'Confirm Signature'}
          </button>
        )}
      </div>

      {/* Invite sheet overlay — reused from AddBuyer flow */}
      {showInviteSheet && (
        <AddBuyerSheet
          seller={state.currentUser}
          onClose={() => setShowInviteSheet(false)}
        />
      )}
    </div>
  )
}

/* ─── Step 1: Invoice Details ─────────────────────────────────────────────── */

function StepInvoiceDetails({ form, setForm, amount, vat, total, onInvite }) {
  const [buyerSearch, setBuyerSearch] = useState('')
  const fileRef = useRef(null)
  const [fileError, setFileError] = useState('')

  const filtered = MOCK_BUYERS.filter(b => {
    const q = buyerSearch.toLowerCase()
    return !q || b.name.toLowerCase().includes(q) || b.cr.includes(q)
  })

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_BYTES) {
      setFileError('File exceeds 10 MB — please choose a smaller file.')
      e.target.value = ''
      return
    }
    setFileError('')
    setForm(f => ({ ...f, uploadedFile: file }))
  }

  const removeFile = () => {
    setForm(f => ({ ...f, uploadedFile: null }))
    if (fileRef.current) fileRef.current.value = ''
    setFileError('')
  }

  const fmtBytes = (n) => n < 1024 * 1024
    ? `${(n / 1024).toFixed(0)} KB`
    : `${(n / (1024 * 1024)).toFixed(1)} MB`

  return (
    <div className="px-5 pt-5 pb-8 flex flex-col gap-5">

      {/* ── Buyer selector ── */}
      <Field label="Select Buyer">
        {/* Search input */}
        <div className="relative mb-2.5">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="2"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search by name or CR number…"
            value={buyerSearch}
            onChange={e => setBuyerSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-white text-[13px] outline-none focus:border-primary transition-colors"
            style={{ borderColor: 'var(--color-line)' }}
          />
          {buyerSearch && (
            <button
              onClick={() => setBuyerSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>

        {/* Buyer list */}
        <div className="flex flex-col gap-2">
          {filtered.map(b => (
            <button
              key={b.id}
              onClick={() => setForm(f => ({ ...f, buyer: b }))}
              className="w-full p-3.5 rounded-xl border-2 text-start transition-all"
              style={{
                borderColor: form.buyer?.id === b.id ? 'var(--color-primary)' : 'var(--color-line)',
                background: form.buyer?.id === b.id ? 'rgba(143,133,255,0.06)' : '#fff',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold shrink-0"
                  style={{ background: form.buyer?.id === b.id ? 'var(--color-primary)' : 'var(--color-ink)' }}
                >
                  {b.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13px] text-ink">{b.name}</div>
                  <div className="text-[11px] text-muted">CR {b.cr} · Limit {formatSAR(b.creditLimit)}</div>
                </div>
                {form.buyer?.id === b.id && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" className="shrink-0">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                )}
              </div>
            </button>
          ))}

          {/* No results state */}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed p-5 text-center" style={{ borderColor: 'var(--color-line)' }}>
              <p className="text-[13px] font-medium text-ink mb-0.5">
                No buyer found for <span className="font-semibold">"{buyerSearch}"</span>
              </p>
              <p className="text-[12px] text-muted mb-3">They may not be in your credit circle yet.</p>
              <button
                onClick={onInvite}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-white font-semibold text-[12px]"
                style={{ background: 'var(--color-primary)' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Invite Buyer
              </button>
            </div>
          )}
        </div>
      </Field>

      {/* ── PO Reference ── */}
      <Field label="PO Reference">
        <input
          type="text"
          placeholder="e.g. PO-2026-0042"
          value={form.poRef}
          onChange={e => setForm(f => ({ ...f, poRef: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl border bg-white text-[14px] outline-none transition-colors focus:border-primary"
          style={{ borderColor: 'var(--color-line)' }}
        />
      </Field>

      {/* ── Invoice Amount ── */}
      <Field label="Invoice Amount (excl. VAT)">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-[13px] font-medium" dir="ltr">SAR</span>
          <input
            type="number"
            placeholder="0"
            min="10000"
            dir="ltr"
            value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            className="w-full pl-12 pr-4 py-3 rounded-xl border bg-white text-[14px] outline-none transition-colors focus:border-primary tabular"
            style={{ borderColor: 'var(--color-line)' }}
          />
        </div>
        {amount > 0 && amount < 10000 && (
          <p className="text-[11px] mt-1" style={{ color: 'var(--color-danger)' }}>
            Minimum invoice amount is SAR 10,000
          </p>
        )}
      </Field>

      {/* ── Document upload ── */}
      <Field label="Proforma Invoice / Invoice Document">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="sr-only"
          onChange={handleFileChange}
        />

        {!form.uploadedFile ? (
          /* Empty zone */
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full flex flex-col items-center gap-2 py-6 rounded-2xl border-2 border-dashed transition-colors hover:border-primary group"
            style={{ borderColor: fileError ? 'var(--color-danger)' : 'var(--color-line)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: fileError ? 'rgba(229,72,77,0.08)' : 'var(--color-card)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke={fileError ? 'var(--color-danger)' : 'var(--color-muted)'}
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[13px] font-semibold" style={{ color: fileError ? 'var(--color-danger)' : 'var(--color-ink)' }}>
                {fileError || 'Upload invoice document'}
              </p>
              {!fileError && (
                <p className="text-[11px] text-muted mt-0.5">PDF, JPG or PNG · max 10 MB</p>
              )}
            </div>
          </button>
        ) : (
          /* File selected */
          <div
            className="flex items-center gap-3 p-3.5 rounded-2xl border-2"
            style={{ borderColor: '#10b981', background: '#f0fdf4' }}
          >
            <div className="w-9 h-9 rounded-xl bg-white border border-emerald-200 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-ink truncate">{form.uploadedFile.name}</p>
              <p className="text-[11px] text-muted">{fmtBytes(form.uploadedFile.size)}</p>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-danger transition-colors shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        )}
      </Field>

      {/* VAT summary */}
      {amount >= 10000 && (
        <div className="bg-white rounded-2xl border border-black/5 p-4">
          <div className="eyebrow mb-3">Invoice Summary</div>
          <Line label="Amount (excl. VAT)" value={formatSAR(amount)} />
          <Line label="VAT (15%)" value={formatSAR(vat)} />
          <div className="border-t border-black/5 mt-2 pt-2">
            <Line label="Total Invoice" value={formatSAR(total)} bold />
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Step 2: Credit Terms ────────────────────────────────────────────────── */

function StepCreditTerms({ form, setForm, total }) {
  const buyer = form.buyer
  const availableCredit = buyer ? buyer.creditLimit - buyer.creditUsed : 0
  const sufficient = total <= availableCredit

  return (
    <div className="px-5 pt-5 pb-8 flex flex-col gap-4">
      <Field label="Credit Tenure">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {[30, 60, 90, 120, 180].map(t => (
            <button
              key={t}
              onClick={() => setForm(f => ({ ...f, tenure: t }))}
              className="py-3 rounded-xl border-2 text-center text-[13px] font-semibold transition-all"
              style={{
                borderColor: form.tenure === t ? 'var(--color-primary)' : 'var(--color-line)',
                background: form.tenure === t ? 'rgba(143,133,255,0.08)' : '#fff',
                color: form.tenure === t ? 'var(--color-primary)' : 'var(--color-ink-soft)',
              }}
            >
              {t}d
            </button>
          ))}
        </div>
      </Field>

      {buyer && (
        <div className="bg-white rounded-2xl border border-black/5 p-4">
          <div className="eyebrow mb-3">Buyer Credit Check</div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[13px] text-muted">Available Credit</span>
            <span className="font-semibold tabular">{formatSAR(availableCredit)}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] text-muted">This Invoice</span>
            <span className="font-semibold tabular">{formatSAR(total)}</span>
          </div>
          <div className="progress-track h-2 mb-2">
            <div className="progress-fill h-full" style={{
              width: `${Math.min(100, (buyer.creditUsed / buyer.creditLimit) * 100)}%`,
              background: sufficient ? 'var(--color-primary)' : 'var(--color-danger)',
            }} />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
              style={{ background: sufficient ? '#ecfdf5' : '#fff1f2' }}>
              {sufficient
                ? <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                : <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#e5484d" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
              }
            </div>
            <span className="text-[12px] font-medium" style={{ color: sufficient ? '#059669' : '#e5484d' }}>
              {sufficient ? 'Sufficient credit limit' : 'Credit limit exceeded'}
            </span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-black/5 p-4">
        <div className="eyebrow mb-3">Due Date Preview</div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted">Repayment due</span>
          <span className="font-semibold text-[14px]">
            {new Date(Date.now() + form.tenure * 86400000).toLocaleDateString('en-SA', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ─── Step 3: MDR Config ──────────────────────────────────────────────────── */

function StepMDR({ form, setForm, total, mdrAmount, netPayout }) {
  return (
    <div className="px-5 pt-5 pb-8 flex flex-col gap-4">
      <Field label="MDR Scenario">
        <div className="flex flex-col gap-2">
          {MDR_SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => setForm(f => ({ ...f, mdrScenario: s.id }))}
              className="w-full p-4 rounded-xl border-2 text-start transition-all"
              style={{
                borderColor: form.mdrScenario === s.id ? 'var(--color-primary)' : 'var(--color-line)',
                background: form.mdrScenario === s.id ? 'rgba(143,133,255,0.06)' : '#fff',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[16px]"
                  style={{ background: form.mdrScenario === s.id ? 'rgba(143,133,255,0.12)' : 'var(--color-card)' }}>
                  {s.icon}
                </div>
                <div>
                  <div className="font-semibold text-[13px] text-ink">{s.label}</div>
                  <div className="text-[11px] text-muted leading-snug">{s.desc}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Field>

      {form.mdrScenario === 'C' && (
        <Field label={`Split Ratio — Seller: ${form.splitRatio}% / Buyer: ${100 - form.splitRatio}%`}>
          <input
            type="range"
            min={10} max={90} step={10}
            value={form.splitRatio}
            onChange={e => setForm(f => ({ ...f, splitRatio: parseInt(e.target.value) }))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[11px] text-muted">Seller 10%</span>
            <span className="text-[11px] text-muted">Seller 90%</span>
          </div>
        </Field>
      )}

      <div className="bg-white rounded-2xl border border-black/5 p-4">
        <div className="eyebrow mb-3">Payout Preview</div>
        <Line label="Invoice Total" value={formatSAR(total)} />
        <Line label={`MDR (${MDR_RATE}%)`} value={`− ${formatSAR(mdrAmount)}`} />
        <div className="border-t border-black/5 mt-2 pt-2">
          <Line
            label={form.mdrScenario === 'B' ? 'You receive (full MDR)' : 'Net payout to you'}
            value={formatSAR(netPayout)}
            bold
            highlight
          />
        </div>
      </div>
    </div>
  )
}

/* ─── Step 4: Review & Sign ───────────────────────────────────────────────── */

function StepReview({ form, total, mdrAmount, netPayout }) {
  const MDR_LABELS = { A: 'Seller bears full MDR', B: 'Buyer bears full MDR', C: 'Split MDR' }
  return (
    <div className="px-5 pt-5 pb-8 flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-black/5 p-4">
        <div className="eyebrow mb-3">Invoice Details</div>
        <Line label="Buyer" value={form.buyer?.name} />
        <Line label="PO Reference" value={form.poRef} />
        <Line label="Invoice Total" value={formatSAR(total)} />
        <Line label="Tenure" value={`${form.tenure} days`} />
        <Line label="MDR Scenario" value={MDR_LABELS[form.mdrScenario]} />
        <Line
          label="Document"
          value={form.uploadedFile
            ? form.uploadedFile.name
            : '—'
          }
        />
        <div className="border-t border-black/5 mt-2 pt-2">
          <Line label="Net payout to you" value={formatSAR(netPayout)} bold highlight />
        </div>
      </div>

      <div className="rounded-2xl border p-4" style={{ borderColor: 'rgba(143,133,255,0.3)', background: 'rgba(143,133,255,0.05)' }}>
        <p className="text-[12px] leading-relaxed" style={{ color: 'var(--color-ink-soft)' }}>
          By submitting, you authorize Yumna to process this finance request in accordance with the platform agreement and MDR terms you have selected. An OTP will be sent to your registered mobile to confirm.
        </p>
      </div>
    </div>
  )
}

/* ─── Shared helpers ──────────────────────────────────────────────────────── */

function Field({ label, children }) {
  return (
    <div>
      <label className="eyebrow mb-2 block">{label}</label>
      {children}
    </div>
  )
}

function Line({ label, value, bold, highlight }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[13px] text-muted">{label}</span>
      <span
        className={`text-[13px] tabular ${bold ? 'font-semibold' : 'font-medium'} max-w-[55%] truncate text-right`}
        style={{ color: highlight ? 'var(--color-primary)' : 'var(--color-ink)' }}
      >
        {value}
      </span>
    </div>
  )
}
