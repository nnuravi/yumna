import { createContext, useContext, useReducer } from 'react'
import { USERS } from '../data/mockData'

const AppCtx = createContext(null)

const initialState = {
  language: 'en',
  currentUser: USERS.admin_super,
  liveStatus: null,
  liveData: null,
  requests: [],
  adminDecision: null,
  adminNote: '',
  buyerConfirmed: false,
  disbursed: false,
  buyerPaid: false,
  notes: {
    seller: [],
    buyer: [],
    admin: [],
  },
  toasts: [],
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LANGUAGE': {
      const lang = action.payload
      document.documentElement.lang = lang
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
      return { ...state, language: lang }
    }

    case 'SET_USER':
      return { ...state, currentUser: action.payload }

    case 'COMPLETE_ONBOARDING':
      return {
        ...state,
        currentUser: { ...state.currentUser, onboardingStatus: 'active' },
      }

    case 'SUBMIT': {
      const fr = action.payload
      const newRequest = { ...fr, stage: 'submitted', submitted: new Date().toISOString() }
      return {
        ...state,
        liveStatus: 'submitted',
        liveData: fr,
        requests: [newRequest, ...state.requests],
        notes: {
          seller: [{ id: Date.now(), text: `Finance request ${fr.id} submitted. Awaiting Yumna review.`, time: 'just now', read: false }, ...state.notes.seller],
          buyer: state.notes.buyer,
          admin: [{ id: Date.now(), text: `New finance request ${fr.id} from Zahrani Trading Co. — SAR ${fr.amt?.toLocaleString()}. Awaiting review.`, time: 'just now', read: false }, ...state.notes.admin],
        },
      }
    }

    case 'ADMIN_DECIDE': {
      const { decision, note } = action.payload
      const statusMap = { approved: 'approved', denied: 'denied', stalled: 'stalled' }
      const updatedRequests = state.requests.map(r =>
        r.id === state.liveData?.id ? { ...r, stage: decision } : r
      )
      return {
        ...state,
        liveStatus: statusMap[decision],
        adminDecision: decision,
        adminNote: note,
        requests: updatedRequests,
        notes: {
          seller: [{ id: Date.now(), text: `${state.liveData?.id} — Admin decision: ${decision.toUpperCase()}. ${note}`, time: 'just now', read: false }, ...state.notes.seller],
          buyer: decision === 'approved'
            ? [{ id: Date.now(), text: `New invoice ${state.liveData?.id} from ${state.liveData?.seller} is awaiting your delivery confirmation.`, time: 'just now', read: false }, ...state.notes.buyer]
            : state.notes.buyer,
          admin: state.notes.admin,
        },
      }
    }

    case 'BUYER_CONFIRM': {
      const updatedRequests = state.requests.map(r =>
        r.id === state.liveData?.id ? { ...r, stage: 'delivery_confirmed' } : r
      )
      return {
        ...state,
        liveStatus: 'delivery_confirmed',
        buyerConfirmed: true,
        requests: updatedRequests,
        notes: {
          seller: [{ id: Date.now(), text: `Delivery confirmed for ${state.liveData?.id} by Ahmed Al-Otaibi. Disbursement in process.`, time: 'just now', read: false }, ...state.notes.seller],
          buyer: [{ id: Date.now(), text: `You have confirmed delivery of ${state.liveData?.id}. Repayment due in ${state.liveData?.tenure} days.`, time: 'just now', read: false }, ...state.notes.buyer],
          admin: [{ id: Date.now(), text: `Buyer confirmed delivery for ${state.liveData?.id}. Ready to disburse.`, time: 'just now', read: false }, ...state.notes.admin],
        },
      }
    }

    case 'DISBURSE': {
      const updatedRequests = state.requests.map(r =>
        r.id === state.liveData?.id ? { ...r, stage: 'disbursed' } : r
      )
      const netAmt = state.liveData?.amt * (1 - (state.liveData?.mdrRate || 2.5) / 100)
      return {
        ...state,
        liveStatus: 'disbursed',
        disbursed: true,
        requests: updatedRequests,
        notes: {
          seller: [{ id: Date.now(), text: `Disbursement processed! SAR ${netAmt?.toLocaleString('en', { maximumFractionDigits: 0 })} transferred to your IBAN.`, time: 'just now', read: false }, ...state.notes.seller],
          buyer: [{ id: Date.now(), text: `${state.liveData?.id} is now financed. Repayment of SAR ${state.liveData?.amt?.toLocaleString()} due in ${state.liveData?.tenure} days.`, time: 'just now', read: false }, ...state.notes.buyer],
          admin: state.notes.admin,
        },
      }
    }

    case 'BUYER_REPAY': {
      const updatedRequests = state.requests.map(r =>
        r.id === state.liveData?.id ? { ...r, stage: 'repaid' } : r
      )
      return {
        ...state,
        liveStatus: 'repaid',
        buyerPaid: true,
        requests: updatedRequests,
        notes: {
          seller: state.notes.seller,
          buyer: [{ id: Date.now(), text: `Payment confirmed for ${state.liveData?.id}. Your credit limit has been restored.`, time: 'just now', read: false }, ...state.notes.buyer],
          admin: [{ id: Date.now(), text: `${state.liveData?.id} fully repaid by Ahmed Al-Otaibi.`, time: 'just now', read: false }, ...state.notes.admin],
        },
      }
    }

    case 'MARK_READ': {
      const { persona } = action.payload
      return {
        ...state,
        notes: {
          ...state.notes,
          [persona]: state.notes[persona].map(n => ({ ...n, read: true })),
        },
      }
    }

    case 'ADD_TOAST':
      return { ...state, toasts: [action.payload, ...state.toasts] }

    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) }

    case 'RESET_LIVE':
      return {
        ...state,
        liveStatus: null,
        liveData: null,
        adminDecision: null,
        adminNote: '',
        buyerConfirmed: false,
        disbursed: false,
        buyerPaid: false,
      }

    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const addToast = (message, type = 'success') => {
    const id = Date.now()
    dispatch({ type: 'ADD_TOAST', payload: { id, message, type } })
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 3500)
  }

  return (
    <AppCtx.Provider value={{ state, dispatch, addToast }}>
      {children}
    </AppCtx.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
