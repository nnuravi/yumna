import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { formatSAR } from '../../data/mockData'

const MDR_RATE = 2.5

export default function MDRConsent() {
  const navigate = useNavigate()
  const { state, dispatch, addToast } = useApp()
  const fr = state.liveData
  const [screen, setScreen] = useState(1) // 1=notice, 2=breakdown, 3=consent, 4=otp, 5=success
  const [checked, setChecked] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [submitting, setSubmitting] = useState(false)
  const [resend, setResend] = useState(45)
  const scrollRef = useRef(null)
  const otpRefs = useRef([])

  const amt = fr?.amt || 0
  const mdrAmt = amt * (MDR_RATE / 100)
  const totalRepay = amt + (fr?.mdr === 'B' ? mdrAmt : fr?.mdr === 'C' ? mdrAmt * 0.5 : 0)
  const buyerMDR = fr?.mdr === 'B' ? mdrAmt : fr?.mdr === 'C' ? mdrAmt * 0.5 : 0
  const sellerMDR = fr?.mdr === 'A' ? mdrAmt : fr?.mdr === 'C' ? mdrAmt * 0.5 : 0

  // Resend countdown
  useEffect(() => {
    if (screen !== 4 || resend <= 0) return
    const t = setTimeout(() => setResend(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [screen, resend])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const pct = el.scrollTop / (el.scrollHeight - el.clientHeight)
    if (pct > 0.85) setScrolled(true)
  }

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    if (val && i < 5) otpRefs.current[i + 1]?.focus()
  }

  const handleOtpKey = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
  }

  const handleConfirm = () => {
    if (otp.join('').length < 6) return
    setSubmitting(true)
    setTimeout(() => {
      dispatch({ type: 'BUYER_CONFIRM' })
      setSubmitting(false)
      setScreen(5)
    }, 1200)
  }

  const handleDecline = () => {
    if (window.confirm('Are you sure? Declining will cancel this financing request. The seller will be notified.')) {
      addToast('MDR declined. Seller has been notified.', 'error')
      navigate('/buyer')
    }
  }

  if (!fr) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-5" style={{ background: 'var(--color-page)' }}>
        <p className="text-muted text-[14px] mb-4">No pending invoice</p>
        <button onClick={() => navigate('/buyer')} className="px-6 py-2.5 rounded-full text-white font-semibold" style={{ background: 'var(--color-primary)' }}>
          Go to Dashboard
        </button>
      </div>
    )
  }

  if (screen === 5) return <SuccessScreen fr={fr} totalRepay={totalRepay} navigate={navigate} />

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--color-page)' }}>
      {/* Header */}
      <header className="px-5 pt-4 pb-3 bg-white border-b border-black/5 flex items-center gap-3">
        {screen > 1 && screen < 4
          ? <button onClick={() => setScreen(s => s - 1)} className="w-9 h-9 rounded-full bg-card border border-black/5 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          : <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
        }
        <div className="flex-1">
          <div className="font-semibold text-ink text-[14px]">
            {screen === 1 ? 'MDR Notice' : screen === 2 ? 'Fee Breakdown' : screen === 3 ? 'Consent & Agreement' : 'Enter OTP'}
          </div>
          <div className="text-[11px] text-muted">
            {screen < 4 ? `${screen} of 3` : 'Verification'}
          </div>
        </div>
        {fr.mdr !== 'A' && screen < 4 && (
          <div className="flex gap-1">
            {[1,2,3].map(i => (
              <div key={i} className="w-6 h-1 rounded-full transition-all"
                style={{ background: i <= screen ? '#d97706' : 'var(--color-line)' }} />
            ))}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Screen 1 — Notice */}
        {screen === 1 && (
          <div className="px-5 pt-5 pb-8">
            <div className="rounded-2xl border p-4 mb-4" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div>
                  <div className="font-semibold text-amber-800 text-[13px] mb-0.5">مهم — قبل تأكيد الاستلام</div>
                  <div className="text-amber-700 text-[13px] font-medium">Important — Before Confirming Receipt</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-black/5 p-4 mb-4">
              <div className="eyebrow mb-3">Invoice Summary</div>
              <InfoLine label="Invoice" value={fr.id} />
              <InfoLine label="Seller" value={fr.seller} />
              <InfoLine label="Invoice Value" value={formatSAR(fr.amt)} bold />
            </div>

            <div className="bg-white rounded-2xl border border-black/5 p-4 mb-4">
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-ink-soft)' }}>
                {fr.mdr === 'B'
                  ? '💡 The seller has requested that you cover the full financing fee (MDR) for this transaction. Please review the breakdown before confirming receipt of goods.'
                  : '💡 The seller has requested a split of the financing fee (MDR). Please review the breakdown before confirming receipt of goods.'
                }
              </p>
            </div>
          </div>
        )}

        {/* Screen 2 — Breakdown */}
        {screen === 2 && (
          <div className="px-5 pt-5 pb-8">
            <div className="bg-white rounded-2xl border border-black/5 p-4 mb-3">
              <div className="eyebrow mb-3">Invoice Summary</div>
              <InfoLine label="Invoice Value (excl. VAT)" value={formatSAR(amt / 1.15)} />
              <InfoLine label="VAT (15%)" value={formatSAR(amt - amt / 1.15)} />
              <div className="border-t border-black/5 pt-2 mt-1">
                <InfoLine label="Total Invoice Value" value={formatSAR(amt)} bold />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-black/5 p-4 mb-3">
              <div className="eyebrow mb-3">MDR Charge Details</div>
              <InfoLine label="MDR Rate" value={`${MDR_RATE}%`} />
              <InfoLine label="MDR Amount" value={formatSAR(mdrAmt)} />
              {fr.mdr === 'B' && <InfoLine label="MDR Paid By" value="YOU (full)" highlight="danger" />}
              {fr.mdr === 'C' && (
                <>
                  <InfoLine label="Your Share (50%)" value={formatSAR(mdrAmt * 0.5)} highlight="danger" />
                  <InfoLine label="Seller's Share (50%)" value={formatSAR(mdrAmt * 0.5)} />
                </>
              )}
            </div>

            <div className="rounded-2xl border-2 p-4 mb-3" style={{ borderColor: 'var(--color-primary)', background: 'rgba(143,133,255,0.04)' }}>
              <div className="eyebrow mb-3">Your Repayment Summary</div>
              <InfoLine label="Invoice Principal" value={formatSAR(amt)} />
              {buyerMDR > 0 && <InfoLine label="Financing Fee (MDR)" value={formatSAR(buyerMDR)} highlight="danger" />}
              <div className="border-t border-primary/20 pt-2 mt-1">
                <InfoLine label="★ TOTAL YOU REPAY" value={formatSAR(totalRepay)} bold highlight="primary" />
              </div>
              <InfoLine label="Repayment Due" value={new Date(Date.now() + (fr.tenure||60) * 86400000).toLocaleDateString('en-SA', { day: 'numeric', month: 'long', year: 'numeric' })} />
              <InfoLine label="Credit Tenure" value={`${fr.tenure || 60} Days`} />
            </div>

            <div className="bg-card rounded-2xl border border-black/5 p-4">
              <div className="text-[11px] font-semibold text-muted mb-1">ℹ️ Why is there a fee?</div>
              <p className="text-[12px] leading-relaxed text-muted">
                Yumna provides financing to your seller so they receive funds immediately. This fee covers Yumna's financing service. It is agreed between you and the seller.
              </p>
            </div>
          </div>
        )}

        {/* Screen 3 — Consent */}
        {screen === 3 && (
          <div className="px-5 pt-5 pb-8">
            <p className="text-[13px] text-muted mb-3">Please read the full agreement before signing.</p>
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="bg-white rounded-2xl border border-black/5 p-4 max-h-[45vh] overflow-y-auto mb-4 text-[12px] leading-relaxed"
              style={{ color: 'var(--color-ink-soft)' }}
            >
              <div className="font-semibold text-ink mb-2 text-[13px]">MDR CONSENT AGREEMENT</div>
              <div className="border-b border-black/5 mb-3" />
              <p className="mb-3">I, the undersigned Buyer, hereby confirm:</p>
              <p className="mb-3">1. I have reviewed Invoice No. <strong>{fr.id}</strong> issued by <strong>{fr.seller}</strong> for a total value of <strong>{formatSAR(fr.amt)}</strong>.</p>
              <p className="mb-3">2. I acknowledge that a Merchant Discount Rate (MDR) of <strong>{MDR_RATE}%</strong>, amounting to <strong>{formatSAR(buyerMDR)}</strong>, will be added to my repayment obligation.</p>
              <p className="mb-3">3. My total repayment to Yumna will be <strong>{formatSAR(totalRepay)}</strong>, due on <strong>{new Date(Date.now() + (fr.tenure||60) * 86400000).toLocaleDateString('en-SA', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> ({fr.tenure || 60}-day tenure).</p>
              <p className="mb-3">4. I confirm that goods covered by this invoice have been received in full and in satisfactory condition.</p>
              <p className="mb-3">5. By signing, I authorise Yumna to disburse <strong>{formatSAR(fr.amt)}</strong> to the seller and record my repayment obligation as stated above.</p>
              <p className="mb-3">6. This agreement is governed by the laws of the Kingdom of Saudi Arabia and the regulations of the Saudi Central Bank (SAMA).</p>
              <p className="text-muted text-[11px]">{!scrolled ? '↓ Scroll to continue' : '✓ Agreement reviewed'}</p>
            </div>

            {/* Scroll progress bar */}
            <div className="progress-track h-1 mb-4">
              <div id="scroll-fill" className="progress-fill h-full" style={{ width: scrolled ? '100%' : '0%', transition: 'width 0.3s' }} />
            </div>

            <label className="flex items-start gap-3 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={checked}
                onChange={e => setChecked(e.target.checked)}
                disabled={!scrolled}
                className="mt-0.5 w-4 h-4 rounded accent-primary"
              />
              <div>
                <div className="text-[12px] font-medium text-ink">لقد قرأت وأوافق على الشروط أعلاه</div>
                <div className="text-[12px] text-muted">I have read and agree to the terms above</div>
              </div>
            </label>

            <div className="bg-card rounded-xl border border-black/5 p-3">
              <p className="text-[11px] text-muted">
                Sign & Confirm will send an OTP to: <strong>+966 5X XXX X{fr.buyer?.phone?.slice(-2) || '42'}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Screen 4 — OTP */}
        {screen === 4 && (
          <div className="px-5 pt-8 pb-8">
            <h2 className="display text-2xl text-ink mb-1">أدخل رمز التحقق</h2>
            <h3 className="font-semibold text-ink text-lg mb-2">Enter Verification Code</h3>
            <p className="text-muted text-[13px] mb-8">Sent to +966 5X XXX XX42</p>
            <div className="flex gap-2.5 justify-center mb-6">
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={el => otpRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKey(i, e)}
                  className="w-11 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-white outline-none transition-colors"
                  style={{ borderColor: d ? 'var(--color-primary)' : 'var(--color-line)' }}
                />
              ))}
            </div>
            <p className="text-center text-[12px] text-muted">
              {resend > 0 ? `Resend code in 00:${String(resend).padStart(2, '0')}` : (
                <button onClick={() => setResend(45)} className="font-semibold" style={{ color: 'var(--color-primary)' }}>Resend OTP</button>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Bottom CTAs */}
      <div className="px-5 pb-6 pt-3 bg-white border-t border-black/5 safe-bottom">
        {screen < 3 && (
          <button
            onClick={() => setScreen(s => s + 1)}
            className="w-full py-3.5 rounded-full text-white font-semibold text-[15px] mb-3"
            style={{ background: '#d97706' }}
          >
            {screen === 1 ? 'Review Fee Breakdown →' : 'Proceed to Agreement →'}
          </button>
        )}
        {screen === 3 && (
          <button
            onClick={() => setScreen(4)}
            disabled={!checked}
            className="w-full py-3.5 rounded-full text-white font-semibold text-[15px] mb-3 disabled:opacity-40 transition-opacity"
            style={{ background: '#d97706' }}
          >
            Sign & Confirm →
          </button>
        )}
        {screen === 4 && (
          <button
            onClick={handleConfirm}
            disabled={otp.join('').length < 6 || submitting}
            className="w-full py-3.5 rounded-full text-white font-semibold text-[15px] mb-3 disabled:opacity-40 transition-opacity"
            style={{ background: 'var(--color-primary)' }}
          >
            {submitting ? 'Confirming…' : 'Confirm Signature'}
          </button>
        )}
        {screen < 4 && (
          <button onClick={handleDecline} className="w-full py-2 text-[13px] font-medium text-danger text-center">
            ✕ I do not accept — Return to Invoice
          </button>
        )}
      </div>
    </div>
  )
}

function SuccessScreen({ fr, totalRepay, navigate }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 text-center" style={{ background: 'var(--color-page)' }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#ecfdf5' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
      </div>
      <div className="display text-xl text-ink mb-1">تم تأكيد الاستلام والموافقة</div>
      <div className="font-semibold text-ink text-[16px] mb-5">Delivery Confirmed & Fee Accepted</div>

      <div className="w-full bg-white rounded-2xl border border-black/5 p-4 mb-5 text-start">
        <InfoLine label="Invoice" value={fr.id} />
        <InfoLine label="Seller" value={fr.seller} />
        <InfoLine label="Total to Repay" value={formatSAR(totalRepay)} bold />
        <InfoLine label="Due Date" value={new Date(Date.now() + (fr.tenure||60) * 86400000).toLocaleDateString('en-SA', { day: 'numeric', month: 'long', year: 'numeric' })} />
        <InfoLine label="Signed" value={new Date().toLocaleString('en-SA')} />
      </div>

      <div className="flex items-center gap-2 mb-6 text-[12px]" style={{ color: 'var(--color-primary)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        Download Signed Agreement (PDF)
      </div>

      <p className="text-[12px] text-muted mb-6">A copy has been sent to your registered email.</p>

      <button
        onClick={() => navigate('/buyer')}
        className="w-full py-3.5 rounded-full text-white font-semibold text-[15px]"
        style={{ background: 'var(--color-primary)' }}
      >
        Go to My Invoices
      </button>
    </div>
  )
}

function InfoLine({ label, value, bold, highlight }) {
  const colorMap = { primary: 'var(--color-primary)', danger: 'var(--color-danger)' }
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-black/5 last:border-0">
      <span className="text-[12px] text-muted">{label}</span>
      <span className={`text-[13px] tabular ${bold ? 'font-bold' : 'font-medium'}`}
        style={{ color: highlight ? colorMap[highlight] : 'var(--color-ink)' }}>
        {value}
      </span>
    </div>
  )
}
