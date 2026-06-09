import { useState, useEffect } from 'react'
import WelcomeScreen from './WelcomeScreen'
import LoginScreen from './LoginScreen'

// Gates the app behind a branded welcome sequence + login.
// welcome (~3s) → login → app. Cross-fades between each phase.
export default function AuthGate({ children }) {
  const [phase, setPhase] = useState('welcome') // 'welcome' | 'login' | 'app'
  const [leaving, setLeaving] = useState(false)

  // Auto-advance from the welcome screen after the ~3s sequence.
  useEffect(() => {
    const fadeAt = setTimeout(() => setLeaving(true), 2600)
    const switchAt = setTimeout(() => {
      setPhase('login')
      setLeaving(false)
    }, 3100)
    return () => {
      clearTimeout(fadeAt)
      clearTimeout(switchAt)
    }
  }, [])

  const handleLogin = () => {
    setLeaving(true)
    setTimeout(() => {
      setPhase('app')
      setLeaving(false)
    }, 450)
  }

  if (phase === 'app') return children

  if (phase === 'welcome') {
    return (
      <div className={leaving ? 'screen-leave' : undefined}>
        <WelcomeScreen />
      </div>
    )
  }

  return (
    <div className={leaving ? 'screen-leave' : 'screen-enter'}>
      <LoginScreen onLogin={handleLogin} />
    </div>
  )
}
