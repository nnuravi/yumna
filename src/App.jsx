import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import AuthGate from './pages/auth/AuthGate'
import AdminApp from './pages/admin/AdminApp'

export default function App() {
  return (
    <AppProvider>
      {/* Branded welcome + login gate the dashboard on first load */}
      <AuthGate>
        <BrowserRouter>
          <Routes>
            {/* Super Admin — primary page */}
            <Route path="/" element={<AdminApp />} />
            <Route path="/admin" element={<AdminApp />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthGate>
    </AppProvider>
  )
}
