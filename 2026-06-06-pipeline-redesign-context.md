# Pipeline Redesign — Session Context (2026-06-06)

All changes from this session were reverted at the user's request. This document preserves full context so the work can be resumed cleanly.

---

## What Was Built

A two-pipeline architecture replacing the single `Pipeline.jsx` (1,973 lines):

| New file | Purpose |
|---|---|
| `src/pages/admin/OnboardingPipeline.jsx` | 8-stage kanban (Sales → Active) with full card detail + stage action panels |
| `src/pages/admin/RepaymentsPipeline.jsx` | 6-stage kanban (Active → Closed) with installment schedule + escalation panels |
| `src/pages/admin/pipeline/shared.jsx` | Shared utilities: `Section`, `Field`, `LaneActions`, `ChatterPanel`, `buildOnboardingTimeline`, `buildRepaymentsTimeline` |

### Modified files
- `src/data/mockData.js` — added `ONBOARDING_STAGES`, `REPAYMENTS_STAGES`, `ONBOARDING_CARDS` (9 cards), `REPAYMENTS_CARDS` (6 cards), routing helpers (`deriveRoutingPath`, `deriveDocumentTier`, `getDocumentChecklist`)
- `src/pages/admin/AdminApp.jsx` — replaced `pipeline` nav with `onboarding` + `repayments` nav items
- `src/pages/admin/YumiPanel.jsx` — replaced `PIPELINE_CARDS` import with `ONBOARDING_CARDS + REPAYMENTS_CARDS`

---

## Architecture Decisions

### Two independent pipelines

**Pipeline 1 — Onboarding** (`account_mgr`, `verifier`, `credit`, `legal`, `super`)
```
Sales → Document Check → Credit Review* → Credit Assessment* → Legal (Issuance) → Legal (Verification) → Onboarding → Active
```
*Credit stages skipped for merchant_only routing (amount = 0)

**Pipeline 2 — Repayments** (`collections`, `legal`, `super`)
```
Active → Overdue → Escalation L1 → Escalation L2 → Escalation L3 → Closed
```

### Ticket types

| Type | `clientType` | Amount | Routing Path | Stages |
|---|---|---|---|---|
| Buyer — Standard | `buyer` | < SAR 50K | `standard` | All 8 stages |
| Buyer — Full | `buyer` | ≥ SAR 50K | `full` | All 8 stages (+ SIMAH docs) |
| Merchant | `merchant` | 0 | `merchant_only` | Skip credit_review + credit_assessment |
| Repayment Record | — | any | — | 6 repayments stages |

### Role–stage mapping

```js
// Onboarding
account_mgr → ['sales', 'onboarding']
verifier    → ['doc_check']
credit      → ['credit_review', 'credit_assessment']
legal       → ['legal_issuance', 'legal_verification']
super       → all stages (read + act)

// Repayments
collections → ['rp_active', 'rp_overdue', 'rp_escalation_l1']
legal       → ['rp_escalation_l2', 'rp_escalation_l3']
super       → all stages
```

---

## Data Schemas

### ONBOARDING_CARDS fields

```js
{
  id,                      // 'OB-001' … 'OB-009'
  clientType,              // 'buyer' | 'merchant'
  financeRequestAmount,    // SAR number; 0 = merchant-only
  documentTier,            // 0 | 1 | 2 (derived from routingPath)
  routingPath,             // 'merchant_only' | 'standard' | 'full'
  guaranteeLevel,          // null | 'promissory_note' | 'pn_institutional' | 'pn_full'
  creditAssessmentOutcome, // null | 'rejected' | 'approved_pn' | 'approved_pn_inst' | 'approved_full' | 'returned'
  assessedAmount,          // null or SAR number
  stage,                   // one of ONBOARDING_STAGES ids
  daysInStage,
  seller, sellerId,
  buyer, buyerId,
  amount, mdrRate,
  sector, tenure, emiFrequency,
  assignedTo,
  activatedBy, activatedAt,  // set at 'active' stage
  contracts,       // [{ id, name, status, addedBy, addedAt }]
  documents,       // [{ name, status }]  status: 'verified'|'pending'|'missing'
  correspondence,  // [{ from, message, time, autoRead }]
  yumiSuggestion,  // { action, message, draftText }
}
```

### REPAYMENTS_CARDS fields

```js
{
  id,                   // 'RP-001' … 'RP-006'
  buyer, buyerId,
  merchant, merchantId,
  disbursementDate,
  totalCreditLimit, availableCredit,
  numInstallments, emiFrequency, emiAmount, primaryEmail,
  feeModel,             // 'merchant_full' | 'split_50_50' | 'buyer_full'
  buyerFees, merchantFees, yumnaIncome,
  totalAmount, repaidAmount, totalOutstanding, balanceDue,
  stage,                // one of REPAYMENTS_STAGES ids
  daysInStage,
  assignedTo,
  closedBy, closedAt, closureType,  // set at 'rp_closed'
  installmentSchedule:  [{ no, amount, dueDate, status, lateFee, paymentConfirmation }],
  escalationLog:        [{ level, date, contactedBy, outcome, notes }],
  correspondence,
  yumiSuggestion,
  // NOTE: NO pauseReminders field — explicitly excluded
}
```

### ONBOARDING_STAGES

```js
[
  { id: 'sales',              label: 'Sales',               assignedRole: 'account_mgr' },
  { id: 'doc_check',          label: 'Document Check',       assignedRole: 'verifier'    },
  { id: 'credit_review',      label: 'Credit Review',        assignedRole: 'credit'      },
  { id: 'credit_assessment',  label: 'Credit Assessment',    assignedRole: 'credit'      },
  { id: 'legal_issuance',     label: 'Legal (Issuance)',     assignedRole: 'legal'       },
  { id: 'legal_verification', label: 'Legal (Verification)', assignedRole: 'legal'       },
  { id: 'onboarding',         label: 'Onboarding',           assignedRole: 'account_mgr' },
  { id: 'active',             label: 'Active',               assignedRole: null, terminal: true },
]
```

### REPAYMENTS_STAGES

```js
[
  { id: 'rp_active',        label: 'Active',          assignedRole: 'collections' },
  { id: 'rp_overdue',       label: 'Overdue',         assignedRole: 'collections' },
  { id: 'rp_escalation_l1', label: 'Escalation L1',   assignedRole: 'collections' },
  { id: 'rp_escalation_l2', label: 'Escalation L2',   assignedRole: 'legal'       },
  { id: 'rp_escalation_l3', label: 'Escalation L3',   assignedRole: 'legal'       },
  { id: 'rp_closed',        label: 'Closed',           assignedRole: null, terminal: true },
]
```

### Routing helpers (add to mockData.js)

```js
export function deriveRoutingPath(amount) {
  if (amount === 0)       return 'merchant_only'
  if (amount < 50000)     return 'standard'
  return 'full'
}
export function deriveDocumentTier(routingPath) {
  if (routingPath === 'merchant_only') return 0
  if (routingPath === 'standard')      return 1
  return 2
}
export function getDocumentChecklist(tier) {
  const base = ['Commercial Registration', 'Nafath Verification', 'IBAN Verification']
  if (tier === 0) return base
  if (tier === 1) return [...base, 'Sales Ledger (6 months)', 'Bank Account Documents']
  return [...base, 'SIMAH Consent', 'Last 4 Quarters VAT Returns', '2-Year Financial Statements']
}
```

---

## Stage-by-Stage Action Panel Specs

### Onboarding Pipeline

#### Sales (`account_mgr`)
- Editable: Finance Request Amount (SAR), Client Type (Buyer/Merchant)
- Derived read-only: Routing Path badge
- AI document completeness checker: `getDocumentChecklist(tier)` — each doc with status badge
- Actions: "Send Document Request →", "Confirm Receipt & Advance" (gated: all docs received)

#### Document Check (`verifier`)
- Click-to-cycle document status: pending → verified → missing
- 3 AI panels: Validity Date Check / Name Unification / IBAN Extraction (each with override toggle)
- Manual verification toggle (officer name + timestamp)
- "Clear KYC — Advance" (gated: all verified + manual toggle) → routes to `credit_review` or `legal_issuance` (merchant_only)
- "Return to Sales — Missing Documents" (requires note)

#### Credit Review (`credit`)
- Binary 5-item checklist (all must be checked to pass)
- Notes field (optional pass, required fail)
- "Pass — Forward to Credit Assessment" / "Fail — Return to Sales"

#### Credit Assessment (`credit`)
- 5-outcome radio: Rejected / Approved-PN / Approved-PN+Inst / Approved-Full / Return for More Info
- On approval: Guarantee Level selector + Assessed Amount input
- "Submit Decision" → routes to `legal_issuance` (or back to `sales` on reject/return)

#### Legal Issuance (`legal`)
- Shows: client name, guarantee level badge, approved amount
- Contract template selector (dropdown)
- Guarantee documents required list (derived from `guaranteeLevel`)
- "Send to Client →" → shows sent timestamp + "Awaiting return" status
- After send: "Document Received — Advance to Verification →"

#### Legal Verification (`legal`)
- Uploaded signed contracts list
- 3-item verification checklist
- Notes field
- "Approve — Advance to Onboarding" (gated: all 3 checked)
- "Reject — Return for Re-signing" (requires notes)

#### Onboarding (`account_mgr`)
- 3-item checklist: Account created / Client can sign in / Credit limit assigned (inline SAR input)
- "Activate Client →" (gated: all 3 checked + credit limit entered)

#### Active (terminal, read-only)
- "Client is Active" banner with activation date + activated by
- "View Repayment Records →" link (navigates to Repayments pipeline)

---

### Repayments Pipeline

#### rp_active (`collections`)
- Next installment display (highlighted if due ≤ 7 days)
- Log Payment: amount + date → updates installment schedule

#### rp_overdue (`collections`)
- DPD counter (days past due), outstanding balance
- Collections note field
- "Initiate Level 1 Escalation" (gated: note filled)

#### rp_escalation_l1 (`collections`)
- L1 badge, days overdue, balance due
- Call log: entries with date / outcome / notes; "Add Call Entry" form
- L1 outcome options: Answered–Promised / Answered–Disputed / No answer / Voicemail
- "Escalate to L2 — Legal" (gated: ≥1 call log entry)
- "Resolved — Return to Active"

#### rp_escalation_l2 (`legal`)
- L2 badge, collapsible L1 history
- Legal team call log (same structure, different outcomes)
- L2 outcome options: Agreed to pay / Disputing / Unresponsive / Partial payment received
- "Escalate to L3 — Lawyer" / "Resolved — Return to Active"

#### rp_escalation_l3 (`legal`)
- L3 badge, collapsible L1 + L2 history
- Promissory Note Panel (read-only guarantee level display)
- Execution checklist: PN served / Court filing initiated
- "Close — Resolved" / "Close — Written Off" (requires reason) → both move to `rp_closed`

#### rp_closed (terminal, read-only)
- Resolution type badge (Resolved / Written Off), closure date + closed by, final amounts

---

## New Ticket Intake Form (planned, not yet built)

A `NewTicketModal` was planned but not implemented before revert. Plan is saved at:
`/Users/vishnukr/.claude/plans/effervescent-yawning-petal.md`

Summary of the plan:
- "+ New Ticket" button in pipeline board header (visible to `account_mgr` + `super` only)
- 4-step modal following the `BizOverview.jsx` DetailModal pattern
  - Step 1: Client Type + Contact (name, email, phone)
  - Step 2: Business Details (CR, city, sector, MDR rate, linked seller)
  - Step 3: Finance Details — amount, tenure, EMI frequency; auto-skipped for merchants
  - Step 4: Assignment + Review summary
- On submit: card created at `sales` stage, documents pre-populated as `pending` from `getDocumentChecklist(tier)`
- Only change needed: `OnboardingPipeline.jsx` + import `MOCK_SELLERS` from mockData

---

## Implementation Notes

- **Card state is local** — `useState(ONBOARDING_CARDS)` in each pipeline component. Edits reset on nav switch. AppContext lift (Phase 6) would fix this but wasn't done.
- **Skipped stages** — shown on stage bar as strikethrough/dashed border for merchant_only routing
- **No seller shown in escalation** — buyer is solely responsible for collections
- **No pause reminders** — explicitly excluded from Repayments pipeline
- **PIPELINE_CARDS + PIPELINE_STAGES** kept as deprecated aliases in mockData.js to avoid breaking anything

---

## Files to Recreate

When resuming, recreate in this order:
1. Update `src/data/mockData.js` — add routing helpers + ONBOARDING_STAGES + REPAYMENTS_STAGES + ONBOARDING_CARDS + REPAYMENTS_CARDS
2. Update `src/pages/admin/AdminApp.jsx` — replace `pipeline` nav with `onboarding` + `repayments`
3. Create `src/pages/admin/pipeline/shared.jsx` — shared utilities
4. Create `src/pages/admin/OnboardingPipeline.jsx` — 1,357 lines
5. Create `src/pages/admin/RepaymentsPipeline.jsx` — 1,123 lines
6. Update `src/pages/admin/YumiPanel.jsx` — swap PIPELINE_CARDS for ONBOARDING_CARDS + REPAYMENTS_CARDS

Reference files available in git at commit `a77f0b2` (the state before today's session).
