# Yumna — UX Remediation & Improvement Plan

> Companion to [YUMNA_UX_HEURISTIC_EVALUATION.md](YUMNA_UX_HEURISTIC_EVALUATION.md).
> Turns the evaluation's findings into a sequenced, file-level implementation
> plan. Phases are ordered by trust impact: **P0** makes the platform behave
> like a real connected system, **P1** closes the inspection gap, **P2** fixes
> consistency/robustness, **P3** is polish. Created 2026-06-11.

---

## 0. Guiding principle

Almost every finding traces back to **one root cause**: state is scattered
across a dead legacy reducer, static mock arrays imported directly into
components, and throwaway local `useState`. The mock data is already rich
(`correspondence`, `documents`, credit fields) — **most of this work is wiring,
not new features.** So the plan front-loads a single state unification that
makes the rest small.

**Definition of done for the whole effort:** an action taken as one persona
(buyer approves an invoice) is visible — with a toast, an updated status, and a
changed credit figure — to that persona *and* to the admin, and survives tab
switches and persona switches.

---

## P0 — Make the platform feel real *(trust)*

### P0.1 — Unify the state model  *(resolves L1, L2; root cause)*
**Problem:** `AppContext` has a linear-demo reducer (`liveData`, `requests`,
`SUBMIT/ADMIN_DECIDE/BUYER_CONFIRM/DISBURSE/BUYER_REPAY`, persona `notes`) that
the real screens never use. Screens instead import `INVOICE_FINANCE_CARDS`,
`DIRECT_FINANCE_CARDS`, `PIPELINE_CARDS`, `REPAYMENTS_CARDS`, `MOCK_BUYERS`,
`MOCK_SELLERS` directly and mutate local state.

**Solution — make context the single source of truth:**
1. Seed collections into `initialState` in
   [src/context/AppContext.jsx](src/context/AppContext.jsx):
   ```js
   invoiceFinance: INVOICE_FINANCE_CARDS,
   directFinance:  DIRECT_FINANCE_CARDS,
   pipeline:       PIPELINE_CARDS,
   repayments:     REPAYMENTS_CARDS,
   buyers:         MOCK_BUYERS,
   sellers:        MOCK_SELLERS,
   // keep: pendingRequests, notifications
   ```
2. Add a generic reducer action plus domain actions:
   ```js
   UPDATE_CARD        // { collection, id, patch }  – shallow merge
   ADVANCE_STAGE      // { collection, id, stage, note }  – sets stage + appends correspondence
   APPROVE_INVOICE    // { id, actor }  – advances stage AND debits buyer credit (see P0.3)
   CONFIRM_DELIVERY   // { id, actor }
   ```
   Each appends a `{ from, message, time, autoRead:true }` entry to the card's
   `correspondence` so the timeline is real, not local.
3. Expose thin selector hooks from the provider to avoid prop-drilling and
   direct imports:
   `useBuyerCards(userId)`, `useSellerCards(userId)`, `useCreditSummary(buyerId)`.
4. **Migrate components off static imports** — Buyer/Seller/Admin read
   `state.invoiceFinance` etc. via selectors. Retire the per-component
   `actioned` maps and the optimistic-only `onCardUpdate` path in
   [src/pages/admin/Pipeline.jsx](src/pages/admin/Pipeline.jsx) so admin stage
   moves also flow through `dispatch`.

**Files:** `AppContext.jsx` (core), `BuyerApp.jsx`, `SellerApp.jsx`,
`AdminApp.jsx`, `Pipeline.jsx`, `FinanceRequestsPipeline.jsx`,
`RepaymentsPipeline.jsx`.

**Incremental path (low risk):** land the new state + actions first while
leaving old reducer cases in place; migrate one screen at a time (Buyer →
Seller → Admin); delete the legacy reducer cases + `notes` last.

### P0.2 — Toast + status advancement on every action  *(resolves L2)*
**Problem:** Buyer "Approve Invoice"/"Confirm Delivery" only sets local
`actioned`; no toast, badge unchanged, lost on unmount.

**Solution:** Replace the local handler in
[src/pages/buyer/BuyerApp.jsx](src/pages/buyer/BuyerApp.jsx) (`OverviewTab` ~L409
and `FinanceRequestsTab` ~L576) with:
```js
const { dispatch, addToast } = useApp()
const handleApprove = (card) => {
  dispatch({ type: 'APPROVE_INVOICE', payload: { id: card.id, actor: user.name } })
  addToast(`Invoice ${card.invoiceNumber} approved`, 'success')
}
```
Because the card now lives in context, its badge advances
(`if_buyer_approval → if_disbursement` = "Being Funded") and it **stays in the
list** with the new status — directly answering "I can't tell what changed."
Apply the same to delivery confirmation and to seller-side actions where they
exist.

### P0.3 — Live credit: debit / restore / pending  *(resolves F2)*
**Problem:** `creditLimit`/`creditUsed` are constants; "how much is this
consuming from my pending credit?" is unanswerable.

**Solution:**
1. On `APPROVE_INVOICE` / disburse: `buyer.creditUsed += card.amount`.
   On repay: `creditUsed -= amount`.
2. Add a `useCreditSummary(buyerId)` selector returning
   `{ limit, used, pending, available }` where **pending** = Σ amounts of that
   buyer's cards in actionable/in-flight stages (`if_buyer_approval`,
   `if_delivery_notice`, `if_disbursement`).
3. Surface it: update the Buyer Overview "Available Credit" bar
   ([BuyerApp.jsx](src/pages/buyer/BuyerApp.jsx#L327)) to show a third segment
   for **pending**, and add a per-request "credit impact" line in the detail
   drawer (P1.4): _"Uses SAR X — N% of your SAR Y available. Available after
   approval: SAR Z."_

---

## P1 — Close the inspection gap

### P1.4 — Ticket detail drawer (Buyer + Seller)  *(resolves F1)*
**Problem:** No drill-down anywhere in buyer/seller; can't see timeline,
counterparty, documents, or credit impact.

**Solution — new `src/components/RequestDetailDrawer.jsx`**, a right-side
slide-over copying the `ProfilePanel` shell
([BuyerApp.jsx:648](src/pages/buyer/BuyerApp.jsx#L648)). Sections:
1. Header — invoice no., counterparty (`seller` for buyer view / `buyer` for
   seller view) · sector · tenure, `fmt(amount)`, status badge.
2. **Credit impact** (buyer only) — bar + caption from `useCreditSummary`.
3. Stage tracker — reuse the horizontal tracker markup
   ([BuyerApp.jsx:544](src/pages/buyer/BuyerApp.jsx#L544)).
4. Documents — list from `card.documents` with status pills.
5. **Activity timeline** — build from `card.correspondence`, reusing the
   `groupByDay` + vertical-line + "Latest" marker pattern from the admin
   `ChatterPanel` ([Pipeline.jsx:258](src/pages/admin/Pipeline.jsx#L258)).
6. Footer action — Approve / Confirm (buyer, when actionable) → P0.2 handlers.

**Wiring:** make request cards and `InvoiceRow` clickable
(`setOpenCard(card)`); add an optional `onClick` to
[src/components/InvoiceRow.jsx](src/components/InvoiceRow.jsx) and
`e.stopPropagation()` on its inner action button. Seller passes no
`creditImpact` and no action (read-only).

### P1.5 — One notification model  *(resolves C2)*
**Problem:** `state.notifications` (recipient-keyed, used by bells) vs
`state.notes` (persona-keyed, only legacy reducer writes). Admin bell counts
the near-dead `notes` channel.

**Solution:** Standardise on `notifications` with `{ recipientId, recipientRole }`.
Have all domain actions (P0) emit `notifications` entries. Update the admin bell
in [AdminApp.jsx:136](src/pages/admin/AdminApp.jsx#L136) to count
`state.notifications` filtered by the current admin's role/recipient. Delete
`state.notes` and its reducer branches.

---

## P2 — Consistency & robustness

### P2.6 — Resolve the routing mismatch  *(resolves C4)*
`BrowserRouter` is mounted and `AdminApp` calls `navigate('/')`, but no
`<Route>`s exist; navigation is `phase`/`activeSection` state.
**Recommendation (prototype):** remove `react-router-dom` —
[src/App.jsx](src/App.jsx) drops `BrowserRouter`, and `AdminApp` replaces
`navigate('/')` with `onSignOut()`/a no-op. *(Alternative, heavier: introduce
real routes + URL-synced sections; only worth it if deep-linking/refresh-
persistence is a goal — if so, pair with localStorage persistence below.)*

### P2.7 — Normalise persona ↔ record IDs  *(resolves C5)*
**Problem:** mixed `buyerId === id` vs `buyer === name`; some cards have
`buyerId: null` (e.g. `INV-001`). Cards can surface for the wrong/no persona.
**Solution:** in [src/data/mockData.js](src/data/mockData.js) give every card a
valid `buyerId`/`sellerId`; replace all name-based matches with ID-based in
Buyer/Seller selectors. Add a dev-time assertion that flags any card whose
`buyerId`/`sellerId` doesn't resolve.

### P2.8 — Standardise interaction patterns  *(resolves C4)*
- Unify action verbs: one label per action class ("Approve Invoice",
  "Confirm Delivery") across Overview list, Finance Requests, and drawer.
- Unify the profile surface: Admin uses a centered modal
  ([AdminApp.jsx:348](src/pages/admin/AdminApp.jsx#L348)) while Buyer/Seller use
  a slide-over. Extract one shared `ProfilePanel` (slide-over) and use it in all
  three.

---

## P3 — Accessibility & polish

- **A1 — Overlays:** add a shared `useDismissable({ onClose })` hook providing
  Esc-to-close + focus trap + restore-focus, and apply to
  `RequestDetailDrawer`, `ProfilePanel`, `NewRequestModal`, all modals.
- **A2 — States:** richer empty states (icon + one-line + primary CTA) replacing
  the bare grey lines; simple skeletons on first paint; a generic failure toast
  path for actions.
- **D1 — Help:** small `<InfoTip>` popover for MDR, tenure, risk score, credit
  tier, "delivery notice."
- **§4.6 cleanups:** remove the unused `USERS` import in
  [AppContext.jsx:2](src/context/AppContext.jsx#L2); make `addToast` ids
  collision-proof (`crypto.randomUUID()` or an incrementing ref instead of
  `Date.now()`).

---

## Other necessary / recommended changes (beyond the eval)

1. **Shared primitives to kill duplication:**
   - `Drawer` primitive (backdrop + slide-over + P3 a11y) — `ProfilePanel`,
     `RequestDetailDrawer`, and modals all reimplement this.
   - `formatSAR` / `formatShort` util — `fmt`/`fmtShort` are copy-pasted in
     `BuyerApp.jsx` and `SellerApp.jsx`; move to `src/lib/format.js`.
   - Stage metadata module — stage→label→badge maps are redefined per file
     (`STAGE_BADGE`, `IF_STAGE_MAP`, `DF_STAGE_MAP`); centralise in
     `src/data/stages.js`.
2. **Demo-state persistence (optional but high-value):** persist the reducer to
   `localStorage` so a refresh keeps demo progress instead of bouncing to
   Welcome → Login. Pairs naturally with P2.6 if routes are added.
3. **Onboarding reachability (C1):** stop force-firing `COMPLETE_ONBOARDING` in
   `handleSwitch` ([AuthGate.jsx:127](src/pages/auth/AuthGate.jsx#L127)); gate it
   so the wizard is reachable, or add a "Reset onboarding" dev control.
4. **Badge integrity (C3):** recompute sidebar badges from the unified context
   collections + per-card actioned state so counts match the lists.

---

## Suggested sequencing & checkpoints

| Step | Work | Verifies |
|------|------|----------|
| 1 | P0.1 state scaffold (collections + actions + selectors), no UI change | nothing breaks; old screens still render |
| 2 | P0.2 + P0.3 buyer actions → dispatch, toast, credit | approve moves badge, fires toast, credit drops; survives tab switch |
| 3 | P1.4 detail drawer (buyer, then seller) | timeline/docs/credit-impact visible; action works from drawer |
| 4 | P1.5 notifications unify + P2.7 IDs | admin sees buyer's action; no mis-filed cards |
| 5 | P2.6 routing + P2.8 patterns + P3 a11y/polish | back/refresh sane; Esc closes; consistent verbs |
| 6 | Shared primitives + persistence + onboarding/badges | dedup, refresh-persistence, reachable wizard |

## End-to-end verification
1. `npm run dev`; **Buyer (Ahmed)** → Finance Requests → open `INV-002` →
   drawer shows seller, amount, **credit impact**, timeline.
2. Click **Approve Invoice** → toast appears; badge → "Being Funded"; Available
   Credit bar drops and a **pending** segment updates; switch tabs → state holds.
3. Switch to **Admin** → the same invoice reflects the buyer's approval in its
   pipeline/timeline (cross-persona propagation).
4. Refresh the page → demo state persists (if persistence shipped); Esc closes
   the drawer; no console key warnings from toasts.
5. **Seller (Khalid)** → open a request → drawer shows buyer/amount/timeline,
   **no** credit section, **no** action button.
