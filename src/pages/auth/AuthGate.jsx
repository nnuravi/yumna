import { useState, useEffect, lazy, Suspense } from 'react'
import WelcomeScreen from './WelcomeScreen'
import LoginScreen from './LoginScreen'
import { useApp } from '../../context/AppContext'
import { LOGIN_CREDENTIALS, USERS } from '../../data/mockData'

const AdminApp  = lazy(() => import('../admin/AdminApp'))
const BuyerApp  = lazy(() => import('../buyer/BuyerApp'))
const SellerApp = lazy(() => import('../seller/SellerApp'))

const PERSONAS = [
  { key: 'admin_super', label: 'Admin',  sub: 'Layla',  initials: 'LH', color: '#262626' },
  { key: 'buyer',       label: 'Buyer',  sub: 'Ahmed',  initials: 'AA', color: '#737373' },
  { key: 'seller',      label: 'Seller', sub: 'Khalid', initials: 'KZ', color: '#404040' },
]

function PersonaSwitcher({ currentUserId, onSwitch }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 999,
        padding: '5px 8px 5px 10px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      }}
    >
      <span style={{ fontSize: 10, fontWeight: 700, color: '#a3a3a3', letterSpacing: '0.06em', marginRight: 4, textTransform: 'uppercase' }}>
        Test as
      </span>
      {PERSONAS.map(p => {
        const isActive = currentUserId === USERS[p.key]?.id
        return (
          <button
            key={p.key}
            onClick={() => onSwitch(p.key)}
            title={`Switch to ${p.label} (${p.sub})`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px 4px 6px',
              borderRadius: 999,
              border: 'none',
              cursor: isActive ? 'default' : 'pointer',
              background: isActive ? 'var(--color-primary)' : 'transparent',
              transition: 'background 0.15s, box-shadow 0.15s',
              outline: 'none',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(144,132,253,0.1)' }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
          >
            <div style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: isActive ? 'rgba(255,255,255,0.25)' : p.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
              letterSpacing: '0.02em',
            }}>
              {p.initials}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? '#fff' : '#404040', lineHeight: 1.2 }}>{p.label}</div>
              <div style={{ fontSize: 9, color: isActive ? 'rgba(255,255,255,0.75)' : '#a3a3a3', lineHeight: 1.2 }}>{p.sub}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default function AuthGate() {
  const { state, dispatch } = useApp()
  // Persisted session (localStorage) skips the welcome/login intro.
  const [phase, setPhase] = useState(state.currentUser ? 'app' : 'welcome') // 'welcome' | 'login' | 'app'
  const [leaving, setLeaving] = useState(false)
  const [loginError, setLoginError] = useState(null)

  // Auto-advance from the welcome screen after ~3s (only for fresh sessions).
  useEffect(() => {
    if (state.currentUser) return
    const fadeAt   = setTimeout(() => setLeaving(true), 2600)
    const switchAt = setTimeout(() => { setPhase('login'); setLeaving(false) }, 3100)
    return () => { clearTimeout(fadeAt); clearTimeout(switchAt) }
  }, [])

  // If user signs back in after sign-out, go to app phase.
  useEffect(() => {
    if (state.currentUser && phase === 'login') {
      setLeaving(true)
      setTimeout(() => { setPhase('app'); setLeaving(false) }, 450)
    }
  }, [state.currentUser])

  const handleLogin = ({ username, password }) => {
    const cred = LOGIN_CREDENTIALS[username?.trim().toLowerCase()]
    if (!cred || cred.pass !== password) {
      setLoginError('Incorrect username or password. Please try again.')
      return
    }
    setLoginError(null)
    dispatch({ type: 'SET_USER', payload: USERS[cred.userKey] })
    setLeaving(true)
    setTimeout(() => { setPhase('app'); setLeaving(false) }, 450)
  }

  const handleSignOut = () => {
    dispatch({ type: 'SIGN_OUT' })
    setPhase('login')
    setLeaving(false)
  }

  const handleSwitch = (key) => {
    dispatch({ type: 'SET_USER', payload: USERS[key] })
    dispatch({ type: 'COMPLETE_ONBOARDING' })
    setLoginError(null)
    setLeaving(false)
    setPhase('app')
  }

  let content
  if (phase === 'app' && state.currentUser) {
    const role = state.currentUser.role
    content = (
      <Suspense fallback={null}>
        {role === 'admin'  && <AdminApp  onSignOut={handleSignOut} />}
        {role === 'buyer'  && <BuyerApp  onSignOut={handleSignOut} />}
        {role === 'seller' && <SellerApp onSignOut={handleSignOut} />}
      </Suspense>
    )
  } else if (phase === 'welcome') {
    content = (
      <div className={leaving ? 'screen-leave' : undefined}>
        <WelcomeScreen />
      </div>
    )
  } else {
    content = (
      <div className={leaving ? 'screen-leave' : 'screen-enter'}>
        <LoginScreen onLogin={handleLogin} error={loginError} />
      </div>
    )
  }

  return (
    <>
      {content}
      <PersonaSwitcher currentUserId={state.currentUser?.id} onSwitch={handleSwitch} />
    </>
  )
}
