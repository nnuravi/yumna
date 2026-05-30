import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Login from './pages/Login'
import SellerApp from './pages/seller/SellerApp'
import SellerOnboard from './pages/seller/SellerOnboard'
import CreateInvoice from './pages/seller/CreateInvoice'
import SubmissionStatus from './pages/seller/SubmissionStatus'
import BuyerApp from './pages/buyer/BuyerApp'
import MDRConsent from './pages/buyer/MDRConsent'
import AdminApp from './pages/admin/AdminApp'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          {/* Seller */}
          <Route path="/seller" element={<SellerApp />} />
          <Route path="/seller/onboard" element={<SellerOnboard />} />
          <Route path="/seller/invoice" element={<CreateInvoice />} />
          <Route path="/seller/status" element={<SubmissionStatus />} />

          {/* Buyer */}
          <Route path="/buyer" element={<BuyerApp />} />
          <Route path="/buyer/mdr-consent" element={<MDRConsent />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminApp />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
