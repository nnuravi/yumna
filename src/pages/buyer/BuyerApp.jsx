import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import ToastStack from '../../components/Toast'
import LanguageToggle from '../../components/LanguageToggle'
import BuyerHome from './BuyerHome'
import BuyerPayments from './BuyerPayments'
import BuyerSellers from './BuyerSellers'
import BuyerAlerts from './BuyerAlerts'

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
    id: 'payments', label: 'Payments', labelAr: 'المدفوعات',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
  {
    id: 'sellers', label: 'Sellers', labelAr: 'البائعون',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
        <path d="M16 3.13a4 4 0 010 7.75"/>
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

export default function BuyerApp() {
  const [activeTab, setActiveTab] = useState('home')
  const { state } = useApp()
  const navigate = useNavigate()
  const user = state.currentUser
  const unreadCount = state.notes.buyer.filter(n => !n.read).length

  if (!user) { navigate('/'); return null }

  return (
    <div className="flex flex-col h-dvh max-w-md mx-auto relative" style={{ background: 'var(--color-page)' }}>
      {/* Header */}
      <header className="shrink-0 px-5 pt-4 pb-3 flex items-center justify-between bg-white border-b border-black/5 z-40">
        <div>
          <div className="eyebrow text-muted">Buyer workspace</div>
          <div className="font-semibold text-ink text-[15px]">{user.name}</div>
        </div>
        <div className="flex items-center gap-2.5">
          <LanguageToggle />
          <button
            onClick={() => setActiveTab('alerts')}
          className="relative w-10 h-10 rounded-full flex items-center justify-center font-semibold text-[12px] text-white"
          style={{ background: 'var(--color-ink)' }}
        >
          {user.initials}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
              {unreadCount}
            </span>
          )}
        </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div key={activeTab} className="tab-content">
          {activeTab === 'home' && <BuyerHome onTabChange={setActiveTab} />}
          {activeTab === 'payments' && <BuyerPayments />}
          {activeTab === 'sellers' && <BuyerSellers />}
          {activeTab === 'alerts' && <BuyerAlerts />}
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
