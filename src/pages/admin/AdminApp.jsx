import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import ToastStack from '../../components/Toast'
import Avatar from '../../components/Avatar'
import LanguageToggle from '../../components/LanguageToggle'
import BizOverview from './BizOverview'
import Pipeline from './Pipeline'
import RepaymentsPipeline from './RepaymentsPipeline'
import FinanceRequestsPipeline from './FinanceRequestsPipeline'
import SellersSection from './SellersSection'
import BuyersSection from './BuyersSection'
import TaskManager from './TaskManager'
import Templates from './Templates'
import CorrespondenceCenter from './CorrespondenceCenter'
import YumnaiPanel from './YumnaiPanel'
import { PIPELINE_CARDS, REPAYMENTS_CARDS, DIRECT_FINANCE_CARDS, INVOICE_FINANCE_CARDS, TASKS } from '../../data/mockData'

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
    label: 'Onboarding Pipeline',
    roles: null,
    badge: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="4" height="18" rx="1"/><rect x="10" y="3" width="4" height="12" rx="1"/><rect x="17" y="3" width="4" height="15" rx="1"/>
      </svg>
    ),
  },
  {
    id: 'finance_requests',
    label: 'Finance Requests',
    roles: null,
    badge: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
  },
  {
    id: 'repayments',
    label: 'Collections Pipeline',
    roles: ['super', 'collections', 'legal', 'account_mgr'],
    badge: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
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
    id: 'correspondence',
    label: 'Correspondence',
    roles: null,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        <line x1="9" y1="10" x2="15" y2="10"/><line x1="9" y1="14" x2="13" y2="14"/>
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

export default function AdminApp({ onSignOut }) {
  const [activeSection, setActiveSection] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [yumnaiOpen, setYumnaiOpen] = useState(false)
  const [yumnaiMinimized, setYumnaiMinimized] = useState(false)
  const [yumnaiWidth, setYumnaiWidth] = useState(400)
  const [breadcrumb, setBreadcrumb] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const { state } = useApp()
  const user = state.currentUser

  if (!user) return null

  const adminRole = user.adminRole
  const adminNotes = state.notifications.filter(n => n.recipientRole === 'admin' && !n.read).length

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

  const financeRequestsBadge =
    (DIRECT_FINANCE_CARDS  || []).filter(c => c.stage !== 'df_payment_plan').length +
    (INVOICE_FINANCE_CARDS  || []).filter(c => c.stage !== 'if_active').length

  const myTaskCount = TASKS.filter(t => t.assignedTo === user.name && t.status !== 'done').length

  const navItems = ALL_NAV.filter(item => !item.roles || item.roles.includes(adminRole))

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':          return <BizOverview />
      case 'pipeline':          return <Pipeline onNavigate={setActiveSection} onBreadcrumb={setBreadcrumb} />
      case 'finance_requests':  return <FinanceRequestsPipeline onBreadcrumb={setBreadcrumb} />
      case 'repayments':        return <RepaymentsPipeline onBreadcrumb={setBreadcrumb} />
      case 'sellers':           return <SellersSection onBreadcrumb={setBreadcrumb} />
      case 'buyers':            return <BuyersSection onBreadcrumb={setBreadcrumb} />
      case 'correspondence':    return <CorrespondenceCenter onBreadcrumb={setBreadcrumb} />
      case 'tasks':             return <TaskManager />
      case 'templates':         return <Templates />
      default:                  return <BizOverview />
    }
  }

  const sectionLabel = navItems.find(n => n.id === activeSection)?.label || 'Overview'
  const isPipelineFullHeight = activeSection === 'pipeline' || activeSection === 'repayments' || activeSection === 'finance_requests' || activeSection === 'correspondence'

  return (
    <div className="app-bg flex flex-col h-dvh overflow-hidden">
      {/* Full-width app bar — transparent over the gradient */}
      <header className="shrink-0 h-16 flex items-center pe-5 z-40">
        {/* Logo zone — sits above the sidebar, width tracks the rail */}
        <div className="shrink-0 flex items-center h-full ps-6 overflow-hidden ease-entrance"
          style={{ width: sidebarOpen ? '248px' : '92px', transition: 'width 0.32s var(--ease-entrance)' }}>
          {/* Lockup forced LTR so the mark + wordmark keep their order under RTL */}
          <div dir="ltr" className="flex items-center">
            <img src="/logo-mark.svg" alt="Yumna" className="h-8 w-auto shrink-0" />
            <img src="/assets/logotype.svg" alt="Yumna" className="h-8 w-auto shrink-0 ms-2"
              style={{ opacity: sidebarOpen ? 1 : 0, maxWidth: sidebarOpen ? '120px' : '0px', transition: 'opacity 0.25s var(--ease-entrance), max-width 0.32s var(--ease-entrance)' }} />
          </div>
        </div>

        {/* Right block — section heading + controls */}
        <div className="flex-1 flex items-center justify-between min-w-0 ps-1">
          {breadcrumb ? (
            <div className="flex items-center gap-2 min-w-0 text-[16px]">
              <button onClick={breadcrumb.onHome}
                className="font-medium text-muted hover:text-ink transition-colors shrink-0">
                {sectionLabel}
              </button>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              <span className="font-semibold text-ink truncate">{breadcrumb.label}</span>
              {breadcrumb.id && (
                <span className="text-muted font-medium shrink-0">| {breadcrumb.id}</span>
              )}
            </div>
          ) : (
            <h1 className="font-semibold text-ink text-[16px] truncate">{sectionLabel}</h1>
          )}
          <div className="flex items-center gap-2.5">
            <LanguageToggle />
            {/* Notification bell */}
            <div className="relative">
              <button className="w-9 h-9 rounded-full bg-card border border-black/5 flex items-center justify-center shadow-sm hover:bg-white transition-colors">
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
            {/* Yumnai toggle */}
            <button onClick={() => { setYumnaiMinimized(false); setYumnaiOpen(o => !o) }}
              className="flex items-center gap-1.5 px-3.5 h-9 rounded-full border text-[12px] font-semibold shadow-sm transition-all"
              style={{
                background: yumnaiOpen ? 'var(--color-primary-soft)' : 'white',
                color: 'var(--color-primary)',
                borderColor: 'var(--color-primary)',
              }}>
              <img src="/yumnai.svg" alt="" className="h-3.5 w-auto" /> Yumnai
            </button>
          </div>
        </div>
      </header>

      {/* Body — sidebar (left block) + content (right block) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar — floating pill rail */}
        <aside className="shrink-0 pb-3 ps-3 overflow-hidden"
          style={{ width: sidebarOpen ? '248px' : '92px', transition: 'width 0.32s var(--ease-entrance)' }}>
          <div className={`flex h-full flex-col bg-white border border-[var(--color-line)] overflow-hidden ${sidebarOpen ? 'rounded-3xl' : 'rounded-full'}`}
            style={{ boxShadow: 'var(--shadow-rail)' }}>
            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 pt-4 pb-2 flex flex-col gap-1.5">
              {navItems.map(item => {
                const active = activeSection === item.id
                const badge = item.id === 'pipeline' ? pipelineBadge : item.id === 'finance_requests' ? financeRequestsBadge : item.id === 'repayments' ? repaymentsBadge : item.id === 'tasks' ? myTaskCount : 0
                return (
                  <button key={item.id} onClick={() => { setBreadcrumb(null); setActiveSection(item.id) }} title={item.label}
                    className="group relative flex items-center h-12 self-center transition-colors"
                    style={{
                      width: sidebarOpen ? '100%' : '48px',
                      borderRadius: sidebarOpen ? '14px' : '9999px',
                      transition: 'width 0.32s var(--ease-entrance)',
                      background: active ? 'var(--color-primary)' : 'transparent',
                      color: active ? '#fff' : 'var(--color-ink-soft)',
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--color-page)' }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                    {/* Icon holder — full width when collapsed (centres icon), fixed when expanded */}
                    <span className="relative grid place-items-center h-7 shrink-0"
                      style={{ width: sidebarOpen ? '40px' : '100%', transition: 'width 0.32s var(--ease-entrance)' }}>
                      {item.icon}
                      {badge > 0 && (
                        <span className="absolute top-0 right-1.5 min-w-[15px] h-[15px] px-1 rounded-full border-2 border-white text-[8px] font-bold flex items-center justify-center"
                          style={{ background: active ? '#fff' : 'var(--color-primary)', color: active ? 'var(--color-primary)' : '#fff' }}>
                          {badge}
                        </span>
                      )}
                    </span>
                    <span className={`text-[13px] truncate ${active ? 'font-semibold' : 'font-medium'}`}
                      style={{ opacity: sidebarOpen ? 1 : 0, maxWidth: sidebarOpen ? '150px' : '0px', transition: 'opacity 0.22s var(--ease-entrance), max-width 0.32s var(--ease-entrance)' }}>
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </nav>

            {/* User + collapse */}
            <div className="border-t border-[var(--color-line)] p-3">
              <div className={`flex items-center ${sidebarOpen ? 'gap-2.5' : 'flex-col gap-2'}`}>
                <button onClick={() => setShowProfile(true)} className="shrink-0 rounded-full hover:ring-2 hover:ring-[var(--color-primary)] transition-all">
                  <Avatar initials={user.initials} bg={user.avatar} size="sm" />
                </button>
                <div className="flex-1 min-w-0 overflow-hidden"
                  style={{ opacity: sidebarOpen ? 1 : 0, maxWidth: sidebarOpen ? '150px' : '0px', transition: 'opacity 0.22s var(--ease-entrance), max-width 0.32s var(--ease-entrance)' }}>
                  <div className="text-[12px] font-semibold text-ink truncate">{user.name}</div>
                  <div className="text-[10px] text-muted truncate">{user.title}</div>
                </div>
                <button onClick={() => setSidebarOpen(o => !o)} title={sidebarOpen ? 'Collapse' : 'Expand'}
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--color-page)] border border-[var(--color-line)] shrink-0 hover:bg-white transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    style={{ transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.32s var(--ease-entrance)' }}>
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
              </div>
              {/* Sign out — only visible when sidebar is expanded */}
              <div style={{ overflow: 'hidden', maxHeight: sidebarOpen ? '40px' : '0px', opacity: sidebarOpen ? 1 : 0, transition: 'max-height 0.3s var(--ease-entrance), opacity 0.22s var(--ease-entrance)', marginTop: sidebarOpen ? '8px' : '0' }}>
                <button onClick={onSignOut}
                  className="w-full flex items-center gap-2 px-3 h-8 rounded-xl text-[12px] font-medium text-red-600 hover:bg-red-50 transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Content + Yumnai */}
        <div className="flex-1 flex overflow-hidden">
          <main className={`flex-1 overflow-hidden ${isPipelineFullHeight ? '' : 'overflow-y-auto p-6 pt-2'}`}>
            <div key={activeSection} className="tab-content h-full">
              {renderSection()}
            </div>
          </main>
          {(yumnaiOpen || yumnaiMinimized) && (
            <YumnaiPanel activeSection={activeSection} width={yumnaiWidth} onWidth={setYumnaiWidth}
              hidden={yumnaiMinimized}
              onClose={(engaged) => { setYumnaiOpen(false); setYumnaiMinimized(engaged) }} />
          )}
        </div>
      </div>

      {/* Yumnai minimized FAB */}
      {yumnaiMinimized && (
        <button onClick={() => { setYumnaiMinimized(false); setYumnaiOpen(true) }} title="Open Yumnai"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #9084fd 0%, #6a7bff 50%, #3da4ff 100%)', boxShadow: '0 10px 28px rgba(144,132,253,0.45)' }}>
          <img src="/yumnai.svg" alt="Yumnai" className="h-6 w-auto" style={{ filter: 'brightness(0) invert(1)' }} />
        </button>
      )}

      <ToastStack />

      {/* Profile panel */}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowProfile(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-semibold text-ink">My Profile</h2>
              <button onClick={() => setShowProfile(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--color-page)] transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <Avatar initials={user.initials} bg={user.avatar} size="lg" />
              <div>
                <div className="font-semibold text-ink text-[15px]">{user.name}</div>
                <div className="text-[12px] text-muted mt-0.5">{user.title}</div>
                <div className="text-[11px] text-muted mt-0.5 capitalize">{user.adminRole} Admin</div>
              </div>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--color-page)]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="1.8" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <span className="text-[12px] text-ink-soft">{user.id}@yumna.sa</span>
              </div>
            </div>
            <button onClick={onSignOut}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-[13px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
