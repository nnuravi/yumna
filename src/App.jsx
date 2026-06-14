import { AppProvider } from './context/AppContext'
import AuthGate from './pages/auth/AuthGate'

export default function App() {
  return (
    <AppProvider>
      <AuthGate />
    </AppProvider>
  )
}
