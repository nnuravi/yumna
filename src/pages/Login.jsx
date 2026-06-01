import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { USERS } from '../data/mockData'
import LanguageToggle from '../components/LanguageToggle'

const TEST_USERS = [
  {
    key: 'seller',
    user: USERS.seller,
    label: 'Seller',
    labelAr: 'بائع',
    description: 'Khalid Al-Zahrani · Wholesaler',
    descAr: 'خالد الزهراني · تاجر جملة',
    route: '/seller',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    accent: '#8f85ff',
    accentLight: '#f5f5f5',
    device: 'Mobile',
  },
  {
    key: 'new_seller',
    user: USERS.new_seller,
    label: 'New Seller',
    labelAr: 'بائع جديد',
    description: 'Omar Al-Qahtani · First-time onboarding',
    descAr: 'عمر القحطاني · تسجيل جديد',
    route: '/seller/onboard',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
      </svg>
    ),
    accent: '#6366f1',
    accentLight: '#f5f5f5',
    device: 'Mobile',
  },
  {
    key: 'buyer',
    user: USERS.buyer,
    label: 'Buyer',
    labelAr: 'مشتري',
    description: 'Ahmed Al-Otaibi · Retailer',
    descAr: 'أحمد العتيبي · تاجر تجزئة',
    route: '/buyer',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.55l1.65-7.45H6"/>
      </svg>
    ),
    accent: '#0b0f19',
    accentLight: '#f5f5f5',
    device: 'Mobile',
  },
  {
    key: 'admin_super',
    user: USERS.admin_super,
    label: 'Super Admin',
    labelAr: 'المدير العام',
    description: 'Layla Al-Harbi · Head of Operations',
    descAr: 'ليلى الحربي · رئيسة العمليات',
    route: '/admin',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    accent: '#0b0f19',
    accentLight: '#f5f5f5',
    device: 'Web',
  },
  {
    key: 'admin_verifier',
    user: USERS.admin_verifier,
    label: 'Verifier',
    labelAr: 'موظف التحقق',
    description: 'Sara Al-Ghamdi · Loan Verification',
    descAr: 'سارة الغامدي · موظفة التحقق',
    route: '/admin',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    accent: '#10b981',
    accentLight: '#f5f5f5',
    device: 'Web',
  },
  {
    key: 'admin_credit',
    user: USERS.admin_credit,
    label: 'Credit Mgr',
    labelAr: 'مدير الائتمان',
    description: 'Faisal Al-Dosari · Credit Scoring',
    descAr: 'فيصل الدوسري · درجة الائتمان',
    route: '/admin',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
    accent: '#f59e0b',
    accentLight: '#f5f5f5',
    device: 'Web',
  },
  {
    key: 'admin_risk',
    user: USERS.admin_risk,
    label: 'Risk Analyst',
    labelAr: 'محلل المخاطر',
    description: 'Noura Al-Shehri · Risk & Compliance',
    descAr: 'نورة الشهري · المخاطر والامتثال',
    route: '/admin',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    accent: '#e5484d',
    accentLight: '#f5f5f5',
    device: 'Web',
  },
  {
    key: 'admin_collections',
    user: USERS.admin_collections,
    label: 'Collections',
    labelAr: 'التحصيل',
    description: 'Omar Al-Mutairi · Collections Mgr',
    descAr: 'عمر المطيري · مدير التحصيل',
    route: '/admin',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    ),
    accent: '#6366f1',
    accentLight: '#f5f5f5',
    device: 'Web',
  },
  {
    key: 'admin_account_mgr',
    user: USERS.admin_account_mgr,
    label: 'Account Mgr',
    labelAr: 'مدير حسابات',
    description: 'Rania Al-Sabban · Account Manager',
    descAr: 'رانيا السبان · مدير حسابات',
    route: '/admin',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
    accent: '#0891b2',
    accentLight: '#f5f5f5',
    device: 'Web',
  },
  {
    key: 'admin_legal',
    user: USERS.admin_legal,
    label: 'Legal',
    labelAr: 'الشؤون القانونية',
    description: 'Tariq Al-Ghamdi · Legal Counsel',
    descAr: 'طارق الغامدي · مستشار قانوني',
    route: '/admin',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    accent: '#7c3aed',
    accentLight: '#f5f5f5',
    device: 'Web',
  },
]

export default function Login() {
  const navigate = useNavigate()
  const { dispatch, addToast } = useApp()

  const handleLogin = (entry) => {
    dispatch({ type: 'SET_USER', payload: entry.user })
    addToast(`Signed in as ${entry.user.name}`)
    navigate(entry.route)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#ffffff' }}>
      {/* Header */}
      <header className="px-6 pt-10 pb-6 flex items-center justify-between">
        <div>
          <div style={{ color: '#a3a3a3' }} className="text-[11px] font-semibold tracking-widest uppercase mb-1">يُمنى</div>
          <div className="display text-[#111111] text-2xl">Yumna</div>
        </div>
        <div className="flex items-center gap-2.5">
          <LanguageToggle />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border" style={{ background: 'rgba(0,0,0,0.04)', borderColor: 'rgba(0,0,0,0.08)' }}>
            <span className="w-1.5 h-1.5 rounded-full live-dot" style={{ background: '#404040' }}/>
            <span style={{ color: '#737373' }} className="text-[11px] font-medium">UX Testing Mode</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="px-6 pb-8">
        <h1 className="display text-[#111111] text-3xl leading-tight mb-2">
          Select a persona<br/>to begin testing
        </h1>
        <p style={{ color: '#737373' }} className="text-[14px]">
          Switch between connected experiences to explore the full transaction flow.
        </p>
      </div>

      {/* User Cards */}
      <div className="flex-1 px-5 pb-8">
        {/* Mobile personas */}
        <div className="eyebrow mb-3" style={{ color: '#a3a3a3' }}>Mobile Experiences</div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {TEST_USERS.filter(u => u.device === 'Mobile').map(entry => (
            <UserCard key={entry.key} entry={entry} onSelect={handleLogin} />
          ))}
        </div>

        {/* Admin personas */}
        <div className="eyebrow mb-3" style={{ color: '#a3a3a3' }}>Admin Dashboard</div>
        <div className="grid grid-cols-2 gap-3">
          {TEST_USERS.filter(u => u.device === 'Web').map(entry => (
            <UserCard key={entry.key} entry={entry} onSelect={handleLogin} />
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div className="px-6 pb-8 text-center">
        <p style={{ color: '#d4d4d4' }} className="text-[11px]">
          Trade Credit Platform · KSA · SAMA Regulated · v0.1 Prototype
        </p>
      </div>
    </div>
  )
}

function UserCard({ entry, onSelect }) {
  return (
    <button
      onClick={() => onSelect(entry)}
      className="w-full text-start p-4 rounded-2xl border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: 'rgba(0,0,0,0.04)',
        borderColor: '#e5e5e5',
      }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ background: '#f5f5f5', color: '#404040' }}
      >
        {entry.icon}
      </div>

      {/* Labels */}
      <div style={{ color: '#171717' }} className="font-semibold text-[14px] leading-tight mb-0.5">
        {entry.label}
      </div>
      <div style={{ color: '#a3a3a3' }} className="text-[10px] leading-tight mb-2">
        {entry.labelAr}
      </div>
      <div style={{ color: '#737373' }} className="text-[11px] leading-snug">
        {entry.description}
      </div>

      {/* Device pill */}
      <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full"
        style={{ background: 'rgba(0,0,0,0.04)' }}>
        {entry.device === 'Mobile'
          ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
          : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8 21 12 17 16 21"/></svg>
        }
        <span style={{ color: '#a3a3a3' }} className="text-[9px] font-medium uppercase tracking-wide">{entry.device}</span>
      </div>
    </button>
  )
}
