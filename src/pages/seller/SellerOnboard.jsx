import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import AddBuyerSheet from './AddBuyerSheet'

const MAX_FILE = 10 * 1024 * 1024

const DOCS_CONFIG = [
  { key: 'cr',      label: 'Commercial Registration (CR)',   accept: '.pdf,.jpg,.jpeg,.png', hint: 'PDF or image of your CR certificate' },
  { key: 'ownerId', label: 'Owner ID / Power of Attorney',   accept: '.pdf,.jpg,.jpeg,.png', hint: 'National ID, Iqama, or signed POA' },
  { key: 'address', label: 'National Address Certificate',    accept: '.pdf',                hint: 'Issued by Saudi Post (Wasel)' },
  { key: 'vat',     label: 'VAT Certificate',                 accept: '.pdf',                hint: 'ZATCA VAT registration certificate' },
  { key: 'iban',    label: 'IBAN Letter (bank-issued)',        accept: '.pdf',                hint: 'Official letter confirming your IBAN' },
]

const CITIES = ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Khobar', 'Tabuk', 'Other']

/* ── CSS confetti animation injected once ─────────────────────────────────── */
const CONFETTI_STYLE = `
@keyframes confetti-fall {
  0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(80px) rotate(720deg); opacity: 0; }
}
.confetti-dot {
  position: absolute;
  width: 8px; height: 8px;
  border-radius: 2px;
  animation: confetti-fall 1.2s ease-out both;
}
@media (prefers-reduced-motion: reduce) {
  .confetti-dot { animation: none; opacity: 0; }
}
`

export default function SellerOnboard() {
  const navigate = useNavigate()
  const { state, dispatch, addToast } = useApp()
  const user = state.currentUser

  // phase: 'pre' | 'pending' | 'correction' | 'post' | 'done'
  const [phase, setPhase] = useState('pre')
  const [preStep, setPreStep] = useState(0)   // 0=Business, 1=Docs, 2=Review
  const [postStep, setPostStep] = useState(0) // 0=MDR, 1=Contract

  // Business details form
  const [biz, setBiz] = useState({ name: '', cr: '', city: '', phone: '', email: '' })

  // Document uploads: { cr: File|null, ownerId, address, vat, iban }
  const [docs, setDocs] = useState({ cr: null, ownerId: null, address: null, vat: null, iban: null })
  const [docErrors, setDocErrors] = useState({})
  const fileRefs = useRef({})

  // MDR terms
  const [mdrScrolled, setMdrScrolled] = useState(false)
  const [mdrAgreed, setMdrAgreed] = useState(false)
  const mdrScrollRef = useRef(null)

  // Contract
  const [contractScrolled, setContractScrolled] = useState(false)
  const [contractAgreed, setContractAgreed] = useState(false)
  const contractScrollRef = useRef(null)

  // OTP
  const [showOtp, setShowOtp] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [submitting, setSubmitting] = useState(false)
  const otpRefs = useRef([])

  // Correction doc
  const [correctionFile, setCorrectionFile] = useState(null)
  const correctionRef = useRef(null)

  // Bulk import sheet
  const [showImport, setShowImport] = useState(false)

  // Inject confetti styles once
  useEffect(() => {
    if (document.getElementById('confetti-style')) return
    const el = document.createElement('style')
    el.id = 'confetti-style'
    el.textContent = CONFETTI_STYLE
    document.head.appendChild(el)
  }, [])

  if (!user) { navigate('/'); return null }

  /* ── helpers ─────────────────────────────────────────────────────────────── */

  const canPreContinue = () => {
    if (preStep === 0) return biz.name && biz.cr && biz.city && biz.phone
    if (preStep === 1) return DOCS_CONFIG.every(d => docs[d.key])
    return true
  }

  const handleFileChange = (key, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE) {
      setDocErrors(prev => ({ ...prev, [key]: 'File exceeds 10 MB' }))
      e.target.value = ''
      return
    }
    setDocErrors(prev => ({ ...prev, [key]: null }))
    setDocs(prev => ({ ...prev, [key]: file }))
  }

  const removeDoc = (key) => {
    setDocs(prev => ({ ...prev, [key]: null }))
    if (fileRefs.current[key]) fileRefs.current[key].value = ''
    setDocErrors(prev => ({ ...prev, [key]: null }))
  }

  const fmtBytes = (n) => n < 1024 * 1024 ? `${(n / 1024).toFixed(0)} KB` : `${(n / (1024 * 1024)).toFixed(1)} MB`

  const handleMdrScroll = () => {
    const el = mdrScrollRef.current
    if (!el) return
    if (el.scrollTop / (el.scrollHeight - el.clientHeight) > 0.85) setMdrScrolled(true)
  }

  const handleContractScroll = () => {
    const el = contractScrollRef.current
    if (!el) return
    if (el.scrollTop / (el.scrollHeight - el.clientHeight) > 0.85) setContractScrolled(true)
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

  const handleSubmitApp = () => {
    addToast('Application submitted! Our team will review your documents.')
    setPhase('pending')
  }

  const handleOtpConfirm = () => {
    if (otp.join('').length < 6) return
    setSubmitting(true)
    setTimeout(() => {
      dispatch({ type: 'COMPLETE_ONBOARDING' })
      setSubmitting(false)
      setPhase('done')
    }, 1000)
  }

  /* ── Phase: PRE (wizard steps 1–3) ──────────────────────────────────────── */

  if (phase === 'pre') {
    const PRE_STEPS = ['Business Details', 'Documents', 'Review']
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: 'var(--color-page)' }}>
        <header className="px-5 pt-4 pb-3 flex items-center gap-3 bg-white border-b border-black/5">
          <button
            onClick={() => preStep === 0 ? navigate('/') : setPreStep(s => s - 1)}
            className="w-9 h-9 rounded-full bg-card border border-black/5 flex items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div className="flex-1">
            <div className="font-semibold text-ink text-[15px]">Seller Registration</div>
            <div className="text-[11px] text-muted">{PRE_STEPS[preStep]}</div>
          </div>
          <div className="text-[12px] font-semibold text-muted">{preStep + 1}/{PRE_STEPS.length}</div>
        </header>

        <div className="px-5 py-3 bg-white border-b border-black/5">
          <div className="flex gap-1.5">
            {PRE_STEPS.map((_, i) => (
              <div key={i} className="h-1 flex-1 rounded-full transition-all duration-500"
                style={{ background: i <= preStep ? 'var(--color-primary)' : 'var(--color-line)' }} />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {preStep === 0 && <StepBizDetails biz={biz} setBiz={setBiz} />}
          {preStep === 1 && (
            <StepDocuments
              docs={docs}
              docErrors={docErrors}
              fileRefs={fileRefs}
              onFileChange={handleFileChange}
              onRemove={removeDoc}
              fmtBytes={fmtBytes}
            />
          )}
          {preStep === 2 && <StepReview biz={biz} docs={docs} />}
        </div>

        <div className="px-5 pb-6 pt-3 bg-white border-t border-black/5 safe-bottom">
          {preStep < 2 ? (
            <button
              onClick={() => canPreContinue() && setPreStep(s => s + 1)}
              disabled={!canPreContinue()}
              className="w-full py-3.5 rounded-full text-white font-semibold text-[15px] transition-all disabled:opacity-40"
              style={{ background: 'var(--color-primary)' }}
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmitApp}
              className="w-full py-3.5 rounded-full text-white font-semibold text-[15px]"
              style={{ background: 'var(--color-primary)' }}
            >
              Submit Application
            </button>
          )}
        </div>
      </div>
    )
  }

  /* ── Phase: PENDING ──────────────────────────────────────────────────────── */

  if (phase === 'pending' || phase === 'correction') {
    const TRAIL = ['Submitted', 'Verification', 'Contract', 'Activated']
    const activeIdx = 0

    return (
      <div className="min-h-dvh flex flex-col" style={{ background: 'var(--color-page)' }}>
        <div className="px-5 pt-10 pb-6 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(143,133,255,0.1)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1 className="display text-2xl text-ink mb-1">Application Submitted</h1>
          <p className="text-muted text-[13px] max-w-xs mx-auto leading-relaxed">
            Our team is verifying your documents. Typically reviewed within <strong>4 hours</strong>.
          </p>
        </div>

        {/* Status trail */}
        <div className="mx-5 bg-white rounded-2xl border border-black/5 p-5 mb-4">
          <div className="eyebrow mb-4">Application Status</div>
          <div className="flex items-center">
            {TRAIL.map((label, i) => {
              const done = i < activeIdx
              const active = i === activeIdx
              const isLast = i === TRAIL.length - 1
              return (
                <div key={label} className="flex items-center" style={{ flex: isLast ? 'none' : 1 }}>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                      style={{ background: done ? '#10b981' : active ? 'var(--color-primary)' : 'var(--color-line)' }}>
                      {done
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                        : active
                          ? <div className="w-2.5 h-2.5 rounded-full bg-white live-dot" />
                          : <div className="w-2 h-2 rounded-full bg-white/40" />
                      }
                    </div>
                    <span className="text-[9px] font-medium text-center" style={{ color: active ? 'var(--color-ink)' : 'var(--color-muted)' }}>
                      {label}
                    </span>
                  </div>
                  {!isLast && (
                    <div className="flex-1 h-0.5 mx-1" style={{ background: done ? '#10b981' : 'var(--color-line)' }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Correction sub-state */}
        {phase === 'correction' && (
          <div className="mx-5 mb-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 mb-3">
              <div className="flex items-center gap-2 mb-1">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span className="font-semibold text-amber-800 text-[13px]">Action Required</span>
              </div>
              <p className="text-amber-700 text-[12px] leading-snug">
                <strong>Commercial Registration</strong> — please resubmit a clearer copy. The document was too blurry to read.
              </p>
            </div>

            {/* Re-upload zone */}
            <input ref={correctionRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only"
              onChange={e => {
                const f = e.target.files?.[0]
                if (f && f.size <= MAX_FILE) { setCorrectionFile(f); e.target.value = '' }
              }} />

            {!correctionFile ? (
              <button onClick={() => correctionRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 py-5 rounded-2xl border-2 border-dashed"
                style={{ borderColor: '#d97706', background: '#fffbeb' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <p className="text-[13px] font-semibold text-amber-700">Re-upload Commercial Registration</p>
                <p className="text-[11px] text-amber-600">PDF, JPG or PNG · max 10 MB</p>
              </button>
            ) : (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl border-2" style={{ borderColor: '#10b981', background: '#f0fdf4' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-ink truncate">{correctionFile.name}</p>
                </div>
                <button onClick={() => setCorrectionFile(null)} className="text-muted">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            )}

            <button
              onClick={() => { setCorrectionFile(null); setPhase('pending') }}
              disabled={!correctionFile}
              className="w-full mt-3 py-3 rounded-full text-white font-semibold text-[14px] disabled:opacity-40"
              style={{ background: '#d97706' }}
            >
              Resubmit Document
            </button>
          </div>
        )}

        {/* Support link */}
        <p className="text-center text-[12px] text-muted px-5 mb-6">
          Questions? <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>Contact Yumna Support</span>
        </p>

        {/* Dev test shortcuts */}
        <div className="mx-5 mb-8 p-4 rounded-2xl border border-dashed border-black/10 bg-card">
          <div className="eyebrow mb-3 text-center">🛠 Prototype Test Controls</div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => { addToast('Admin approved your application'); setPhase('post') }}
              className="w-full py-2.5 rounded-xl text-[13px] font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700"
            >
              Dev: Simulate Admin Approval ✓
            </button>
            {phase !== 'correction' && (
              <button
                onClick={() => { addToast('Document correction requested', 'error'); setPhase('correction') }}
                className="w-full py-2.5 rounded-xl text-[13px] font-semibold border border-amber-200 bg-amber-50 text-amber-700"
              >
                Dev: Simulate Document Rejection ⚠
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ── Phase: POST — MDR + Contract ────────────────────────────────────────── */

  if (phase === 'post') {
    const POST_STEPS = ['MDR Agreement', 'Contract Signing']

    return (
      <div className="min-h-dvh flex flex-col" style={{ background: 'var(--color-page)' }}>
        {/* Approval banner */}
        <div className="px-5 py-3 flex items-center gap-2" style={{ background: 'var(--color-primary)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
          <span className="text-white text-[12px] font-semibold">Yumna has approved your application — complete the final steps to activate your account</span>
        </div>

        <header className="px-5 pt-3 pb-3 flex items-center gap-3 bg-white border-b border-black/5">
          <button
            onClick={() => postStep === 0 ? setPhase('pending') : setPostStep(0)}
            className="w-9 h-9 rounded-full bg-card border border-black/5 flex items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div className="flex-1">
            <div className="font-semibold text-ink text-[15px]">{POST_STEPS[postStep]}</div>
            <div className="text-[11px] text-muted">Step {postStep + 1} of {POST_STEPS.length}</div>
          </div>
        </header>

        <div className="px-5 py-3 bg-white border-b border-black/5">
          <div className="flex gap-1.5">
            {POST_STEPS.map((_, i) => (
              <div key={i} className="h-1 flex-1 rounded-full transition-all duration-500"
                style={{ background: i <= postStep ? 'var(--color-primary)' : 'var(--color-line)' }} />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {postStep === 0 && (
            <StepMDRTerms
              scrollRef={mdrScrollRef}
              onScroll={handleMdrScroll}
              scrolled={mdrScrolled}
              agreed={mdrAgreed}
              setAgreed={setMdrAgreed}
            />
          )}
          {postStep === 1 && !showOtp && (
            <StepContract
              scrollRef={contractScrollRef}
              onScroll={handleContractScroll}
              scrolled={contractScrolled}
              agreed={contractAgreed}
              setAgreed={setContractAgreed}
              biz={biz}
              user={user}
            />
          )}
          {postStep === 1 && showOtp && (
            <div className="px-5 pt-8 pb-8">
              <h2 className="display text-xl text-ink mb-1">أدخل رمز التحقق</h2>
              <h3 className="font-semibold text-ink text-lg mb-5">Enter Verification Code</h3>
              <p className="text-muted text-[13px] mb-8">Sent to {user.phone || '+966 5X XXX XXXX'}</p>
              <div className="flex gap-2.5 justify-center mb-6">
                {otp.map((d, i) => (
                  <input key={i} ref={el => otpRefs.current[i] = el}
                    type="text" inputMode="numeric" maxLength={1} value={d}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKey(i, e)}
                    className="w-11 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-white outline-none transition-colors"
                    style={{ borderColor: d ? 'var(--color-primary)' : 'var(--color-line)' }}
                  />
                ))}
              </div>
              <p className="text-center text-[12px] text-muted">Resend code in 00:45</p>
            </div>
          )}
        </div>

        <div className="px-5 pb-6 pt-3 bg-white border-t border-black/5 safe-bottom">
          {postStep === 0 ? (
            <button
              onClick={() => setPostStep(1)}
              disabled={!mdrAgreed}
              className="w-full py-3.5 rounded-full text-white font-semibold text-[15px] disabled:opacity-40 transition-opacity"
              style={{ background: 'var(--color-primary)' }}
            >
              Continue →
            </button>
          ) : !showOtp ? (
            <button
              onClick={() => setShowOtp(true)}
              disabled={!contractAgreed}
              className="w-full py-3.5 rounded-full text-white font-semibold text-[15px] disabled:opacity-40 transition-opacity"
              style={{ background: 'var(--color-primary)' }}
            >
              Sign &amp; Activate
            </button>
          ) : (
            <button
              onClick={handleOtpConfirm}
              disabled={otp.join('').length < 6 || submitting}
              className="w-full py-3.5 rounded-full text-white font-semibold text-[15px] disabled:opacity-40 transition-opacity"
              style={{ background: 'var(--color-primary)' }}
            >
              {submitting ? 'Activating…' : 'Confirm Signature'}
            </button>
          )}
        </div>
      </div>
    )
  }

  /* ── Phase: DONE — Celebration ───────────────────────────────────────────── */

  if (phase === 'done') {
    const CONFETTI_COLORS = ['#8f85ff','#10b981','#f59e0b','#e5484d','#6366f1','#3b82f6']
    const dots = Array.from({ length: 18 }, (_, i) => ({
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      left: `${5 + (i * 5.3) % 90}%`,
      top: `${10 + (i * 7.1) % 40}%`,
      delay: `${(i * 0.07).toFixed(2)}s`,
      rotate: `${i * 20}deg`,
    }))

    return (
      <div className="min-h-dvh flex flex-col" style={{ background: 'var(--color-page)' }}>
        {/* Confetti layer */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          {dots.map((d, i) => (
            <div key={i} className="confetti-dot" style={{
              background: d.color, left: d.left, top: d.top,
              animationDelay: d.delay, transform: `rotate(${d.rotate})`,
            }} />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8 relative z-10">
          {/* Hero */}
          <div className="flex flex-col items-center text-center pt-12 pb-6">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(16,185,129,0.12)' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <div className="font-semibold text-ink text-[28px] leading-tight mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              مرحباً بك في يُمنى!
            </div>
            <div className="display text-2xl text-ink mb-2">You're live on Yumna!</div>
            <p className="text-muted text-[13px] max-w-xs leading-relaxed">
              Your account is fully activated. You can now create finance requests and grow your trade business.
            </p>
          </div>

          {/* Account card */}
          <div className="bg-white rounded-2xl border border-black/5 p-4 mb-4">
            <div className="eyebrow mb-3">Account Summary</div>
            {[
              { label: 'Business', value: biz.name || user.name },
              { label: 'CR Number', value: biz.cr || user.cr || 'N/A' },
              { label: 'Account ID', value: user.id },
              { label: 'MDR Rate', value: '2.50%' },
              { label: 'Activated', value: new Date().toLocaleDateString('en-SA', { day: 'numeric', month: 'long', year: 'numeric' }) },
            ].map(row => (
              <div key={row.label} className="flex justify-between py-1.5 border-b border-black/5 last:border-0">
                <span className="text-[12px] text-muted">{row.label}</span>
                <span className="text-[13px] font-semibold text-ink truncate max-w-[55%] text-right">{row.value}</span>
              </div>
            ))}
          </div>

          {/* What's next */}
          <div className="bg-white rounded-2xl border border-black/5 p-4 mb-4">
            <div className="eyebrow mb-3">What's next</div>
            {[
              { icon: '👥', text: 'Add your buyers to your credit circle' },
              { icon: '📄', text: 'Create your first finance request' },
              { icon: '💸', text: 'Track disbursements in real time' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-3 py-2 border-b border-black/5 last:border-0">
                <span className="text-lg shrink-0">{item.icon}</span>
                <span className="text-[13px] text-ink-soft">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Buyer import nudge */}
          <div className="rounded-2xl border-2 p-4 mb-4"
            style={{ borderColor: 'var(--color-primary)', background: 'rgba(143,133,255,0.04)' }}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(143,133,255,0.1)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-ink text-[14px] mb-0.5">Add your buyers to get started</p>
                <p className="text-muted text-[12px] leading-snug">Invite buyers to your credit circle so they can start placing orders on Yumna credit.</p>
              </div>
            </div>
            <button
              onClick={() => setShowImport(true)}
              className="w-full py-3 rounded-xl text-white font-semibold text-[14px] mb-2"
              style={{ background: 'var(--color-primary)' }}
            >
              Add Buyers Now →
            </button>
            <button
              onClick={() => navigate('/seller')}
              className="w-full py-2 text-[13px] text-muted text-center"
            >
              Add Later — Go to Dashboard
            </button>
          </div>
        </div>

        {showImport && (
          <AddBuyerSheet seller={{ ...user, name: biz.name || user.name, business: biz.name || user.business }} onClose={() => { setShowImport(false); navigate('/seller') }} />
        )}
      </div>
    )
  }

  return null
}

/* ── Step components ─────────────────────────────────────────────────────── */

function StepBizDetails({ biz, setBiz }) {
  const set = (key) => (e) => setBiz(b => ({ ...b, [key]: e.target.value }))
  return (
    <div className="px-5 pt-5 pb-8 flex flex-col gap-4">
      <div className="rounded-2xl border border-black/5 bg-white p-4 text-center mb-2">
        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-ink-soft)' }}>
          Welcome to Yumna! Let's get your wholesale business set up. This takes about 5 minutes.
        </p>
      </div>

      <Field label="Business / Trade Name">
        <input type="text" placeholder="e.g. Al-Rashid Trading Co." value={biz.name}
          onChange={set('name')}
          className="w-full px-4 py-3 rounded-xl border bg-white text-[14px] outline-none focus:border-primary transition-colors"
          style={{ borderColor: 'var(--color-line)' }} />
      </Field>

      <Field label="Commercial Registration (CR) Number">
        <input type="text" dir="ltr" placeholder="10-digit CR number" value={biz.cr}
          onChange={set('cr')}
          className="w-full px-4 py-3 rounded-xl border bg-white text-[14px] outline-none focus:border-primary transition-colors tabular"
          style={{ borderColor: 'var(--color-line)' }} />
      </Field>

      <Field label="City">
        <select value={biz.city} onChange={set('city')}
          className="w-full px-4 py-3 rounded-xl border bg-white text-[14px] outline-none focus:border-primary transition-colors appearance-none"
          style={{ borderColor: 'var(--color-line)' }}>
          <option value="">Select city…</option>
          {['Riyadh','Jeddah','Dammam','Mecca','Medina','Khobar','Tabuk','Other'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>

      <Field label="Mobile Number">
        <div className="flex gap-2">
          <div className="flex items-center px-3 rounded-xl border bg-card text-[14px] font-semibold text-ink-soft shrink-0"
            style={{ borderColor: 'var(--color-line)' }} dir="ltr">🇸🇦 +966</div>
          <input type="tel" inputMode="numeric" dir="ltr" placeholder="5X XXX XXXX"
            value={biz.phone} onChange={set('phone')}
            className="flex-1 min-w-0 px-4 py-3 rounded-xl border bg-white text-[14px] outline-none focus:border-primary transition-colors tabular"
            style={{ borderColor: 'var(--color-line)' }} />
        </div>
      </Field>

      <Field label="Email Address (optional)">
        <input type="email" dir="ltr" placeholder="you@business.sa" value={biz.email}
          onChange={set('email')}
          className="w-full px-4 py-3 rounded-xl border bg-white text-[14px] outline-none focus:border-primary transition-colors"
          style={{ borderColor: 'var(--color-line)' }} />
      </Field>
    </div>
  )
}

function StepDocuments({ docs, docErrors, fileRefs, onFileChange, onRemove, fmtBytes }) {
  const uploadedCount = DOCS_CONFIG.filter(d => docs[d.key]).length
  return (
    <div className="px-5 pt-5 pb-8 flex flex-col gap-4">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="font-semibold text-ink text-[15px]">Required Documents</h2>
          <p className="text-[12px] text-muted mt-0.5">Upload all 5 to continue · max 10 MB each</p>
        </div>
        <span className="text-[13px] font-semibold tabular" style={{ color: uploadedCount === 5 ? '#10b981' : 'var(--color-muted)' }}>
          {uploadedCount}/5
        </span>
      </div>

      {DOCS_CONFIG.map(doc => {
        const file = docs[doc.key]
        const err = docErrors[doc.key]
        return (
          <div key={doc.key}>
            <label className="eyebrow mb-1.5 block">{doc.label}</label>
            <input
              ref={el => fileRefs.current[doc.key] = el}
              type="file"
              accept={doc.accept}
              className="sr-only"
              onChange={e => onFileChange(doc.key, e)}
            />
            {!file ? (
              <button
                type="button"
                onClick={() => fileRefs.current[doc.key]?.click()}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 border-dashed text-start transition-colors hover:border-primary"
                style={{ borderColor: err ? 'var(--color-danger)' : 'var(--color-line)', background: err ? 'rgba(229,72,77,0.04)' : '#fff' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={err ? 'var(--color-danger)' : 'var(--color-muted)'} strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <div>
                  <p className="text-[13px] font-medium" style={{ color: err ? 'var(--color-danger)' : 'var(--color-ink)' }}>
                    {err || `Upload ${doc.label}`}
                  </p>
                  <p className="text-[11px] text-muted">{doc.hint}</p>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2"
                style={{ borderColor: '#10b981', background: '#f0fdf4' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-ink truncate">{file.name}</p>
                  <p className="text-[11px] text-muted">{fmtBytes(file.size)}</p>
                </div>
                <button type="button" onClick={() => onRemove(doc.key)} className="text-muted hover:text-danger transition-colors shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function StepReview({ biz, docs }) {
  return (
    <div className="px-5 pt-5 pb-8 flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-black/5 p-4">
        <div className="eyebrow mb-3">Business Details</div>
        {[
          { label: 'Business Name', value: biz.name },
          { label: 'CR Number', value: biz.cr },
          { label: 'City', value: biz.city },
          { label: 'Mobile', value: `+966 ${biz.phone}` },
          { label: 'Email', value: biz.email || '—' },
        ].map(row => (
          <div key={row.label} className="flex justify-between py-1.5 border-b border-black/5 last:border-0">
            <span className="text-[12px] text-muted">{row.label}</span>
            <span className="text-[13px] font-semibold text-ink truncate max-w-[55%] text-right" dir="ltr">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-black/5 p-4">
        <div className="eyebrow mb-3">Documents</div>
        {DOCS_CONFIG.map(doc => (
          <div key={doc.key} className="flex items-center gap-2.5 py-2 border-b border-black/5 last:border-0">
            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <span className="text-[12px] text-ink-soft">{doc.label}</span>
            <span className="text-[11px] text-muted ms-auto truncate">{docs[doc.key]?.name}</span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border p-4" style={{ borderColor: 'rgba(143,133,255,0.3)', background: 'rgba(143,133,255,0.05)' }}>
        <p className="text-[12px] leading-relaxed" style={{ color: 'var(--color-ink-soft)' }}>
          By submitting, you confirm all information is accurate. Yumna will review your documents and notify you within 4 hours. You'll then be asked to sign the platform agreement.
        </p>
      </div>
    </div>
  )
}

function StepMDRTerms({ scrollRef, onScroll, scrolled, agreed, setAgreed }) {
  return (
    <div className="px-5 pt-5 pb-8 flex flex-col gap-4">
      <div className="rounded-2xl p-5 mb-1 text-center" style={{ background: 'var(--color-ink)' }}>
        <div className="eyebrow text-white/40 mb-1">Proposed Rate</div>
        <div className="display text-5xl text-white tabular">2.50%</div>
        <div className="text-white/60 text-[12px] mt-1">MDR on financed invoice value</div>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 p-4">
        <div className="eyebrow mb-3">How it works</div>
        {[
          'You receive payment immediately after the buyer confirms delivery',
          'MDR is deducted from the invoice total before disbursement (Scenario A default)',
          'Rates are reviewed quarterly based on your transaction volume',
        ].map((t, i) => (
          <div key={i} className="flex items-start gap-2.5 py-2 border-b border-black/5 last:border-0">
            <div className="w-5 h-5 rounded-full shrink-0 mt-0.5 flex items-center justify-center text-white text-[10px] font-bold"
              style={{ background: 'var(--color-primary)' }}>{i + 1}</div>
            <p className="text-[13px] text-ink-soft leading-snug">{t}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="eyebrow mb-1.5">MDR Rate Agreement</div>
        <div ref={scrollRef} onScroll={onScroll}
          className="bg-white rounded-2xl border border-black/5 p-4 max-h-48 overflow-y-auto text-[12px] leading-relaxed mb-3"
          style={{ color: 'var(--color-ink-soft)' }}>
          <p className="font-semibold text-ink mb-2">MDR RATE AGREEMENT</p>
          <p className="mb-2">I, the undersigned Seller, hereby acknowledge and agree to the following Merchant Discount Rate (MDR) terms as proposed by Yumna Finance Co. ("Yumna"), a company regulated by the Saudi Central Bank (SAMA):</p>
          <p className="mb-2">1. The agreed MDR rate is <strong>2.50%</strong> applied to the total financed invoice value for each transaction processed through the Yumna platform.</p>
          <p className="mb-2">2. The MDR shall be deducted by Yumna from the gross invoice amount prior to disbursement of funds to the Seller's registered IBAN.</p>
          <p className="mb-2">3. This rate may be revised quarterly based on transaction volume, repayment performance, and prevailing market conditions. Yumna will provide 14 days' notice of any rate changes.</p>
          <p className="mb-2">4. The Seller acknowledges that the MDR represents the cost of the invoice discounting and early payment service provided by Yumna.</p>
          <p className="mb-2">5. The Seller may negotiate alternative MDR split arrangements with buyers for individual transactions, subject to platform rules.</p>
          <p className="text-muted text-[11px] mt-3">{scrolled ? '✓ Agreement reviewed' : '↓ Scroll to continue'}</p>
        </div>
        <div className="progress-track h-1 mb-3">
          <div className="progress-fill h-full" style={{ width: scrolled ? '100%' : '0%', transition: 'width 0.3s' }} />
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} disabled={!scrolled}
            className="mt-0.5 w-4 h-4 rounded accent-primary" />
          <div>
            <div className="text-[12px] font-medium text-ink">لقد قرأت وأوافق على شروط MDR</div>
            <div className="text-[12px] text-muted">I have read and agree to the MDR terms above</div>
          </div>
        </label>
      </div>
    </div>
  )
}

function StepContract({ scrollRef, onScroll, scrolled, agreed, setAgreed, biz, user }) {
  return (
    <div className="px-5 pt-5 pb-8 flex flex-col gap-4">
      <p className="text-[13px] text-muted">Please read the full agreement before signing.</p>
      <div ref={scrollRef} onScroll={onScroll}
        className="bg-white rounded-2xl border border-black/5 p-4 max-h-[45vh] overflow-y-auto text-[12px] leading-relaxed"
        style={{ color: 'var(--color-ink-soft)' }}>
        <p className="font-semibold text-ink mb-2 text-[13px]">PLATFORM & FACTORING AGREEMENT</p>
        <div className="border-b border-black/5 mb-3" />
        <p className="mb-2">This Seller Platform and Factoring Agreement ("Agreement") is entered into between <strong>Yumna Finance Co.</strong> ("Yumna"), a company regulated by SAMA under licence no. [XXXX], and the Seller identified herein.</p>
        <p className="mb-2">1. <strong>Services.</strong> Yumna provides invoice discounting and factoring services, enabling the Seller to receive early payment on financed invoices submitted through the Yumna platform.</p>
        <p className="mb-2">2. <strong>Assignment of Receivables.</strong> Upon submission and approval of each invoice, the Seller irrevocably assigns the corresponding receivable to Yumna for the duration of the credit tenure.</p>
        <p className="mb-2">3. <strong>Disbursement.</strong> Yumna shall disburse the net invoice amount (invoice value minus agreed MDR) to the Seller's registered IBAN within the agreed settlement period following buyer delivery confirmation.</p>
        <p className="mb-2">4. <strong>Representations.</strong> The Seller represents that all invoices submitted are genuine, represent actual goods or services delivered or to be delivered, and are free of prior encumbrances.</p>
        <p className="mb-2">5. <strong>Compliance.</strong> The Seller agrees to comply with all applicable SAMA regulations, AML requirements, and Yumna's platform policies as updated from time to time.</p>
        <p className="mb-2">6. <strong>Governing Law.</strong> This Agreement is governed by the laws of the Kingdom of Saudi Arabia.</p>
        <p className="text-muted text-[11px] mt-3">{scrolled ? '✓ Agreement reviewed' : '↓ Scroll to read the full agreement'}</p>
      </div>

      <div className="progress-track h-1">
        <div className="progress-fill h-full" style={{ width: scrolled ? '100%' : '0%', transition: 'width 0.3s' }} />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} disabled={!scrolled}
          className="mt-0.5 w-4 h-4 rounded accent-primary" />
        <div>
          <div className="text-[12px] font-medium text-ink">لقد قرأت وأوافق على اتفاقية المنصة</div>
          <div className="text-[12px] text-muted">I have read and agree to the Platform Agreement</div>
        </div>
      </label>

      <div className="bg-card rounded-xl border border-black/5 p-3">
        <p className="text-[11px] text-muted">
          "Sign & Activate" will send an OTP to your registered mobile for signature verification.
        </p>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="eyebrow mb-1.5 block">{label}</label>
      {children}
    </div>
  )
}
