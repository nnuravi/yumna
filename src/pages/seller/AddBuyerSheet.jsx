import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { MOCK_BUYERS, formatSAR } from '../../data/mockData'

const INVITE_LINK = 'https://yumna.sa/register'

const CHANNELS = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    color: '#25D366',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
      </svg>
    ),
  },
  {
    id: 'sms',
    label: 'SMS',
    color: '#3b82f6',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    ),
  },
  {
    id: 'email',
    label: 'Email',
    color: '#8f85ff',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
  },
]

function normalizePhone(raw) {
  return raw.replace(/\D/g, '')
}

function buildInviteMessage(sellerName, sellerBusiness, contactName) {
  const greeting = contactName ? `مرحباً ${contactName}!` : 'مرحباً!'
  return (
    `${greeting} أنا ${sellerName} من ${sellerBusiness}.\n` +
    `أدعوك للانضمام إلى Yumna يُمنى — منصة الائتمان التجاري المعتمدة من ساما.\n` +
    `انضم عبر الرابط: ${INVITE_LINK}`
  )
}

function buildSendUrl(channel, phone, email, message) {
  if (channel === 'whatsapp') {
    const digits = normalizePhone(phone)
    const intl = digits.startsWith('966') ? digits : `966${digits.replace(/^0/, '')}`
    return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`
  }
  if (channel === 'sms') {
    const digits = normalizePhone(phone)
    const intl = `+966${digits.replace(/^0/, '')}`
    return `sms:${intl}?body=${encodeURIComponent(message)}`
  }
  if (channel === 'email') {
    const subject = encodeURIComponent('Join my credit circle on Yumna يُمنى')
    return `mailto:${email}?subject=${subject}&body=${encodeURIComponent(message)}`
  }
  return '#'
}

export default function AddBuyerSheet({ seller, onClose }) {
  const { addToast } = useApp()
  const [channel, setChannel] = useState('whatsapp')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [contactName, setContactName] = useState('')
  const [copied, setCopied] = useState(false)

  const isEmail = channel === 'email'
  const digits = normalizePhone(phone)
  const canSend = isEmail ? email.includes('@') : digits.length >= 9

  const sellerName = seller?.name || 'Khalid Al-Zahrani'
  const sellerBusiness = seller?.business || 'Zahrani Trading Co.'
  const message = buildInviteMessage(sellerName, sellerBusiness, contactName)
  const activeChannel = CHANNELS.find(c => c.id === channel)

  const handleSend = () => {
    const url = buildSendUrl(channel, phone, email, message)
    window.open(url, '_blank', 'noopener,noreferrer')
    addToast(`Invite sent via ${activeChannel?.label}`)
    onClose()
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(INVITE_LINK)
    } catch {
      const el = document.createElement('textarea')
      el.value = INVITE_LINK
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    addToast('Invite link copied')
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col justify-end"
      style={{ background: 'rgba(11,15,25,0.5)' }}
      onClick={onClose}
    >
      <div
        className="sheet-enter bg-white rounded-t-3xl flex flex-col w-full"
        style={{ maxHeight: '90dvh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Sticky handle + header */}
        <div className="shrink-0 px-5 pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-line mx-auto mb-4" />
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="font-semibold text-ink text-[16px]">Add Buyer</h3>
              <p className="text-muted text-[12px]">Invite to your credit circle</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-card border border-black/5 flex items-center justify-center text-muted hover:text-ink transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-8">
          <div className="flex flex-col gap-4">

            {/* Channel picker */}
            <div>
              <label className="eyebrow mb-2 block">Send invite via</label>
              <div className="flex gap-2">
                {CHANNELS.map(ch => {
                  const active = channel === ch.id
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setChannel(ch.id)}
                      className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all"
                      style={{
                        borderColor: active ? ch.color : 'var(--color-line)',
                        background: active ? `${ch.color}12` : '#fff',
                        color: active ? ch.color : 'var(--color-muted)',
                      }}
                    >
                      {ch.icon}
                      <span className="text-[11px] font-semibold">{ch.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Optional name */}
            <div>
              <label className="eyebrow mb-1.5 block">Contact Name (optional)</label>
              <input
                type="text"
                placeholder="e.g. Ahmed Al-Rashidi"
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border bg-card text-[14px] outline-none focus:border-primary transition-colors"
                style={{ borderColor: 'var(--color-line)' }}
              />
            </div>

            {/* Phone or Email */}
            {!isEmail ? (
              <div>
                <label className="eyebrow mb-1.5 block">Mobile Number</label>
                <div className="flex gap-2">
                  <div
                    className="flex items-center px-3 rounded-xl border bg-card text-[14px] font-semibold text-ink-soft shrink-0"
                    style={{ borderColor: 'var(--color-line)' }}
                    dir="ltr"
                  >
                    🇸🇦 +966
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    dir="ltr"
                    placeholder="5X XXX XXXX"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && canSend && handleSend()}
                    className="flex-1 min-w-0 px-4 py-3 rounded-xl border bg-card text-[14px] outline-none focus:border-primary transition-colors tabular"
                    style={{ borderColor: 'var(--color-line)' }}
                  />
                </div>
                <p className="text-[11px] text-muted mt-1.5">
                  Invite them to join your credit circle on Yumna.
                </p>
              </div>
            ) : (
              <div>
                <label className="eyebrow mb-1.5 block">Email Address</label>
                <input
                  type="email"
                  dir="ltr"
                  placeholder="buyer@company.sa"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && canSend && handleSend()}
                  className="w-full px-4 py-3 rounded-xl border bg-card text-[14px] outline-none focus:border-primary transition-colors"
                  style={{ borderColor: 'var(--color-line)' }}
                />
                <p className="text-[11px] text-muted mt-1.5">
                  Invite them to join your credit circle on Yumna.
                </p>
              </div>
            )}

            {/* Send Invite CTA */}
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="w-full py-3.5 rounded-full text-white font-semibold text-[15px] flex items-center justify-center gap-2 transition-opacity disabled:opacity-40"
              style={{ background: activeChannel?.color }}
            >
              <span style={{ color: 'white' }}>{activeChannel?.icon}</span>
              Send Invite
            </button>

            {/* Copy invite link */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-line" />
                <span className="text-[11px] text-muted shrink-0">or share the invite link</span>
                <div className="flex-1 h-px bg-line" />
              </div>
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 font-semibold text-[13px] transition-all"
                style={{
                  borderColor: copied ? '#10b981' : 'var(--color-line)',
                  color: copied ? '#10b981' : 'var(--color-ink-soft)',
                  background: copied ? '#ecfdf5' : '#fff',
                }}
              >
                {copied ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    Link copied!
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2"/>
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                    Copy invite link
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
