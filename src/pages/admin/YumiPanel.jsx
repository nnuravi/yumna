import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { YUMI_PERSONAS, TASKS, PIPELINE_CARDS } from '../../data/mockData'

const SECTION_CONTEXT = {
  overview:   { title: 'Business Pulse', subtitle: 'What Yumi sees across the portfolio today' },
  pipeline:   { title: 'Pipeline Assistant', subtitle: 'Cards assigned to you and suggested actions' },
  sellers:    { title: 'Seller Health', subtitle: 'Yumi\'s read on selected seller' },
  buyers:     { title: 'Buyer Health', subtitle: 'Yumi\'s read on selected buyer' },
  tasks:      { title: 'Task Advisor', subtitle: 'Your workload and SLA watch' },
  templates:  { title: 'Legal Match', subtitle: 'Templates matched to pending applications' },
}

const CANNED_RESPONSES = {
  'What needs my attention today?': (role, name) => `Hi ${name}! Based on current activity: ${role === 'risk' ? '1 card has missing bank statements (FR-0041). I\'ve drafted a request — just review and send.' : role === 'collections' ? 'FR-0043 is 20 days overdue. A formal notice is ready for your review.' : role === 'verifier' ? 'FR-0047 needs KYC documents. FR-0044 has a pending Nafath check.' : role === 'account_mgr' ? 'FR-0042 is approved — invoice needs to be generated today.' : role === 'credit' ? 'FR-0045 is waiting for SIMAH pull. Documents are all verified.' : 'Great question — here\'s your dashboard summary.'}`,
  'Show me overdue items': () => 'FR-0043 (Mohammed Al-Rashid · SAR 240,000) is 20 days overdue. FR-0037 (Al-Noor Trading) is also flagged in collections.',
  'Any compliance issues?': () => 'No SAMA compliance flags today. One template is due for annual review (HealthCare Framework v1.0). Two buyer accounts have incomplete KYC documentation.',
  'Summarise pipeline health': () => '9 active stages. 3 cards require immediate action: FR-0041 (missing docs), FR-0043 (overdue payment), FR-0047 (new — incomplete KYC). 2 cards are on track. Disbursement for FR-0042 is pending invoice generation.',
}

export default function YumiPanel({ activeSection }) {
  const { state } = useApp()
  const adminRole = state.currentUser?.adminRole
  const userName = state.currentUser?.name
  const persona = YUMI_PERSONAS[adminRole] || YUMI_PERSONAS.super

  const [query, setQuery] = useState('')
  const [conversation, setConversation] = useState([])

  const ctx = SECTION_CONTEXT[activeSection] || SECTION_CONTEXT.overview

  const myTasks = TASKS.filter(t => t.assignedTo === userName)
  const urgentTasks = myTasks.filter(t => t.priority === 'critical' || t.priority === 'high')
  const myCards = PIPELINE_CARDS.filter(c => c.assignedTo === userName)
  const myCardsWithAction = myCards.filter(c => c.yumiSuggestion.action !== 'monitor')

  const handleSend = () => {
    if (!query.trim()) return
    const q = query.trim()
    const matchedFn = CANNED_RESPONSES[q]
    const response = matchedFn
      ? matchedFn(adminRole, userName?.split(' ')[0])
      : `I'm looking into "${q}" — based on current data, I don't have a specific answer, but I can check the pipeline or task list for relevant items.`

    setConversation(prev => [
      ...prev,
      { from: 'user', text: q },
      { from: 'yumi', text: response },
    ])
    setQuery('')
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-100" style={{ width: 300 }}>
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-100 shrink-0" style={{ background: '#fafafa' }}>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[16px]">✦</span>
          <span className="font-bold text-[14px]" style={{ color: 'var(--color-primary)' }}>Yumi</span>
        </div>
        <div className="text-[11px] text-slate-400">{ctx.subtitle}</div>
      </div>

      {/* Greeting */}
      <div className="px-4 py-3 shrink-0">
        <div className="rounded-xl p-3 border" style={{ background: '#fafafa', borderColor: '#e5e5e5' }}>
          <p className="text-[12px] text-slate-700 leading-relaxed">{persona.greeting}</p>
        </div>
      </div>

      {/* Context items */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
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
                  <p className="text-[11px] text-slate-600 leading-snug">{card.yumiSuggestion.message.split('.')[0]}.</p>
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

        {/* Suggested prompts */}
        <div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Ask Yumi</div>
          <div className="space-y-1.5">
            {Object.keys(CANNED_RESPONSES).map(q => (
              <button key={q} onClick={() => setQuery(q)}
                className="w-full text-start text-[11px] text-slate-600 px-3 py-2 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors leading-snug">
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation */}
        {conversation.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Conversation</div>
            {conversation.map((msg, i) => (
              <div key={i} className={`rounded-xl p-3 text-[11px] leading-relaxed ${msg.from === 'user' ? 'bg-slate-100 text-slate-700 ml-4' : 'border text-slate-600'}`}
                style={msg.from === 'yumi' ? { background: '#fafafa', borderColor: '#e5e5e5' } : {}}>
                {msg.from === 'yumi' && <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>✦ Yumi · </span>}
                {msg.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-100 shrink-0">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask Yumi anything…"
            className="flex-1 px-3 py-2 rounded-xl border text-[12px] outline-none"
            style={{ borderColor: '#e5e5e5' }}
          />
          <button onClick={handleSend}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0"
            style={{ background: 'var(--color-primary)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
