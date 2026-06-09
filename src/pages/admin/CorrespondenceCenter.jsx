import { useState, useRef, useEffect } from 'react'
import { CORRESPONDENCE_THREADS } from '../../data/mockData'
import Avatar from '../../components/Avatar'

// ── Channel meta ─────────────────────────────────────────────────────────────
const CHANNELS = {
  whatsapp: {
    label: 'WhatsApp',
    bg: '#dcfce7', color: '#15803d',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12.04 2.002C6.472 2.002 2 6.474 2 12.042c0 1.855.485 3.59 1.333 5.09L2.05 22l5.011-1.315A10.023 10.023 0 0012.04 22c5.568 0 10.04-4.472 10.04-10.04 0-5.567-4.472-10.038-10.04-9.958z"/>
      </svg>
    ),
  },
  sms: {
    label: 'SMS',
    bg: '#dbeafe', color: '#1d4ed8',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  email: {
    label: 'Email',
    bg: '#fef3c7', color: '#92400e',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
  },
  call: {
    label: 'Call',
    bg: '#f1f5f9', color: '#475569',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    ),
  },
  note: {
    label: 'Note',
    bg: '#f5f3ff', color: '#7c3aed',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
  },
}

const STATUS_ICONS = {
  sent:      '✓',
  delivered: '✓✓',
  read:      '👁',
  replied:   '↩',
  failed:    '✕',
}
const STATUS_COLORS = {
  sent: '#94a3b8', delivered: '#94a3b8', read: '#9084fd', replied: '#15803d', failed: '#ef4444',
}

const CALL_OUTCOME_COLORS = {
  'Connected':   { bg: '#dcfce7', color: '#15803d' },
  'No answer':   { bg: '#fee2e2', color: '#b91c1c' },
  'Voicemail':   { bg: '#fef3c7', color: '#92400e' },
}

function callOutcomeStyle(outcome = '') {
  const key = Object.keys(CALL_OUTCOME_COLORS).find(k => outcome.startsWith(k)) || 'Connected'
  return CALL_OUTCOME_COLORS[key] || { bg: '#f1f5f9', color: '#475569' }
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function ChannelPill({ channel, small = false }) {
  const meta = CHANNELS[channel] || CHANNELS.note
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: small ? '2px 7px' : '3px 9px',
      borderRadius: 20, fontSize: small ? 10 : 11, fontWeight: 600,
      background: meta.bg, color: meta.color,
    }}>
      <span style={{ color: meta.color, display: 'flex' }}>{meta.icon}</span>
      {meta.label}
    </span>
  )
}

function PipelinePill({ pipeline, stage }) {
  return (
    <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.04em' }}>
      {pipeline} · {stage}
    </span>
  )
}

// Group messages by date string (first 10 chars of time "YYYY-MM-DD")
function groupByDate(messages) {
  const groups = []
  let current = null
  for (const m of messages) {
    const date = (m.time || '').substring(0, 10)
    if (date !== current) {
      groups.push({ date, items: [] })
      current = date
    }
    groups[groups.length - 1].items.push(m)
  }
  return groups
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-SA', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

// ── Timeline message renderers ────────────────────────────────────────────────
function SystemEvent({ msg }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 11, color: '#64748b', margin: '4px 0' }}>
      <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </span>
      <span style={{ flex: 1 }}>{msg.content}</span>
      {msg.trigger && (
        <>
          <span style={{ width: 1, height: 16, background: '#e2e8f0', flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: '#9084fd', flexShrink: 0 }}>{msg.trigger}</span>
        </>
      )}
      <span style={{ fontSize: 10, color: '#cbd5e1', flexShrink: 0 }}>{(msg.time || '').slice(13)}</span>
    </div>
  )
}

function ChatBubble({ msg }) {
  const isOut = msg.direction === 'outbound'
  const ch = CHANNELS[msg.channel] || CHANNELS.note
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isOut ? 'flex-end' : 'flex-start', margin: '6px 0' }}>
      {!isOut && (
        <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 3, marginLeft: 2 }}>{msg.from}</span>
      )}
      <div style={{
        maxWidth: '72%', padding: '10px 14px', borderRadius: isOut ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isOut ? 'rgba(144,132,253,0.10)' : '#ffffff',
        border: isOut ? '1px solid rgba(144,132,253,0.25)' : '1px solid #e2e8f0',
        fontSize: 13, color: '#262626', lineHeight: 1.5,
      }}>
        {msg.subject && (
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9084fd', marginBottom: 4 }}>{msg.subject}</div>
        )}
        {msg.content}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, fontSize: 10, color: '#94a3b8' }}>
        <ChannelPill channel={msg.channel} small />
        <span>{(msg.time || '').slice(13)}</span>
        {isOut && msg.status && (
          <span style={{ color: STATUS_COLORS[msg.status] || '#94a3b8', fontWeight: 600 }}>
            {STATUS_ICONS[msg.status]} {msg.status}
          </span>
        )}
      </div>
    </div>
  )
}

function EmailCard({ msg }) {
  const [open, setOpen] = useState(false)
  const isOut = msg.direction === 'outbound'
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', background: '#fff', margin: '6px 0' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#92400e' }}>
          {CHANNELS.email.icon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#262626', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.subject || '(No subject)'}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
            {isOut ? `Sent by ${msg.from}` : `From ${msg.from}`} · {(msg.time || '').slice(13)}
            {isOut && msg.status && <span style={{ marginLeft: 6, color: STATUS_COLORS[msg.status] || '#94a3b8' }}>{STATUS_ICONS[msg.status]} {msg.status}</span>}
          </div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div style={{ padding: '0 14px 14px', fontSize: 13, color: '#475569', lineHeight: 1.6, borderTop: '1px solid #f1f5f9' }}>
          <div style={{ paddingTop: 10 }}>{msg.content}</div>
        </div>
      )}
    </div>
  )
}

function CallEntry({ msg }) {
  const os = callOutcomeStyle(msg.outcome)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '8px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', width: '80%' }}>
        <span style={{ width: 30, height: 30, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#475569' }}>
          {CHANNELS.call.icon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#262626' }}>{msg.from} · {msg.duration || '—'}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.content}</div>
        </div>
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: os.bg, color: os.color }}>{msg.outcome}</span>
          <span style={{ fontSize: 10, color: '#94a3b8' }}>{(msg.time || '').slice(13)}</span>
        </div>
      </div>
    </div>
  )
}

function TimelineMessage({ msg }) {
  if (msg.direction === 'system') return <SystemEvent msg={msg} />
  if (msg.channel === 'call')    return <CallEntry msg={msg} />
  if (msg.channel === 'email')   return <EmailCard msg={msg} />
  return <ChatBubble msg={msg} />
}

// ── Composer ──────────────────────────────────────────────────────────────────
function Composer({ thread, onAddMessage }) {
  const [mode, setMode]       = useState(null)  // 'message' | 'call'
  const [channel, setChannel] = useState('whatsapp')
  const [text, setText]       = useState('')
  const [callDate, setCallDate]    = useState('')
  const [callDuration, setCallDuration] = useState('')
  const [callOutcome, setCallOutcome]   = useState('Connected')
  const [callNotes, setCallNotes]       = useState('')

  const handleSend = () => {
    if (!text.trim()) return
    const now = new Date()
    const time = `${now.toISOString().slice(0,10)} · ${now.toTimeString().slice(0,5)}`
    onAddMessage({
      id: `msg-${Date.now()}`,
      direction: 'outbound',
      channel,
      from: 'Layla Al-Harbi',
      content: text.trim(),
      time,
      status: 'sent',
      ticketId: thread.ticketId,
    })
    setText('')
    setMode(null)
  }

  const handleLogCall = () => {
    const now = new Date()
    const time = callDate || `${now.toISOString().slice(0,10)} · ${now.toTimeString().slice(0,5)}`
    onAddMessage({
      id: `call-${Date.now()}`,
      direction: 'call',
      channel: 'call',
      from: 'Layla Al-Harbi',
      content: callNotes.trim() || '(No notes)',
      time,
      duration: callDuration || '—',
      outcome: callOutcome,
    })
    setCallNotes(''); setCallDuration(''); setCallDate(''); setMode(null)
  }

  return (
    <div style={{ borderTop: '1px solid #f1f5f9', background: '#fff', flexShrink: 0 }}>
      {/* Action buttons */}
      <div style={{ padding: '10px 16px', display: 'flex', gap: 8 }}>
        {[{ id: 'message', label: 'Send message' }, { id: 'call', label: 'Log call' }].map(({ id, label }) => (
          <button key={id} onClick={() => setMode(m => m === id ? null : id)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              background: mode === id ? 'var(--color-primary)' : 'white',
              border: mode === id ? '1px solid var(--color-primary)' : '1px solid #e2e8f0',
              color: mode === id ? '#fff' : '#64748b',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Send message form */}
      {mode === 'message' && (
        <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Channel selector */}
          <div style={{ display: 'flex', gap: 6 }}>
            {['whatsapp', 'sms', 'email'].map(ch => (
              <button key={ch} onClick={() => setChannel(ch)}
                style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  background: channel === ch ? CHANNELS[ch].bg : '#f8fafc',
                  border: `1px solid ${channel === ch ? 'transparent' : '#e2e8f0'}`,
                  color: channel === ch ? CHANNELS[ch].color : '#64748b',
                }}>
                {CHANNELS[ch].label}
              </button>
            ))}
          </div>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={3} autoFocus
            placeholder={`Write a ${CHANNELS[channel]?.label} message…`}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.5 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSend}
              style={{ padding: '7px 18px', borderRadius: 20, background: 'var(--color-primary)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Send
            </button>
            <button onClick={() => { setMode(null); setText('') }}
              style={{ padding: '7px 14px', borderRadius: 20, background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Log call form */}
      {mode === 'call' && (
        <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Date & Time</label>
              <input type="text" placeholder="2026-06-09 · 10:00" value={callDate} onChange={e => setCallDate(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Duration</label>
              <input type="text" placeholder="e.g. 5m 30s" value={callDuration} onChange={e => setCallDuration(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Outcome</label>
            <select value={callOutcome} onChange={e => setCallOutcome(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12, fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
              <option>Connected — payment confirmed</option>
              <option>Connected — dispute raised</option>
              <option>Connected — documents requested</option>
              <option>Connected — repayment schedule explained</option>
              <option>Connected</option>
              <option>No answer</option>
              <option>Voicemail</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Notes</label>
            <textarea value={callNotes} onChange={e => setCallNotes(e.target.value)} rows={3} autoFocus
              placeholder="Call notes…"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12, fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.5 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Contact</label>
              <input type="text" value={thread.contactName} readOnly
                style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12, fontFamily: 'inherit', background: '#f8fafc', color: '#64748b', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Related Ticket</label>
              <input type="text" value={thread.ticketId} readOnly
                style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12, fontFamily: 'inherit', background: '#f8fafc', color: '#64748b', outline: 'none' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleLogCall}
              style={{ padding: '7px 18px', borderRadius: 20, background: 'var(--color-primary)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Save call log
            </button>
            <button onClick={() => setMode(null)}
              style={{ padding: '7px 14px', borderRadius: 20, background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Detail panel ──────────────────────────────────────────────────────────────
function ConversationDetail({ thread, onClose, onUpdate }) {
  const [channelFilter, setChannelFilter] = useState('all')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread.id, thread.messages.length])

  const channelTabs = ['all', 'whatsapp', 'sms', 'email', 'call']

  const filteredMessages = channelFilter === 'all'
    ? thread.messages
    : thread.messages.filter(m => m.channel === channelFilter)

  const groups = groupByDate(filteredMessages)

  const handleAddMessage = (msg) => {
    onUpdate({ ...thread, messages: [...thread.messages, msg] })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white rounded-2xl border border-black/5">
      {/* Header */}
      <div style={{ padding: '14px 20px 0', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <Avatar initials={thread.contactInitials} bg={thread.contactAvatar} size="md" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a22' }}>{thread.contactName}</span>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600,
                background: thread.contactType === 'buyer' ? '#dbeafe' : '#dcfce7',
                color: thread.contactType === 'buyer' ? '#1d4ed8' : '#15803d' }}>
                {thread.contactType === 'buyer' ? 'Buyer' : 'Seller'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{thread.contactBusiness}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
              <PipelinePill pipeline={thread.pipeline} stage={thread.stageLabel} />
              <span style={{ color: '#e2e8f0' }}>·</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#9084fd', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                {thread.ticketId}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <a href={`tel:${thread.phone}`}
              style={{ width: 32, height: 32, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', textDecoration: 'none' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </a>
            <button onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: 10, background: '#f1f5f9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Channel tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {channelTabs.map(ch => (
            <button key={ch} onClick={() => setChannelFilter(ch)}
              style={{
                padding: '6px 14px 8px', fontSize: 12, fontWeight: ch === channelFilter ? 700 : 500,
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: `2px solid ${ch === channelFilter ? 'var(--color-primary)' : 'transparent'}`,
                color: ch === channelFilter ? 'var(--color-primary)' : '#94a3b8',
                transition: 'all 0.15s',
                textTransform: ch === 'all' ? 'none' : undefined,
              }}>
              {ch === 'all' ? 'All' : CHANNELS[ch]?.label || ch}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '16px 20px' }}>
        {groups.length === 0 && (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, paddingTop: 40 }}>No messages for this filter.</div>
        )}
        {groups.map(({ date, items }) => (
          <div key={date}>
            {/* Date divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 10px' }}>
              <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', padding: '3px 10px', borderRadius: 20, background: '#f8fafc', border: '1px solid #f1f5f9' }}>{formatDate(date)}</span>
              <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
            </div>
            {items.map(msg => <TimelineMessage key={msg.id} msg={msg} />)}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <Composer thread={thread} onAddMessage={handleAddMessage} />
    </div>
  )
}

// ── Main module ───────────────────────────────────────────────────────────────
const FILTER_OPTIONS = [
  { id: 'all',       label: 'All' },
  { id: 'buyer',     label: 'Buyers' },
  { id: 'seller',    label: 'Sellers' },
  { id: 'whatsapp',  label: 'WhatsApp' },
  { id: 'sms',       label: 'SMS' },
  { id: 'email',     label: 'Email' },
  { id: 'call',      label: 'Calls' },
  { id: 'unread',    label: 'Unread' },
]

export default function CorrespondenceCenter({ onBreadcrumb }) {
  const [threads, setThreads]   = useState(CORRESPONDENCE_THREADS)
  const [selected, setSelected] = useState(null)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('all')

  useEffect(() => {
    onBreadcrumb?.(selected
      ? { label: selected.contactName, id: selected.ticketId, onHome: () => setSelected(null) }
      : null)
    return () => onBreadcrumb?.(null)
  }, [selected])

  const filtered = threads.filter(t => {
    if (filter === 'buyer')   return t.contactType === 'buyer'
    if (filter === 'seller')  return t.contactType === 'seller'
    if (filter === 'unread')  return t.unread > 0
    if (['whatsapp','sms','email','call'].includes(filter)) return t.lastChannel === filter
    return true
  }).filter(t => {
    if (!search) return true
    const q = search.toLowerCase()
    return [t.contactName, t.contactBusiness, t.phone, t.email, t.lastMessage]
      .some(v => v?.toLowerCase().includes(q))
  })

  const handleUpdate = (updated) => {
    setThreads(prev => prev.map(t => t.id === updated.id ? updated : t))
    setSelected(updated)
  }

  const unreadCount = threads.reduce((n, t) => n + (t.unread || 0), 0)

  return (
    <div className="flex gap-5 h-full overflow-hidden">
      {/* ── Left: conversation list ─────────────────────────────────────── */}
      <div
        className="flex flex-col overflow-hidden bg-white rounded-2xl border border-black/5"
        style={{ width: selected ? 340 : '100%', minWidth: selected ? 340 : undefined, flexShrink: 0, transition: 'width 0.3s var(--ease-entrance)' }}>

        {/* Header */}
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a22' }}>Correspondence</span>
            {unreadCount > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'var(--color-primary)', color: '#fff' }}>{unreadCount}</span>
            )}
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="2" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Search by name, phone, email…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 12, border: '1px solid var(--color-line)', fontSize: 12, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none' }}>
          {FILTER_OPTIONS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                background: filter === f.id ? 'var(--color-primary)' : '#f8fafc',
                border: filter === f.id ? '1px solid var(--color-primary)' : '1px solid #e2e8f0',
                color: filter === f.id ? '#fff' : '#64748b',
                flexShrink: 0,
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, paddingTop: 40 }}>No conversations found.</div>
          )}
          {filtered.map(t => {
            const isActive = selected?.id === t.id
            return (
              <button key={t.id} onClick={() => setSelected(t)}
                className="w-full text-left transition-colors"
                style={{
                  display: 'block', padding: '12px 16px',
                  borderBottom: '1px solid #f8fafc',
                  borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                  background: isActive ? 'rgba(144,132,253,0.04)' : 'white',
                  cursor: 'pointer',
                }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Avatar initials={t.contactInitials} bg={t.contactAvatar} size="sm" />
                    {t.unread > 0 && (
                      <span style={{ position: 'absolute', top: -2, right: -2, minWidth: 15, height: 15, borderRadius: 20, background: 'var(--color-primary)', border: '1.5px solid white', color: '#fff', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 2px' }}>
                        {t.unread}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: t.unread > 0 ? 700 : 600, color: '#1a1a22', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.contactName}</span>
                      <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>{(t.lastTime || '').slice(0, 10)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                      <ChannelPill channel={t.lastChannel} small />
                      <span style={{ fontSize: 10, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{t.contactBusiness}</span>
                    </div>
                    <div style={{ fontSize: 11, color: t.unread > 0 ? '#262626' : '#94a3b8', fontWeight: t.unread > 0 ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                      {t.lastMessage}
                    </div>
                    <PipelinePill pipeline={t.pipeline} stage={t.stageLabel} />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Right: detail ────────────────────────────────────────────────── */}
      {selected && (
        <div className="flex-1 min-w-0 overflow-hidden" style={{ animation: 'fadeSlideUp 0.3s var(--ease-entrance) both' }}>
          <ConversationDetail
            thread={selected}
            onClose={() => setSelected(null)}
            onUpdate={handleUpdate}
          />
        </div>
      )}
    </div>
  )
}
