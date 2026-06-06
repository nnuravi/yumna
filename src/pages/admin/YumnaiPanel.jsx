import { useState, useRef, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { YUMNAI_PERSONAS, TASKS, PIPELINE_CARDS } from '../../data/mockData'

const SECTION_CONTEXT = {
  overview:   { title: 'Business Pulse', subtitle: 'What Yumnai sees across the portfolio today' },
  pipeline:   { title: 'Pipeline Assistant', subtitle: 'Cards assigned to you and suggested actions' },
  sellers:    { title: 'Seller Health', subtitle: 'Yumnai\'s read on selected seller' },
  buyers:     { title: 'Buyer Health', subtitle: 'Yumnai\'s read on selected buyer' },
  tasks:      { title: 'Task Advisor', subtitle: 'Your workload and SLA watch' },
  templates:  { title: 'Legal Match', subtitle: 'Templates matched to pending applications' },
}

const CANNED_RESPONSES = {
  'What needs my attention today?': (role, name) => `Hi ${name}! Based on current activity: ${role === 'risk' ? '1 card has missing bank statements (FR-0041). I\'ve drafted a request — just review and send.' : role === 'collections' ? 'FR-0043 is 20 days overdue. A formal notice is ready for your review.' : role === 'verifier' ? 'FR-0047 needs KYC documents. FR-0044 has a pending Nafath check.' : role === 'account_mgr' ? 'FR-0042 is approved — invoice needs to be generated today.' : role === 'credit' ? 'FR-0045 is waiting for SIMAH pull. Documents are all verified.' : 'Great question — here\'s your dashboard summary.'}`,
  'Show me overdue items': () => 'FR-0043 (Mohammed Al-Rashid · SAR 240,000) is 20 days overdue. FR-0037 (Al-Noor Trading) is also flagged in collections.',
  'Any compliance issues?': () => 'No SAMA compliance flags today. One template is due for annual review (HealthCare Framework v1.0). Two buyer accounts have incomplete KYC documentation.',
  'Summarise pipeline health': () => '9 active stages. 3 cards require immediate action: FR-0041 (missing docs), FR-0043 (overdue payment), FR-0047 (new — incomplete KYC). 2 cards are on track. Disbursement for FR-0042 is pending invoice generation.',
}

const HINTS = [
  'What needs attention today?',
  'Ask me anything about the Yumna dashboard',
  'Show me overdue items',
  'Summarise pipeline health',
]

// Pastel capsule tints (purple / blue / green / pink) cycled across the Ask Yumnai prompts
const PILL_PALETTE = [
  { bg: '#efedff', color: '#5b4ddb' },
  { bg: '#e6f1ff', color: '#2f6fed' },
  { bg: '#e8f9ee', color: '#1f9d57' },
  { bg: '#ffe9f1', color: '#d6336c' },
]

// Seeded example sessions for the chat-history menu (in-memory, prototype)
const SEED_HISTORY = [
  { id: 'seed-1', title: 'Overdue items review', messages: [
    { from: 'user', text: 'Show me overdue items' },
    { from: 'yumnai', text: CANNED_RESPONSES['Show me overdue items']() },
  ] },
  { id: 'seed-2', title: 'Pipeline health check', messages: [
    { from: 'user', text: 'Summarise pipeline health' },
    { from: 'yumnai', text: CANNED_RESPONSES['Summarise pipeline health']() },
  ] },
]

export default function YumnaiPanel({ activeSection, width = 400, onWidth, onClose, hidden = false }) {
  const { state } = useApp()
  const adminRole = state.currentUser?.adminRole
  const userName = state.currentUser?.name
  const persona = YUMNAI_PERSONAS[adminRole] || YUMNAI_PERSONAS.super

  const [query, setQuery] = useState('')
  const [conversation, setConversation] = useState([])
  const [hintIdx, setHintIdx] = useState(0)
  const [history, setHistory] = useState(SEED_HISTORY)
  const [historyOpen, setHistoryOpen] = useState(false)
  const panelRef = useRef(null)

  const engaged = conversation.length > 0 || historyOpen

  const newChat = () => {
    if (conversation.length > 0) {
      const title = conversation.find(m => m.from === 'user')?.text || 'Conversation'
      setHistory(prev => [{ id: `s-${Date.now()}`, title, messages: conversation }, ...prev])
    }
    setConversation([])
    setQuery('')
    setHistoryOpen(false)
  }

  const loadSession = (session) => {
    setConversation(session.messages)
    setHistoryOpen(false)
  }

  useEffect(() => {
    const t = setInterval(() => setHintIdx(i => (i + 1) % HINTS.length), 3400)
    return () => clearInterval(t)
  }, [])

  const startResize = (e) => {
    e.preventDefault()
    const onMove = (ev) => {
      const right = panelRef.current?.getBoundingClientRect().right ?? window.innerWidth
      const w = right - ev.clientX
      onWidth?.(Math.min(640, Math.max(320, w)))
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const ctx = SECTION_CONTEXT[activeSection] || SECTION_CONTEXT.overview

  const myTasks = TASKS.filter(t => t.assignedTo === userName)
  const urgentTasks = myTasks.filter(t => t.priority === 'critical' || t.priority === 'high')
  const myCards = PIPELINE_CARDS.filter(c => c.assignedTo === userName)
  const myCardsWithAction = myCards.filter(c => c.yumnaiSuggestion.action !== 'monitor')

  const handleSend = (preset) => {
    const q = (preset ?? query).trim()
    if (!q) return
    const matchedFn = CANNED_RESPONSES[q]
    const response = matchedFn
      ? matchedFn(adminRole, userName?.split(' ')[0])
      : `I'm looking into "${q}" — based on current data, I don't have a specific answer, but I can check the pipeline or task list for relevant items.`

    setConversation(prev => [
      ...prev,
      { from: 'user', text: q },
      { from: 'yumnai', text: response },
    ])
    setQuery('')
  }

  return (
    <div ref={panelRef}
      className={`relative ${hidden ? 'hidden' : 'flex'} flex-col shrink-0 bg-white rounded-3xl overflow-hidden mb-3 me-3`}
      style={{ width, boxShadow: 'var(--shadow-rail)' }}>
      {/* Static gradient stroke (masked to a ring) */}
      <span className="yumnai-stroke" aria-hidden="true" />
      {/* Resize handle — drag the left edge */}
      <div onMouseDown={startResize} title="Drag to resize"
        className="absolute left-0 top-0 h-full w-1.5 cursor-col-resize z-20 hover:bg-[var(--color-primary)]/25 transition-colors" />

      {/* Header — blank in cold state, visible once engaged */}
      <div className={`shrink-0 flex items-start justify-between gap-2 px-4 ${engaged ? 'py-4 border-b border-slate-100' : 'py-3'}`}
        style={engaged ? { background: '#fafafa' } : undefined}>
        <div className="min-w-0">
          {historyOpen ? (
            <span className="font-bold text-[14px]" style={{ color: 'var(--color-primary)' }}>Chat history</span>
          ) : conversation.length > 0 ? (
            <>
              <div className="flex items-center gap-2 mb-0.5">
                <img src="/yumnai.svg" alt="" className="h-4 w-auto" />
                <span className="font-bold text-[14px]" style={{ color: 'var(--color-primary)' }}>Yumnai</span>
              </div>
              <div className="text-[11px] text-slate-400 truncate">{ctx.subtitle}</div>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setHistoryOpen(o => !o)} title="Chat history"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-black/5 transition-colors"
            style={{ background: historyOpen ? 'rgba(0,0,0,0.06)' : undefined }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <button onClick={() => onClose?.(conversation.length > 0)} title="Close"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-black/5 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {historyOpen ? (
          /* Chat history */
          <div className="space-y-2">
            <button onClick={newChat}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-[filter]"
              style={{ background: 'var(--color-primary-soft)', color: 'var(--color-accent-foreground)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New chat
            </button>
            {history.length === 0 ? (
              <div className="text-[11px] text-slate-400 text-center py-8">No past chats yet</div>
            ) : history.map(s => (
              <button key={s.id} onClick={() => loadSession(s)}
                className="w-full text-start px-3 py-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors">
                <div className="text-[12px] font-semibold text-slate-700 truncate">{s.title}</div>
                <div className="text-[10px] text-slate-400">{s.messages.length} messages</div>
              </button>
            ))}
          </div>
        ) : conversation.length === 0 ? (
          <div className="min-h-full flex flex-col justify-center gap-4">
            {/* Welcome — cold state */}
            <div className="flex flex-col items-center text-center">
              <img src="/yumnai.svg" alt="Yumnai" className="h-10 w-auto mb-4" />
              <img src="/yumnaitext.svg" alt="Yumnai" className="h-5 w-auto mb-2" />
              <p className="text-[12px] text-slate-500 leading-relaxed max-w-[260px]">{persona.greeting}</p>
            </div>

            {/* My cards with actions */}
            {myCardsWithAction.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Needs Your Action</div>
                <div className="space-y-2">
                  {myCardsWithAction.slice(0, 3).map(card => (
                    <div key={card.id} className="rounded-xl border p-3" style={{ background: '#fafafa', borderColor: '#e5e5e5' }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-mono text-slate-400">{card.id}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--color-primary)' }}>✦</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">{card.yumnaiSuggestion.message.split('.')[0]}.</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Urgent tasks */}
            {urgentTasks.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Urgent Tasks</div>
                <div className="space-y-2">
                  {urgentTasks.slice(0, 4).map(task => (
                    <div key={task.id} className="flex items-start gap-2 rounded-xl border p-3" style={{ background: '#fafafa', borderColor: '#e5e5e5' }}>
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: task.priority === 'critical' ? '#737373' : '#a3a3a3' }} />
                      <div>
                        <div className="text-[12px] font-medium text-slate-700 leading-snug">{task.title}</div>
                        <div className="text-[10px] text-slate-400">Due {task.dueDate}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Conversation — active state */
          <div className="space-y-2">
            {conversation.map((msg, i) => (
              <div key={i} className={`rounded-xl p-3 text-[13px] leading-relaxed ${msg.from === 'user' ? 'ml-4' : 'border text-slate-600'}`}
                style={msg.from === 'yumnai' ? { background: '#fafafa', borderColor: '#e5e5e5' } : { background: 'var(--color-primary-soft)', color: '#000000' }}>
                {msg.from === 'yumnai' && <span className="font-semibold inline-flex items-center gap-1 align-middle" style={{ color: 'var(--color-primary)' }}><img src="/yumnai.svg" alt="" className="h-3.5 w-auto" /> Yumnai · </span>}
                {msg.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-100 shrink-0 space-y-2.5">
        {/* Suggestion pills — Ask Yumnai prompts in pastel capsules */}
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(CANNED_RESPONSES).map((q, i) => {
            const tint = PILL_PALETTE[i % PILL_PALETTE.length]
            return (
              <button key={q} onClick={() => handleSend(q)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full transition-transform hover:scale-[1.04] active:scale-95"
                style={{ background: tint.bg, color: tint.color }}>
                {q}
              </button>
            )
          })}
        </div>

        {/* Composer — gradient stroke + inline send */}
        <div className="yumnai-composer rounded-2xl p-[1.5px]"
          style={{ background: 'linear-gradient(135deg, #9084fd 0%, #6a7bff 50%, #3da4ff 100%)' }}>
          <div className="relative rounded-[15px] bg-white px-3 pt-2.5 pb-2">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              className="w-full bg-transparent outline-none text-[13px] leading-5 text-slate-700 relative z-10"
            />
            {!query && (
              <span key={hintIdx} aria-hidden
                className="hint-fade pointer-events-none absolute left-3 top-2.5 text-[13px] leading-5 text-slate-400 truncate max-w-[calc(100%-24px)]">
                {HINTS[hintIdx]}
              </span>
            )}
            <div className="flex items-center justify-end mt-2">
              <button onClick={() => handleSend()} title="Send"
                className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 transition-transform hover:scale-105 active:scale-95"
                style={{ background: 'var(--color-secondary)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
