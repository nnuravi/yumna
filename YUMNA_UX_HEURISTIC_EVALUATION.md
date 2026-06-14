# Yumna — UX Heuristic Evaluation & Logic Analysis

> Senior UX review of the Yumna prototype (React 19 + Vite + Tailwind 4),
> covering the three persona apps (Buyer, Seller, Admin), the auth/welcome
> flow, and the underlying state model. Conducted 2026-06-10.
>
> **This document is the deliverable.** It currently lives in the plan-mode
> scratch file; copy it to the repo as `YUMNA_UX_HEURISTIC_EVALUATION.md`.

---

## 1. Method & Scope

- **Framework:** Nielsen's 10 usability heuristics, supplemented by a dedicated
  logic / state-integrity pass (prototypes fail more on broken state than on
  pixels).
- **Severity scale:** `0` none · `1` cosmetic · `2` minor · `3` major ·
  `4` catastrophic (blocks the core task or corrupts trust in the data).
- **Surfaces reviewed:**
  - Buyer app — `src/pages/buyer/BuyerApp.jsx` (Overview, Finance Requests, Sellers, Transactions, Profile).
  - Seller app — `src/pages/seller/SellerApp.jsx` (Overview, Buyers, Finance Requests, Transactions, New Request, Invite).
  - Admin app — `src/pages/admin/AdminApp.jsx` + `Pipeline`, `FinanceRequestsPipeline`, `RepaymentsPipeline`, `SellersSection`, `BuyersSection`, `CorrespondenceCenter`, `TaskManager`, `Templates`.
  - Auth — `src/pages/auth/AuthGate.jsx`, `LoginScreen`, `WelcomeScreen`.
  - State — `src/context/AppContext.jsx`, `src/data/mockData.js`.

---

## 2. Executive Summary

The prototype is visually mature and consistent — the design system (rail
sidebar, pill nav, soft shadows, stage trackers, chatter timelines) is
cohesive and credible. The risks are **behavioural and architectural**, not
aesthetic:

1. **The app runs on two state systems that don't talk to each other.** A
   legacy linear-demo reducer (`liveData`/`requests`) sits unused alongside the
   real data path (`pendingRequests` + static mock arrays + local component
   state). Cross-persona cause-and-effect is therefore an illusion.
2. **User actions are cosmetic and ephemeral.** Approvals/confirmations live in
   throwaway local state, give no toast, don't move the card's status, and
   never touch credit figures — so users "can't tell what changed."
3. **There is no drill-down.** Every list is a dead end; you cannot open a
   ticket to see its timeline, counterparty, documents, or credit impact.

| ID | Finding | Heuristic | Severity |
|----|---------|-----------|:--------:|
| L1 | Dual, disconnected state systems (legacy reducer vs. live mock data) | H1 Match real world | **4** |
| L2 | Actions don't persist, don't toast, don't update status or credit | H1 Visibility | **3** |
| F1 | No detail view for any buyer/seller ticket (timeline, seller, credit impact) | H7 Flexibility | **3** |
| F2 | Credit never decrements — "consumption / pending credit" is invisible | H1 Visibility | **3** |
| C1 | Persona switcher force-completes onboarding, hiding the wizard | H3 User control | **2** |
| C2 | Two parallel notification models (`notifications` vs `notes`) can disagree | H4 Consistency | **2** |
| C3 | Sidebar badge counts read static arrays, ignore runtime state | H1 Visibility | **2** |
| C4 | Router mounted but unused; back button / deep links break the model | H4 Consistency | **2** |
| C5 | Fragile ID matching (`buyerId` vs `buyer` name; some `buyerId: null`) | H5 Error prevention | **2** |
| A1 | No Esc-close / focus trap / keyboard support on drawers & custom buttons | Accessibility | **2** |
| A2 | Thin empty / loading / error states | H9 Error recovery | **2** |
| D1 | No inline help for finance jargon (MDR, tenure, risk score, credit tier) | H10 Help | **1** |

---

## 3. Heuristic Evaluation (Nielsen's 10)

### H1 — Visibility of system status  ·  worst severity: 4
- **L2 (3):** Buyer "Approve Invoice" / "Confirm Delivery" only calls
  `setActioned(a => ({ ...a, [card.id]: true }))` (`BuyerApp.jsx` ~L409, L576).
  No toast, the status badge stays "Action Required", and on tab switch the
  component unmounts and the action is forgotten.
- **F2 (3):** `creditUsed` is a static field in `MOCK_BUYERS`; approving an
  invoice never changes available credit, so the user's explicit question —
  "how much is this consuming from my pending credit?" — is unanswerable in-UI.
- **Good:** Stage trackers, "Action Required" banners, `daysInStage`/TAT chips,
  and the admin chatter "Latest" marker are strong status signals.
- **Recommend:** Every state-changing action should (a) fire `addToast(...)`,
  (b) advance the card's `stage`/badge, (c) adjust the relevant credit/pending
  figure, and (d) persist to context so it survives navigation.

### H2 — Match between system and the real world  ·  severity: 4 (logic, see §4)
- **L1:** The mental model the UI implies — seller submits → admin decides →
  buyer confirms → disburse → repay — exists in the reducer
  (`SUBMIT`/`ADMIN_DECIDE`/`BUYER_CONFIRM`/`DISBURSE`/`BUYER_REPAY`) but the
  actual screens don't dispatch those actions. The real world the user
  experiences and the system's model are decoupled. Detailed in §4.

### H3 — User control & freedom  ·  worst severity: 2
- **C1 (2):** `handleSwitch` in `AuthGate.jsx` (L127) always dispatches
  `COMPLETE_ONBOARDING`, so a tester can never reach the buyer/seller
  onboarding wizard through the persona switcher.
- Drawers/modals close on backdrop click (good) but **lack an Esc key handler**
  and a cancel affordance on some flows.
- **Recommend:** Make onboarding reachable (don't force-complete on switch, or
  add a "Reset onboarding" control); add Esc-to-close universally.

### H4 — Consistency & standards  ·  worst severity: 2
- **C2 (2):** Two notification systems coexist — `state.notifications`
  (recipient-keyed, used by the persona bell dropdowns) and `state.notes`
  (persona-keyed, only ever written by the legacy reducer). They can show
  contradictory unread states.
- **C4 (2):** `BrowserRouter` wraps the app and `AdminApp` calls
  `navigate('/')`, yet there are no `<Route>` definitions — navigation is
  `phase` + `activeSection` state. The browser back button and URL don't
  reflect location; deep links are impossible.
- **Inconsistencies:** "Approve" vs "Approve Invoice" vs "Confirm" labels for
  the same class of action; profile is a centered modal in Admin but a
  right-side slide-over in Buyer/Seller.
- **Recommend:** Pick one notification model; either wire real routes or drop
  the router; standardise action verbs and the profile pattern.

### H5 — Error prevention  ·  worst severity: 2
- **C5 (2):** Cards are matched to personas with mixed keys —
  `c.buyerId === user.id || c.buyer === user.name` — while mock data is
  inconsistent (`INV-001` has `buyerId: null`, `buyer: 'Khalid Group'`). Cards
  can surface for the wrong persona or vanish entirely.
- `NewRequestModal` (Seller) submits with light validation; required-field and
  amount-vs-credit-limit guards are thin.
- **Recommend:** Normalise to stable IDs everywhere; validate the request form
  against the buyer's available credit before submit.

### H6 — Recognition rather than recall  ·  severity: 1
- Generally good (icons + labels, stage trackers). Minor: status badge colours
  (amber for both "Buyer Approval" and "Delivery Notice") rely on the label to
  disambiguate.

### H7 — Flexibility & efficiency of use  ·  worst severity: 3
- **F1 (3):** No buyer/seller ticket has a detail/expanded view. Users cannot
  inspect the activity timeline (`card.correspondence` exists in the data!),
  see documents, or understand credit impact without one. This is the gap the
  user raised directly.
- No bulk actions, no keyboard shortcuts, no saved filters.
- **Recommend:** Add a ticket detail drawer (data is already present:
  `correspondence`, `documents`, `seller`, `amount`, `tenure`). Reuse the
  admin `ChatterPanel` timeline and the `ProfilePanel` slide-over shell.

### H8 — Aesthetic & minimalist design  ·  severity: 1
- Strong overall. Watch density on the admin detail pages (Pipeline detail
  carries 20+ local state vars and many stage-conditional sections) — risk of
  overwhelming first-time reviewers.

### H9 — Help users recognise, diagnose, recover from errors  ·  worst severity: 2
- **A2 (2):** Empty states are single grey lines ("No finance requests yet");
  no loading skeletons; no error/failed-state handling (e.g., login error is
  handled, but data flows have no failure path).
- Login error copy is clear and well-placed (good).
- **Recommend:** Add richer empty states with a primary CTA, and at least a
  generic error/toast path for failed actions.

### H10 — Help & documentation  ·  severity: 1
- **D1 (1):** Finance-specific terms (MDR rate, tenure, risk score, credit
  tier, "delivery notice") appear with no tooltips or glossary. New users —
  especially buyers/sellers — must infer meaning.
- **Recommend:** Add hover tooltips / info popovers on financial terms.

---

## 4. Logic & State-Architecture Analysis

This is the most important section: the prototype's biggest risk is that it
*looks* like a connected multi-sided platform but isn't.

### 4.1 Two parallel state worlds
`AppContext.jsx` defines a **linear-demo reducer**:
- State: `liveStatus`, `liveData`, `requests`, `adminDecision`,
  `buyerConfirmed`, `disbursed`, `buyerPaid`, `notes{seller,buyer,admin}`.
- Actions: `SUBMIT → ADMIN_DECIDE → BUYER_CONFIRM → DISBURSE → BUYER_REPAY`,
  each appending persona-scoped `notes`.

The **actual apps** ignore almost all of it. They read static arrays
(`INVOICE_FINANCE_CARDS`, `DIRECT_FINANCE_CARDS`, `PIPELINE_CARDS`,
`REPAYMENTS_CARDS`, `MOCK_BUYERS`) plus `state.pendingRequests` (written only by
`ADD_FINANCE_REQUEST` from the seller's New Request modal), and otherwise keep
truth in **local component state** (`actioned`, `docStatuses`, `creditDecision`,
`timeline`, …).

**Consequence:** a buyer approving an invoice, an admin advancing a stage, or a
disbursement in one screen produces **no observable effect anywhere else**.
Cross-persona storytelling (the whole point of a 3-sided demo) breaks the
moment a reviewer switches personas to "see the other side."

### 4.2 Actions are ephemeral and side-effect-free
- Buyer/Seller approvals → local `actioned` map (lost on unmount).
- Admin stage moves → local `timeline`/`cardStage` + an optimistic
  `onCardUpdate?.(...)` that bubbles to the parent list but **not** to context,
  so it doesn't survive a section switch and isn't visible to other personas.
- Credit figures (`creditLimit`/`creditUsed`) are constants — never debited on
  approval/disbursement nor restored on repayment (despite the reducer's
  `BUYER_REPAY` note claiming "your credit limit has been restored").

### 4.3 Notification duplication
`state.notifications` (recipient-keyed, real array used by bells) vs
`state.notes` (persona-keyed, only the legacy reducer writes it). New runtime
notifications go through `SEND_NOTIFICATION`/`ADD_FINANCE_REQUEST`; the `notes`
channel is effectively dead, yet `AdminApp` still counts
`state.notes.admin.filter(n => !n.read)` for its bell badge — a number that
rarely moves.

### 4.4 Badge / count integrity
Sidebar badges (`financeRequestsBadge`, `repaymentsBadge`, `pipelineBadge`) are
derived from **static** mock arrays and admin role filters, ignoring runtime
`pendingRequests` and per-card "actioned" state. Counts drift from what the
user actually sees in the list.

### 4.5 Routing mismatch
`BrowserRouter` is mounted and `AdminApp` calls `navigate('/')` on a missing
user, but no routes are declared. Navigation is entirely state-driven, so:
- The URL never changes; refresh always returns to Welcome → Login.
- The browser back button doesn't undo in-app navigation.

### 4.6 Minor
- `AppContext.jsx` imports `USERS` but never uses it (dead import).
- `addToast` keys toasts by `Date.now()`; two toasts in the same millisecond
  collide on `id` (React key warning + early dismissal).

---

## 5. Persona-Specific Notes

**Buyer** — The most under-served persona relative to its importance. It is the
approver and the credit-bearer, yet has the weakest feedback (no detail, no
toast, no live credit). Fixing H1/F1/F2 here yields the highest ROI.

**Seller** — Cleanest flows (New Request modal + Invite both correctly use
`addToast`). Main gap: request cards are read-only with no drill-down; "Awaiting
Yumna Review" is the only status nuance.

**Admin** — Richest and most polished (role-gated nav, pipelines, chatter
timelines, Yumnai panel). Risks are density and the optimistic-but-non-persisted
`onCardUpdate` path. The chatter timeline component here is the reuse candidate
for buyer/seller detail views.

---

## 6. Prioritised Remediation Roadmap

**P0 — Make the platform feel real (trust)**
1. Unify state: route all status changes through context (extend the reducer or
   replace the legacy one) so actions persist and cross personas. *(L1, L2)*
2. Add toasts + status/badge advancement to every buyer/seller action. *(L2)*
3. Debit/restore buyer credit on approve/disburse/repay; surface "pending vs
   available credit." *(F2)*

**P1 — Close the inspection gap**
4. Ticket detail drawer for buyer & seller (timeline from `correspondence`,
   counterparty, documents, credit impact). Reuse `ChatterPanel` +
   `ProfilePanel` patterns. *(F1)*
5. Single notification model; fix the admin bell count source. *(C2)*

**P2 — Consistency & robustness**
6. Decide on routing (wire routes or remove router). *(C4)*
7. Normalise persona↔record ID matching. *(C5)*
8. Standardise action verbs and the profile pattern. *(C4)*

**P3 — Polish**
9. Esc-close + focus traps + keyboard support on overlays. *(A1)*
10. Richer empty/loading/error states. *(A2)*
11. Tooltips/glossary for financial terms. *(D1)*
12. Remove dead `USERS` import; harden toast id generation. *(§4.6)*

---

## 7. What's Genuinely Strong (keep)
- Cohesive, modern design system; confident use of motion and the floating rail.
- Admin pipelines with stage progress, chatter timelines, and role-gating.
- Persona switcher as a demo affordance.
- Seller flows that already model the right feedback (toasts on submit/invite).
- Mock data is rich enough (`correspondence`, `documents`, credit fields) that
  most fixes are wiring, not new data.
