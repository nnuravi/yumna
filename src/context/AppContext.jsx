import { createContext, useContext, useReducer, useEffect } from 'react'
import {
  INVOICE_FINANCE_CARDS, DIRECT_FINANCE_CARDS, MOCK_BUYERS,
  PIPELINE_CARDS, REPAYMENTS_CARDS, AUDIT_LOG,
} from '../data/mockData'
import { nextStage, STAGE_BADGE } from '../data/stages'

const AppCtx = createContext(null)

const STORAGE_KEY = 'yumna-state'
// Bump when the persisted state shape changes so old payloads are discarded
// and re-seeded (v2 added pipeline/repayments/auditLog + canonical lifecycle).
const STORAGE_VERSION = 2

// 'YYYY-MM-DD HH:mm' — matches the format used across mock correspondence so the
// activity timelines group new entries correctly.
function nowStamp() {
  const n = new Date()
  const p = (x) => String(x).padStart(2, '0')
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())} ${p(n.getHours())}:${p(n.getMinutes())}`
}

let auditSeq = 100000
function auditEntry({ actor, role = '', action, entity, result = 'Success' }) {
  return { id: ++auditSeq, timestamp: `${nowStamp()} AST`, actor, role, action, entity, ip: '10.0.0.1', result }
}

// Single canonical stage-advance used by every persona. Looks up the next stage
// (or an explicit target), appends a timeline entry, applies stage side-effects
// (credit debit when an invoice leaves buyer approval), logs an audit entry, and
// notifies the seller. No persona reimplements lifecycle transitions.
function applyAdvance(state, collection, id, by, toStage) {
  const list = state[collection]
  if (!Array.isArray(list)) return state
  const time = nowStamp()
  let updated = null
  let prevStage = null

  const advanced = list.map(c => {
    if (c.id !== id) return c
    prevStage = c.stage
    const ns = toStage || nextStage(c.stage)
    if (!ns || ns === c.stage) { updated = c; return c }
    updated = {
      ...c,
      stage: ns,
      daysInStage: 0,
      correspondence: [
        ...(c.correspondence || []),
        { from: by || 'System', message: `Advanced to: ${STAGE_BADGE[ns]?.label || ns}.`, time, autoRead: true },
      ],
    }
    return updated
  })
  if (!updated || prevStage === updated.stage) return state

  let buyers = state.buyers
  if (collection === 'invoiceFinance' && prevStage === 'if_buyer_approval' && updated.buyerId) {
    buyers = state.buyers.map(b =>
      b.id === updated.buyerId ? { ...b, creditUsed: (b.creditUsed || 0) + (updated.amount || 0) } : b
    )
  }

  const notifications = (collection === 'invoiceFinance' && updated.sellerId)
    ? [{
        id: `n-${Date.now()}`,
        recipientId: updated.sellerId, recipientRole: 'seller',
        text: `${updated.invoiceNumber || updated.id}: ${STAGE_BADGE[updated.stage]?.label || updated.stage}.`,
        channels: ['inapp', 'whatsapp'], read: false, time,
      }, ...state.notifications]
    : state.notifications

  const auditLog = [
    auditEntry({ actor: by || 'System', action: `Stage → ${STAGE_BADGE[updated.stage]?.label || updated.stage}`, entity: `${updated.invoiceNumber || updated.id}` }),
    ...state.auditLog,
  ]

  return { ...state, [collection]: advanced, buyers, notifications, auditLog }
}

const initialState = {
  language: 'en',
  currentUser: null,
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
  pendingRequests: [],
  // Unified, mutable card store — the single source of truth that every persona
  // (buyer, seller, AND the admin pipelines) reads from, so an action taken in
  // one view is reflected everywhere.
  invoiceFinance: INVOICE_FINANCE_CARDS,
  directFinance: DIRECT_FINANCE_CARDS,
  buyers: MOCK_BUYERS,
  pipeline: PIPELINE_CARDS,
  repayments: REPAYMENTS_CARDS,
  auditLog: AUDIT_LOG,
  notifications: [
    { id: 'n1', recipientId: 'buyer-001', recipientRole: 'buyer', text: 'Your finance application has been approved. Funds will be disbursed within 24 hours.', channels: ['whatsapp', 'email', 'inapp'], read: false, time: '2026-06-08 10:30' },
    { id: 'n2', recipientId: 'buyer-001', recipientRole: 'buyer', text: 'Repayment reminder: SAR 45,000 due in 3 days for invoice INV-2024-089.', channels: ['whatsapp', 'inapp'], read: false, time: '2026-06-07 09:00' },
    { id: 'n3', recipientId: 'seller-001', recipientRole: 'seller', text: 'Invoice INV-2024-089 has been funded. SAR 195,600 transferred to your IBAN.', channels: ['whatsapp', 'email', 'inapp'], read: false, time: '2026-06-08 11:00' },
    { id: 'n4', recipientId: 'seller-001', recipientRole: 'seller', text: 'Buyer Ahmed Al-Otaibi has confirmed delivery for INV-2024-091.', channels: ['email', 'inapp'], read: true, time: '2026-06-06 14:30' },
  ],
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

    case 'SIGN_OUT':
      return { ...state, currentUser: null }

    case 'SEND_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications] }

    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      }

    case 'ADD_FINANCE_REQUEST':
      return { ...state, pendingRequests: [action.payload, ...state.pendingRequests] }

    // Buyer approves an invoice / confirms delivery — thin wrapper over the
    // canonical stage machine (advances along IF_NEXT_STAGE; credit debits when
    // the invoice leaves buyer approval).
    case 'APPROVE_INVOICE': {
      const { id, actor } = action.payload
      const collection = state.invoiceFinance.some(c => c.id === id) ? 'invoiceFinance' : 'pendingRequests'
      return applyAdvance(state, collection, id, actor || 'Buyer')
    }

    // Generic canonical advance for any persona/collection.
    case 'ADVANCE_STAGE': {
      const { collection, id, by, toStage } = action.payload
      return applyAdvance(state, collection, id, by, toStage)
    }

    // Generic card patch (e.g. admin pipeline detail edits) against the shared store.
    case 'UPDATE_CARD': {
      const { collection, id, patch } = action.payload
      if (!state[collection]) return state
      return {
        ...state,
        [collection]: state[collection].map(c => (c.id === id ? { ...c, ...patch } : c)),
      }
    }

    // Prepend a new card to a collection (e.g. admin "new onboarding ticket").
    case 'ADD_CARD': {
      const { collection, card } = action.payload
      if (!state[collection]) return state
      return { ...state, [collection]: [card, ...state[collection]] }
    }

    case 'APPEND_AUDIT':
      return { ...state, auditLog: [action.payload, ...state.auditLog] }

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

// Rehydrate demo progress across refreshes; ignore stored state on version bump.
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw)
    if (parsed.__v !== STORAGE_VERSION) return undefined
    const { __v, ...rest } = parsed
    return { ...rest, toasts: [] }
  } catch {
    return undefined
  }
}

let toastSeq = 0

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => loadState() || init)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, __v: STORAGE_VERSION, toasts: [] }))
    } catch { /* storage unavailable — demo still works in-memory */ }
  }, [state])

  const addToast = (message, type = 'success') => {
    const id = `${Date.now()}-${toastSeq++}`
    dispatch({ type: 'ADD_TOAST', payload: { id, message, type } })
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 3500)
  }

  // Ad-hoc audit logging for components (stage advances log themselves).
  const addAudit = (entry) => dispatch({ type: 'APPEND_AUDIT', payload: auditEntry(entry) })

  return (
    <AppCtx.Provider value={{ state, dispatch, addToast, addAudit }}>
      {children}
    </AppCtx.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

// ── Selectors ──────────────────────────────────────────────────────────────

// Live credit picture for a buyer: committed `used`, in-flight `pending`
// (requests awaiting/under buyer action), and what's genuinely `available`.
export function selectCreditSummary(state, buyerId) {
  const buyer = state.buyers.find(b => b.id === buyerId)
  const limit = buyer?.creditLimit || 0
  const used = buyer?.creditUsed || 0
  const PENDING_STAGES = new Set(['if_new_invoice', 'if_buyer_approval', 'if_delivery_notice'])
  const pending = [...state.invoiceFinance, ...state.pendingRequests]
    .filter(c => c.buyerId === buyerId && PENDING_STAGES.has(c.stage))
    .reduce((sum, c) => sum + (c.amount || 0), 0)
  const available = Math.max(0, limit - used - pending)
  const pct = limit > 0 ? Math.round((used / limit) * 100) : 0
  const pendingPct = limit > 0 ? Math.round((pending / limit) * 100) : 0
  return { limit, used, pending, available, pct, pendingPct, buyer }
}
