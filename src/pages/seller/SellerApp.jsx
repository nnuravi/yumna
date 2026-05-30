import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import ToastStack from '../../components/Toast'
import LanguageToggle from '../../components/LanguageToggle'
import SellerHome from './SellerHome'
import SellerMoney from './SellerMoney'
import SellerAlerts from './SellerAlerts'

const TABS = [
  {
    id: 'home', label: 'Home', labelAr: 'الرئيسية',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    id: 'money', label: 'Money', labelAr: 'المال',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    ),
  },
  {
    id: 'alerts', label: 'Alerts', labelAr: 'التنبيهات',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 01-3.46 0"/>
      </svg>
    ),
  },
]

export default function SellerApp() {
  const [activeTab, setActiveTab] = useState('home')
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const user = state.currentUser
  const unreadCount = state.notes.seller.filter(n => !n.read).length

  if (!user) {
    navigate('/')
    return null
  }

  if (user.onboardingStatus === 'new' || user.onboardingStatus === 'pending') {
    navigate('/seller/onboard', { replace: true })
    return null
  }

  return (
    <div className="flex flex-col h-dvh max-w-md mx-auto relative" style={{ background: 'var(--color-page)' }}>
      {/* Header */}
      <header className="shrink-0 px-5 pt-safe pt-4 pb-3 flex items-center justify-between bg-white border-b border-black/5 z-40">
        <div>
          <div className="eyebrow text-muted">Logged in as</div>
          <div className="font-semibold text-ink text-[15px]">{user.business}</div>
        </div>
        <div className="flex items-center gap-2.5">
          <LanguageToggle />
          {/* Bell */}
          <button
            onClick={() => setActiveTab('alerts')}
            className="relative w-10 h-10 rounded-full flex items-center justify-center bg-card border border-black/5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          {/* Avatar */}
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-semibold"
            style={{ background: '#8f85ff' }}
            title="Switch user"
          >
            {user.initials}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div key={activeTab} className="tab-content">
          {activeTab === 'home' && <SellerHome onTabChange={setActiveTab} />}
          {activeTab === 'money' && <SellerMoney />}
          {activeTab === 'alerts' && <SellerAlerts />}
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="shrink-0 bg-white border-t border-black/5 safe-bottom z-40">
        <div className="flex">
          {TABS.map(tab => {
            const active = activeTab === tab.id
            const badge = tab.id === 'alerts' && unreadCount > 0
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex flex-col items-center gap-0.5 py-3 relative transition-colors duration-150"
                style={{ color: active ? 'var(--color-primary)' : 'var(--color-muted)' }}
              >
                <div className="relative">
                  {tab.icon(active)}
                  {badge && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <span className="text-[10px] font-medium">{state.language === 'ar' ? tab.labelAr : tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <ToastStack />
    </div>
  )
}
