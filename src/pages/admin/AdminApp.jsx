import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import ToastStack from '../../components/Toast'
import Avatar from '../../components/Avatar'
import LanguageToggle from '../../components/LanguageToggle'
import BizOverview from './BizOverview'
import Pipeline from './Pipeline'
import RepaymentsPipeline from './RepaymentsPipeline'
import SellersSection from './SellersSection'
import BuyersSection from './BuyersSection'
import TaskManager from './TaskManager'
import Templates from './Templates'
import YumiPanel from './YumiPanel'
import { PIPELINE_CARDS, REPAYMENTS_CARDS, TASKS } from '../../data/mockData'

const ALL_NAV = [
  {
    id: 'overview',
    label: 'Overview',
    roles: null,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    id: 'pipeline',
    label: 'Pipeline',
    roles: null,
    badge: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="4" height="18" rx="1"/><rect x="10" y="3" width="4" height="12" rx="1"/><rect x="17" y="3" width="4" height="15" rx="1"/>
      </svg>
    ),
  },
  {
    id: 'repayments',
    label: 'Repayments',
    roles: ['super', 'collections', 'legal', 'account_mgr'],
    badge: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    ),
  },
  {
    id: 'sellers',
    label: 'Sellers',
    roles: ['super', 'account_mgr', 'credit', 'verifier'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    id: 'buyers',
    label: 'Buyers',
    roles: ['super', 'account_mgr', 'credit', 'risk', 'collections', 'verifier'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
        <path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    id: 'tasks',
    label: 'Task Manager',
    roles: null,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4"/>
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
  },
  {
    id: 'templates',
    label: 'Templates',
    roles: ['super', 'legal'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
]

export default function AdminApp() {
  const [activeSection, setActiveSection] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [yumiOpen, setYumiOpen] = useState(false)
  const { state } = useApp()
  const navigate = useNavigate()
  const user = state.currentUser

  if (!user) { navigate('/'); return null }

  const adminRole = user.adminRole
  const adminNotes = state.notes.admin.filter(n => !n.read).length

  const myStageIds = adminRole === 'super'
    ? PIPELINE_CARDS.map(c => c.id)
    : PIPELINE_CARDS.filter(c => c.assignedTo === user.name).map(c => c.id)
  const pipelineBadge = myStageIds.length

  const REPAYMENTS_ROLE_STAGES = {
    collections: ['rp_active', 'rp_overdue', 'rp_escalation_l1'],
    legal:       ['rp_escalation_l2', 'rp_escalation_l3'],
  }
  const repaymentsBadge = adminRole === 'super'
    ? REPAYMENTS_CARDS.filter(c => c.stage !== 'rp_closed').length
    : REPAYMENTS_CARDS.filter(c => {
        const myStages = REPAYMENTS_ROLE_STAGES[adminRole] || []
        return myStages.includes(c.stage)
      }).length

  const myTaskCount = TASKS.filter(t => t.assignedTo === user.name && t.status !== 'done').length

  const navItems = ALL_NAV.filter(item => !item.roles || item.roles.includes(adminRole))

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':    return <BizOverview />
      case 'pipeline':    return <Pipeline onNavigate={setActiveSection} />
      case 'repayments':  return <RepaymentsPipeline />
      case 'sellers':     return <SellersSection />
      case 'buyers':      return <BuyersSection />
      case 'tasks':       return <TaskManager />
      case 'templates':   return <Templates />
      default:            return <BizOverview />
    }
  }

  const sectionLabel = navItems.find(n => n.id === activeSection)?.label || 'Overview'
  const isPipelineFullHeight = activeSection === 'pipeline' || activeSection === 'repayments'

  return (
    <div className="flex h-dvh overflow-hidden" style={{ background: 'var(--color-page)' }}>
      {/* Sidebar */}
      <aside className="flex flex-col border-r border-black/5 bg-white transition-all duration-300 shrink-0"
        style={{ width: sidebarOpen ? '220px' : '60px' }}>
        {/* Logo */}
        <div className="px-4 py-5 border-b border-black/5 flex items-center gap-3">
          <img src="/logo.png" alt="Yumna" className="h-8 w-auto shrink-0 object-contain" />
          {sidebarOpen && (
            <div>
              <div className="display font-semibold text-ink text-[15px]">Yumna</div>
              <div className="text-[10px] text-muted">Internal Portal</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(item => {
            const active = activeSection === item.id
            const badge = item.id === 'pipeline' ? pipelineBadge : item.id === 'repayments' ? repaymentsBadge : item.id === 'tasks' ? myTaskCount : 0
            return (
              <button key={item.id} onClick={() => setActiveSection(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 mb-0.5 rounded-xl transition-all text-start mx-1"
                style={{ width: 'calc(100% - 8px)', background: active ? 'rgba(0,0,0,0.06)' : 'transparent', color: active ? 'var(--color-primary)' : 'var(--color-muted)' }}>
                <div className="relative shrink-0">
                  {item.icon}
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border border-white text-[8px] text-white font-bold flex items-center justify-center" style={{ background: '#404040' }}>
                      {badge}
                    </span>
                  )}
                </div>
                {sidebarOpen && (
                  <span className={`text-[13px] truncate ${active ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* User + collapse */}
        <div className="border-t border-black/5 p-3">
          <div className="flex items-center gap-2.5">
            <Avatar initials={user.initials} bg={user.avatar} size="sm" />
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-ink truncate">{user.name}</div>
                <div className="text-[10px] text-muted truncate">{user.title}</div>
              </div>
            )}
            <button onClick={() => setSidebarOpen(o => !o)}
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-card border border-black/5 shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                style={{ transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s' }}>
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="shrink-0 h-14 px-6 flex items-center justify-between bg-white border-b border-black/5 z-40">
          <h1 className="font-semibold text-ink text-[15px]">{sectionLabel}</h1>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            {/* Notification bell */}
            <div className="relative">
              <button className="w-9 h-9 rounded-full bg-card border border-black/5 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
              </button>
              {adminNotes > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                  {adminNotes}
                </span>
              )}
            </div>
            {/* Yumi toggle */}
            <button onClick={() => setYumiOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-semibold transition-all"
              style={{
                background: yumiOpen ? 'var(--color-primary)' : 'white',
                color: yumiOpen ? 'white' : 'var(--color-primary)',
                borderColor: 'var(--color-primary)',
              }}>
              <span>✦</span> Yumi
            </button>
            {/* Switch user */}
            <button onClick={() => navigate('/')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/5 bg-card text-[12px] font-medium text-muted hover:text-ink transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
              Switch User
            </button>
          </div>
        </header>

        {/* Content + Yumi */}
        <div className="flex-1 flex overflow-hidden">
          <main className={`flex-1 overflow-hidden ${isPipelineFullHeight ? '' : 'overflow-y-auto p-6'}`}>
            {renderSection()}
          </main>
          {yumiOpen && (
            <YumiPanel activeSection={activeSection} />
          )}
        </div>
      </div>

      <ToastStack />
    </div>
  )
}
