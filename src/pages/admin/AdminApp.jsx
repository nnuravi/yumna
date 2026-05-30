import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import ToastStack from '../../components/Toast'
import Avatar from '../../components/Avatar'
import LanguageToggle from '../../components/LanguageToggle'
import BizOverview from './BizOverview'
import FOMS from './FOMS'
import BuyerSellerSection from './BuyerSellerSection'
import AuditTrail from './AuditTrail'

const NAV_ITEMS = [
  {
    id: 'overview',
    label: 'Business Overview',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    id: 'foms',
    label: 'FOMS',
    sublabel: 'Finance Operations',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    badge: true,
  },
  {
    id: 'buyers-sellers',
    label: 'Buyers & Sellers',
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
    id: 'audit',
    label: 'Audit Trail',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    id: 'schemes',
    label: 'Financing Schemes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/>
      </svg>
    ),
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 01-3.46 0"/>
      </svg>
    ),
  },
]

export default function AdminApp() {
  const [activeSection, setActiveSection] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { state } = useApp()
  const navigate = useNavigate()
  const user = state.currentUser

  const pendingCount = state.liveStatus === 'submitted' ? 1 : 0
  const adminNotes = state.notes.admin.filter(n => !n.read).length

  if (!user) { navigate('/'); return null }

  const renderSection = () => {
    switch (activeSection) {
      case 'overview': return <BizOverview onNavigate={setActiveSection} />
      case 'foms': return <FOMS />
      case 'buyers-sellers': return <BuyerSellerSection />
      case 'audit': return <AuditTrail />
      default: return <PlaceholderSection label={NAV_ITEMS.find(n => n.id === activeSection)?.label} />
    }
  }

  return (
    <div className="flex h-dvh overflow-hidden" style={{ background: 'var(--color-page)' }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col border-r border-black/5 bg-white transition-all duration-300 shrink-0"
        style={{ width: sidebarOpen ? '240px' : '64px' }}
      >
        {/* Logo */}
        <div className="px-4 py-5 border-b border-black/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-primary)' }}>
            <span className="text-white font-bold text-[12px]">ي</span>
          </div>
          {sidebarOpen && (
            <div>
              <div className="display font-semibold text-ink text-[15px]">Yumna</div>
              <div className="text-[10px] text-muted">Admin Portal</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const active = activeSection === item.id
            const hasBadge = item.badge && pendingCount > 0
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 mx-1 mb-0.5 rounded-xl transition-all text-start"
                style={{
                  width: 'calc(100% - 8px)',
                  background: active ? 'rgba(143,133,255,0.1)' : 'transparent',
                  color: active ? 'var(--color-primary)' : 'var(--color-muted)',
                }}
              >
                <div className="relative shrink-0">
                  {item.icon}
                  {hasBadge && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border border-white text-[8px] text-white font-bold flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </div>
                {sidebarOpen && (
                  <div className="min-w-0">
                    <div className={`text-[13px] font-medium truncate ${active ? 'font-semibold' : ''}`}>
                      {item.label}
                    </div>
                    {item.sublabel && (
                      <div className="text-[10px] truncate" style={{ color: active ? 'rgba(143,133,255,0.7)' : 'var(--color-muted)' }}>
                        {item.sublabel}
                      </div>
                    )}
                  </div>
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
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-card border border-black/5 shrink-0 transition-transform"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                style={{ transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s' }}>
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="shrink-0 h-14 px-6 flex items-center justify-between bg-white border-b border-black/5 z-40">
          <div>
            <h1 className="font-semibold text-ink text-[15px]">
              {NAV_ITEMS.find(n => n.id === activeSection)?.label}
            </h1>
          </div>
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
            {/* Switch user */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/5 bg-card text-[12px] font-medium text-muted hover:text-ink transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
              Switch User
            </button>
          </div>
        </header>

        {/* Section content */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderSection()}
        </main>
      </div>

      <ToastStack />
    </div>
  )
}

function PlaceholderSection({ label }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20">
      <div className="w-14 h-14 rounded-2xl bg-white border border-black/5 flex items-center justify-center mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
      </div>
      <div className="font-semibold text-ink text-[16px] mb-1">{label}</div>
      <div className="text-muted text-[13px]">Coming soon in this prototype</div>
    </div>
  )
}
