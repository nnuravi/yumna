# Yumna Platform — User Flows & Product Guide

> **Prototype version · June 2026**
> Yumna is a SAMA-regulated B2B trade credit and invoice financing platform for the Kingdom of Saudi Arabia. It connects wholesale **sellers** (distributors) with retail **buyers**, enabling instant payment to sellers via short-term credit on trade invoices.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Personas & Entry Points](#2-personas--entry-points)
3. [Seller Flows](#3-seller-flows)
   - [3.1 New Seller Onboarding](#31-new-seller-onboarding)
   - [3.2 Existing Seller Dashboard](#32-existing-seller-dashboard)
   - [3.3 Create a Finance Request](#33-create-a-finance-request)
4. [Buyer Flows](#4-buyer-flows)
   - [4.1 Buyer Dashboard](#41-buyer-dashboard)
   - [4.2 Delivery Confirmation & MDR Consent](#42-delivery-confirmation--mdr-consent)
5. [Admin Flows](#5-admin-flows)
   - [5.1 Admin Dashboard Layout](#51-admin-dashboard-layout)
   - [5.2 Business Overview](#52-business-overview)
   - [5.3 Finance Request Pipeline (Kanban)](#53-finance-request-pipeline-kanban)
   - [5.4 Repayments Pipeline](#54-repayments-pipeline)
   - [5.5 Sellers Section](#55-sellers-section)
   - [5.6 Buyers Section](#56-buyers-section)
   - [5.7 Task Manager](#57-task-manager)
   - [5.8 Templates](#58-templates)
   - [5.9 Yumi AI Panel](#59-yumi-ai-panel)
6. [End-to-End Transaction Flow](#6-end-to-end-transaction-flow)
7. [Key Concepts & Glossary](#7-key-concepts--glossary)

---

## 1. Platform Overview

Yumna solves a core B2B trade problem: sellers need cash quickly after delivering goods, while buyers need deferred payment terms. Yumna steps in as the financing layer:

- **Seller** submits an invoice for a delivery made to a buyer.
- **Yumna** pays the seller immediately (minus a Merchant Discount Rate fee).
- **Buyer** repays Yumna on agreed installment terms (30–180 days).

The platform is operated by an internal admin team with specialized roles spanning verification, credit scoring, risk, legal, account management, and collections.

---

## 2. Personas & Entry Points

The prototype uses a **persona selector** at `/` (Login screen) — no password required. Personas are split into two experience types.

### Mobile Experiences (simulated on mobile viewport)

| Persona | Name | Description | Entry Route |
|---|---|---|---|
| Seller | Khalid Al-Zahrani | Active wholesaler, Zahrani Trading Co., Jeddah | `/seller` |
| New Seller | Omar Al-Qahtani | First-time onboarding, no account yet | `/seller/onboard` |
| Buyer | Ahmed Al-Otaibi | Retailer, Otaibi Retail Group, Riyadh | `/buyer` |

### Admin Dashboard (web viewport)

| Persona | Name | Role | Scope |
|---|---|---|---|
| Super Admin | Layla Al-Harbi | Head of Operations | Full access to all sections |
| Verifier | Sara Al-Ghamdi | Loan Verification Officer | Doc Collection, Checking Docs stages |
| Credit Mgr | Faisal Al-Dosari | Credit Score Manager | Credit Review stage |
| Risk Analyst | Noura Al-Shehri | Risk & Compliance | Risk Assessment stage |
| Collections | Omar Al-Mutairi | Collections Manager | Repayment, Overdue stages + Repayments pipeline |
| Account Mgr | Rania Al-Sabban | Account Manager | Contract/Agreement, Onboarding stages + Repayments pipeline |
| Legal | Tariq Al-Ghamdi | Legal Counsel | Document Signing stage + Templates + Repayments L2/L3 |

---

## 3. Seller Flows

### 3.1 New Seller Onboarding

**Route:** `/seller/onboard`

The onboarding flow is a multi-phase wizard that takes a new seller from registration to a fully activated account.

---

#### Phase 1 — Application Wizard (3 steps)

**Step 1 · Business Details**

The seller fills in their basic business information:

- Business / Trade Name
- Commercial Registration (CR) Number (10-digit)
- City (Riyadh, Jeddah, Dammam, Mecca, Medina, Khobar, Tabuk, Other)
- Mobile Number (Saudi +966 format)
- Email Address (optional)
- Domain (website / trade domain)

The "Continue" button is locked until Business Name, CR, City, and Phone are filled.

**Step 2 · Document Upload**

Five documents must be uploaded before proceeding (each max 10 MB, PDF/JPG/PNG):

1. Commercial Registration (CR) Certificate
2. Owner ID / Power of Attorney
3. National Address Certificate (issued by Saudi Post / Wasel)
4. VAT Certificate (ZATCA registration)
5. IBAN Letter (bank-issued)

Each document shows a drag-to-upload zone. Once uploaded, a green confirmation row replaces it with the filename. A counter shows `X/5 uploaded`.

**Step 3 · Review**

Displays a summary of all entered details and uploaded document names. A consent notice explains that Yumna will review documents within 4 hours before activating.

Submitting navigates to Phase 2 with a toast: *"Application submitted! Our team will review your documents."*

---

#### Phase 2 — Pending Review

A status tracker shows: **Submitted → Verification → Contract → Activated**

The seller waits for admin review. The screen includes a support link.

**Prototype test controls** allow simulating two outcomes:
- **Simulate Admin Approval** → advances to Phase 3 (Post)
- **Simulate Document Rejection** → enters the Correction sub-state

**Correction sub-state:** An amber warning card identifies the rejected document (e.g., *"Commercial Registration — please resubmit a clearer copy"*). The seller uploads a replacement file and taps "Resubmit Document" to return to Pending.

---

#### Phase 3 — Post-Approval: Agreements (2 steps)

An approval banner confirms Yumna approved the application.

**Step 1 · MDR Rate Agreement**

Displays the proposed MDR rate (**2.50%**) with an explainer of how it works. The seller must:
1. Scroll through the full MDR Rate Agreement text (scroll progress unlocks the checkbox)
2. Check *"I have read and agree to the MDR terms"* (bilingual EN/AR)
3. Tap "Continue →"

**Step 2 · Platform & Factoring Agreement**

Displays the full Platform & Factoring Agreement covering services, assignment of receivables, disbursement terms, seller representations, and SAMA compliance. The seller must:
1. Scroll through the contract (scroll progress unlocks the checkbox)
2. Check *"I have read and agree to the Platform Agreement"* (bilingual EN/AR)
3. Tap "Sign & Activate" → triggers OTP flow

**OTP Verification**

A 6-digit numeric OTP is sent to the seller's registered mobile. The input auto-advances between digit fields. On successful entry, the account is activated.

---

#### Phase 4 — Done / Celebration Screen

A confetti animation plays. The seller sees:

- **Account Summary**: Business name, CR number, Account ID, MDR Rate (2.50%), Activation date
- **What's next**: Three-step guide (add buyers → create first request → track disbursements)
- **Add Buyers prompt**: A CTA to open the bulk Buyer Import Sheet immediately, or skip to the dashboard

---

### 3.2 Existing Seller Dashboard

**Route:** `/seller`

The seller app has three bottom-tab navigation items: **Home**, **Money**, and **Alerts**.

If a user logs in with `onboardingStatus: 'new'` or `'pending'`, they are automatically redirected to `/seller/onboard`.

---

#### Home Tab

The home screen uses an immersive dark-on-light split layout.

**Hero section (dark):**
- Arabic greeting with the seller's first name
- "RECEIVED CREDIT" label with toggle to hide balance
- Large SAR balance (total value of active finance requests)
- "Incoming" badge showing funds pending disbursement (approved requests)
- Two primary action buttons:
  - **New Request** → navigates to `/seller/invoice`
  - **Invite Buyer** → opens the AddBuyerSheet overlay
- A secondary "…" overflow button

**Metrics grid (2×2):**

| Metric | Description |
|---|---|
| Active Requests | Count of requests not yet repaid or denied |
| Cash Incoming | Total SAR value of approved (pending disbursement) requests |
| Volume (MTD) | Month-to-date financed volume from Zahrani Trading |
| MDR Cost (MTD) | Total MDR fees paid this month at the seller's rate |

**Recent Requests carousel:**

A horizontally scrollable list of the 5 most recent finance requests. Each card shows:
- Status badge (APPROVED, SUBMITTED, DISBURSED, DELIVERING, REPAID, DENIED)
- SAR amount
- Finance Request ID (e.g., FR-0038)
- Buyer name
- Submission date

Tapping "See All" switches to the Money tab.

**Buyer Credit section:**

A vertical list of all buyers sorted by credit utilization (highest first). Each row shows:
- Buyer initials avatar (turns red if utilization >80%)
- Buyer name, city, transaction count
- Utilization percentage (turns red if >80%)
- Credit limit
- A horizontal utilization bar

**Recent Alerts feed:**

Latest 3 notifications with type-specific icons:
- Green check: disbursement events
- Amber triangle: credit limit warnings
- Purple check: approvals

---

#### Money Tab

Full list of all finance requests. Shows the complete history including repaid and denied requests.

---

#### Alerts Tab

Full notification feed for the seller account, including disbursements, credit warnings, and approval events. Unread notifications show a red badge on the bottom nav icon.

---

### 3.3 Create a Finance Request

**Route:** `/seller/invoice`

A 4-step wizard to submit a new invoice for financing. Minimum invoice value is SAR 10,000.

---

**Step 1 · Invoice Details**

- **Select Buyer**: Search box to filter by name or CR number. Shows a list of buyers with their credit limit and CR. Buyers are selected by tapping. If no buyer is found, a "No buyer found" empty state offers an "Invite Buyer" CTA which opens the AddBuyerSheet overlay.
- **PO Reference**: Free-text field for the purchase order number.
- **Invoice Amount (excl. VAT)**: Numeric input with SAR prefix. Validated at minimum SAR 10,000. VAT (15%) is automatically calculated. An Invoice Summary card shows Amount, VAT, and Total.
- **Invoice Document**: Optional upload (PDF/JPG/PNG, max 10 MB).

**Step 2 · Credit Terms**

- **Credit Tenure**: Button grid to select 30 / 60 / 90 / 120 / 180 days.
- **Buyer Credit Check**: Shows the buyer's available credit limit vs the invoice total. A progress bar shows current utilization. Displays "Sufficient credit limit" (green) or "Credit limit exceeded" (red).
- **Due Date Preview**: Calculates and shows the repayment due date.

**Step 3 · MDR Configuration**

Three MDR scenarios to choose from:

| Scenario | Label | Description |
|---|---|---|
| A (default) | Seller Covers MDR | Buyer pays only the invoice amount. Seller absorbs the 2.5% MDR cost. |
| B | Buyer Covers MDR | Buyer is charged the full MDR on top of the invoice value. |
| C | Split MDR | MDR is shared at a custom ratio (slider: 10–90% increments). |

A **Payout Preview** card shows: Invoice Total, MDR deduction, and Net payout to the seller.

**Step 4 · Review & Sign**

A summary card showing: Buyer, PO Reference, Invoice Total, Tenure, MDR Scenario, Uploaded document name, and Net payout.

A consent notice explains OTP authorization. Tapping "Sign & Submit" triggers the OTP entry screen.

**OTP Verification**

6-digit OTP to the buyer's phone (for delivery confirmation). On confirmed entry, the finance request is created (FR-XXXX), a toast notification fires, and the user is redirected to `/seller/status`.

---

## 4. Buyer Flows

### 4.1 Buyer Dashboard

**Route:** `/buyer`

The buyer app has four bottom tabs: **Home**, **Payments**, **Sellers**, and **Alerts**.

---

#### Home Tab

**Notification banners**: Unread alerts appear as inline banners at the top with a pulsing dot.

**Outstanding Balance hero card (dark):**
- Total outstanding balance across all invoices
- Invoice count and next due date
- "Pay Now" and "Schedule" buttons (navigate to Payments tab)

**Credit Tier card:**
- Displays the buyer's tier (Bronze / Silver / Gold / Platinum) based on transaction history
- Tier requirements shown (e.g., "3+ tx · 6+ months" for Silver)
- Horizontal tier progress track

| Tier | Level | Requirement |
|---|---|---|
| Bronze | 1 | New account |
| Silver | 2 | 3+ transactions, 6+ months |
| Gold | 3 | 6+ transactions, 12+ months |
| Platinum | 4 | 10+ transactions, 24+ months |

**Live Finance Request card (conditional):**

If the seller has submitted a new invoice that is in-progress, a card appears with:
- Pulsing "New Invoice" label
- Finance Request ID and seller name
- Status-specific action:
  - `approved` → Red "Confirm Delivery →" button → navigates to `/buyer/mdr-consent`
  - `delivery_confirmed` → "Disbursing…" indicator
  - `disbursed` → "Due in X days" label

**Quick Stats grid (2×2):**
- Available Credit (with progress bar)
- Transactions (paid vs active count)

---

#### Payments Tab

List of the buyer's invoices with statuses: `due_soon`, `overdue`, `paid`. Shows installment progress.

---

#### Sellers Tab

List of sellers in the buyer's credit circle.

---

#### Alerts Tab

Notification feed for the buyer. Red badge on tab icon when unread alerts exist.

---

### 4.2 Delivery Confirmation & MDR Consent

**Route:** `/buyer/mdr-consent`

This flow is triggered when a buyer taps "Confirm Delivery →" on an approved invoice. It confirms that goods have been received and (if applicable) consents to the buyer paying part or all of the MDR fee.

The flow only shows the full 3-screen consent experience if the MDR scenario is B or C (buyer pays). For scenario A (seller pays), the flow is simplified.

**Screen 1 · MDR Notice**

- Invoice summary card (ID, seller, total value)
- Warning banner explaining that the seller has requested the buyer cover (or split) the financing fee
- CTA: "Review Fee Breakdown →"

**Screen 2 · Fee Breakdown**

Three stacked cards:
1. **Invoice Summary**: Invoice value (excl. VAT), VAT (15%), Total Invoice Value
2. **MDR Charge Details**: MDR Rate (2.5%), MDR Amount, and which party pays what portion
3. **Your Repayment Summary** (highlighted box): Invoice principal, buyer's MDR share, **Total You Repay**, Repayment Due date, Credit Tenure

- CTA: "Proceed to Agreement →"

**Screen 3 · Consent Agreement**

Full MDR Consent Agreement legal text in a scrollable container. The buyer must:
1. Scroll to at least 85% of the document (progress bar fills to unlock checkbox)
2. Check *"I have read and agree to the terms"* (bilingual EN/AR)
3. Tap "Sign & Confirm →"

Can tap "I do not accept — Return to Invoice" at any point to decline (shows a confirmation dialog and, if confirmed, cancels the FR and notifies the seller).

**Screen 4 · OTP Verification**

6-digit OTP to the buyer's registered mobile. 45-second countdown with resend option. On successful entry, dispatches delivery confirmation to the system.

**Screen 5 · Success**

Confirmation card showing: Invoice ID, Seller, Total to Repay, Due Date, Signed timestamp. Options to download the signed PDF agreement and return to the invoices list.

---

## 5. Admin Flows

### 5.1 Admin Dashboard Layout

**Route:** `/admin`

The admin portal is a full-screen web application with three main zones:

**Left Sidebar (collapsible)**
- Yumna logo and "Internal Portal" label
- Role-filtered navigation with badge counts
- User name, title, and avatar at the bottom
- Collapse/expand toggle button

**Top Bar**
- Current section title
- Language toggle (EN/AR)
- Notifications bell with unread count badge
- **Yumna. AI toggle** (✦ Yumna. AI) — opens/closes the AI panel
- **Switch User** — returns to persona selector

**Main Content Area**
Full-width panel that renders the active section.

**Yumi AI Panel** (right-side slide-in)
Context-aware AI assistant, visible when Yumi is toggled on.

---

#### Role-Based Navigation

| Section | Super | Verifier | Credit | Risk | Collections | Account Mgr | Legal |
|---|---|---|---|---|---|---|---|
| Overview | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Pipeline | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Repayments | ✓ | — | — | — | ✓ | ✓ | ✓ |
| Sellers | ✓ | ✓ | ✓ | — | — | ✓ | — |
| Buyers | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Task Manager | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Templates | ✓ | — | — | — | — | — | ✓ |

Badge counts on nav items:
- **Pipeline**: number of cards assigned to the current user (or all cards for super admin)
- **Repayments**: number of active repayment cards in the user's role stages
- **Task Manager**: number of open tasks assigned to the current user

---

### 5.2 Business Overview

The overview dashboard (`overview` section) provides a top-level business performance snapshot across four analytical views:

**Sales Metrics**
- Total orders (105), installments (576), buyers (48), merchants (17)
- Disbursement volume, portfolio value, total collected, total outstanding
- Monthly disbursement bar chart
- Sector breakdown by amount and by order count (ICT 69%, Consumer Staples 18.9%, Manufacturing 4.8%, etc.)
- Top 10 customers by volume

**Installments**
- Total repaid vs target
- Amount to collect outstanding
- Status pie charts (Paid 92.7%, Overdue 4.8%, Pending 2.5%)
- Installment count distribution
- Outstanding amount by customer

**Credit**
- Total clients, total credit limit (SAR 7.78M)
- Approval rate breakdown (Approve 73.3%, Reject 23.8%, Pending 2.9%)
- Full Credit vs Sales Ledger classification
- Recent credit applications table with ID, client, type, limit, status, SIMAH score

**Risk**
- High-risk count (14), flagged today (3), average risk score (38), overdue ratio (7.3%)
- Risk score distribution (Low 62, Medium 25, High 14)
- Flagged buyers with scores, issues, and status
- Risk trend chart (Jan–May)

**Team Performance**
Each role has a card showing:
- Average TAT vs target TAT (with over-target warning)
- Current queue count
- Key metric (approvals today, approval rate, escalations, collection rate)
- Status: on-track / over / at-risk

---

### 5.3 Finance Request Pipeline (Kanban)

The Pipeline is a Kanban board showing all active finance requests moving through Yumna's internal processing stages.

---

#### Pipeline Stages

Stages are grouped by department:

| Stage ID | Display Label | Assigned Role | Department |
|---|---|---|---|
| `submitted` | Doc Collection | Verifier | SALES |
| `kyc` | Checking Docs | Verifier | SALES |
| `credit_score` | Credit Review | Credit | CREDIT |
| `risk` | Risk Assessment | Risk | CREDIT |
| `legal` | Document Signing | Legal | LEGAL |
| `approved` | Contract / Agreement | Account Mgr | SALES |
| `disbursed` | Onboarding | Account Mgr | OPS |
| `repayment` | Repayment | Collections | OPS |
| `overdue` | Rejected by Credit | Collections | CREDIT |
| `closed` | Closed | — | — |

Each stage is a vertical column. Cards in stages outside the current user's role are visible but dimmed (super admin sees all with full color).

---

#### Finance Request Cards (Kanban tiles)

Each card in the Kanban shows:
- Finance Request ID (e.g., FR-0041)
- Type badge: `onboarding` or `invoice_finance`
- Buyer name and seller name
- SAR amount
- Days in current stage
- Risk score (color-coded: Low <30, Medium 30–60, High 60+) — only shown after Risk Assessment stage is complete
- Assigned team member

Clicking a card opens the **Detail Panel** (right-side drawer).

---

#### Card Detail Panel

Clicking any Kanban card opens a right-side detail panel. The panel always shows the same structural sections (Customer Info, Finance Terms, Documents, Yumna. AI Suggestion, Correspondence), but the **available actions and expected tasks differ by stage**.

---

**Shared sections (present on every card)**

*Customer / Basic Info*
- Buyer name, contact person, email, phone, website
- Business type (LLC, Establishment, Partnership)
- Expected annual revenue
- Seller name
- Transaction type (onboarding or invoice finance)
- Created date and by whom

*Finance Terms*
- Amount, tenure, EMI frequency
- MDR rate
- Risk score (only shown after Risk Assessment stage is complete)
- Sector
- Stage and days in stage
- Assigned team member

*Documents Checklist*
Shows each required document and its status:
- `verified` — green check
- `pending` — grey dash
- `missing` — red dash

Document requirements vary by type and amount:
- Base: CR, Tax Certificate, National Address
- Buyer (any amount): + Sales Ledger, Manager Bank Account
- Buyer (≥SAR 50K): + SIMAH Credit Report, Tax Returns, Financial Statements

*Yumna. AI Suggestion*
A contextual recommendation card with:
- Action type (request_document, score, escalate, generate_invoice, suggest_template, monitor)
- Explanation message
- Optional pre-drafted email text ready to send

*Correspondence / Timeline*
A chronological log mixing:
- System history events (submission, intake check, assignment, stage moves)
- Team correspondence messages (who said what and when)
- Payment events (for repayment/overdue stages)

Messages are tagged as auto (AI/system) or manual (team member), with read indicators. A compose area at the bottom allows sending new notes or emails, with a mode toggle between "Note" and "Email".

---

**Stage 1 · Doc Collection (`submitted`) — Sales**

This is where a new ticket is created. The verifier's tasks in this card are:

- Create the ticket and fill in client information: contact name, email, requested finance amount, and other basic details.
- Upload any documents already received from the client.
- Review the documents checklist — if any required documents are missing, trigger a document request.
- Once all required documents are confirmed present, mark receipt complete and advance the card to the next stage (Checking Docs).

> **Yumna. AI Actions — `request_document`**
> Yumna. AI scans the documents checklist automatically on card creation. If any items are missing or still pending, it surfaces a suggestion: *"This is a new submission. KYC documents are incomplete. I can send an onboarding document checklist to the client immediately."*
> It pre-drafts a complete outreach message listing every missing item (e.g., Nafath verification, bank statements, CR confirmation) so the team can send with one click. Once documents are fully received, Yumna. AI clears the suggestion and prompts the team to advance the card.

---

**Stage 2 · Checking Docs (`kyc`) — Sales**

Yumna. AI performs all document verification automatically. The verifier does not need to check anything manually — their only active task is to contact the client when Yumna. AI has flagged a problem.

**What the verifier sees in this card:**

The card presents a full document review panel with two things visible for every submitted document:

1. **The document itself** — each file is viewable directly within the card. The verifier can open and read the full document without leaving the panel.
2. **The check result** — each document has an inline status showing what Yumna. AI found: pass, flagged, or missing. For any flagged document, the exact discrepancy is displayed beneath the document name — for example:
   - *"Name on VAT certificate: 'Al-Rashid Co.' — does not match CR name: 'Al-Rashid Trading Co.'"*
   - *"CR certificate expiry date: 2026-03-01 — document is expired"*
   - *"IBAN format invalid — letter uploaded but IBAN could not be extracted"*

The verifier reads the document and the discrepancy note side by side, understands exactly what needs to be corrected, and then contacts the client.

> **Yumna. AI Actions — automated verification**
> Yumna. AI runs all checks as soon as the card enters this stage:
>
> - **Validity dates** — checks expiry dates on the CR, Tax certificate, and National Address certificate. Flags expired or near-expiry documents.
> - **Name consistency** — compares the business and owner name across all documents against the CR record. Flags any mismatch, showing the exact value found on each document.
> - **IBAN extraction** — reads and records the IBAN from the bank letter. Flags if missing, unreadable, or invalid format.
>
> Yumna. AI does **not** flag missing documents at this stage. Missing documents should have been collected and resolved in Stage 1 (Doc Collection). If a document is still absent at this point, Yumna. AI will only surface a missing-document alert if an admin or the responsible user explicitly requests it.
>
> **If no discrepancies are found:** Yumna. AI automatically advances the card to **Credit Review**. No verifier action needed.
>
> **If discrepancies are found:** Yumna. AI holds the card and flags each issue inline next to the relevant document. The verifier reviews the document and the specific discrepancy note, then sends a communication or calls the client to get the corrected information. Once the client resubmits, Yumna. AI re-runs all checks automatically.

---

**Stage 3 · Credit Review (`credit_score`) — Credit**

The credit manager evaluates the case. This stage is only actioned when the requested finance amount is greater than zero. Tasks in this card:

- Review the case using the credit team's internal scoring process (SIMAH pull, utilization ratios, payment history).
- Return one of the following outcomes:
  - **Rejected** — with a written reason recorded on the card.
  - **Approved — Promissory Note only** — basic credit approval.
  - **Approved — Promissory Note + Institutional Guarantee** — moderate-risk approval requiring a guarantor.
  - **Approved — Promissory Note + Institutional Guarantee + Assignment of Rights** — highest-level approval with full security package.
  - **Request more information / additional documents** — the card is reassigned back to the Sales/Verifier team to collect the outstanding items before credit can be finalised.

> **Yumna. AI Actions — `score`**
> By the time a card reaches this stage, all documents have already been verified and cleared by Yumna. AI in Stage 2 — missing documents cannot occur here. Yumna. AI surfaces: *"All documents are in order. SIMAH pull is pending. I can initiate the credit scoring sequence now."* It triggers the SIMAH data pull, populates the credit score field on the card, and flags utilisation ratios for the credit manager to review.

---

**Stage 4 · Risk Assessment (`risk`) — Risk**

The risk analyst reviews the scored case and makes a final risk determination before it proceeds to legal. Tasks in this card:

- Review the credit score, utilisation ratio, and sector context.
- Identify any document gaps that would block the risk assessment.
- Approve or flag the case for further review.
- Advance to Document Signing once the risk assessment is cleared.

> **Yumna. AI Actions — `score`**
> Yumna. AI surfaces the credit score, utilisation ratios, and sector context to help the analyst make their determination. It notes when all inputs are present and the case is ready to proceed.
>
> Yumna. AI does **not** proactively flag missing documents at this stage. If the risk analyst identifies a gap, they must explicitly request Yumna. AI to draft a document request — it will not surface one automatically.

---

**Stage 5 · Document Signing (`legal`) — Legal (Contract Issuance)**

The legal team prepares and sends the contractual documents. Tasks in this card:

- Select the correct contract template based on the credit outcome, sector, and amount.
- Issue and send the contract to the client for signing.
- Send the required guarantee documents based on the credit outcome (promissory note, institutional guarantee letter, assignment of rights deed — one, two, or all three depending on the credit decision).

> **Yumna. AI Actions — `suggest_template`**
> Yumna. AI reads the transaction's sector, amount, and tenure and matches it against the Templates library. It surfaces: *"Based on this transaction ([sector], SAR [amount], [tenure]-day tenure), I suggest applying [Template Name]. Would you like me to generate the agreement?"* The team can accept the suggestion and generate the contract directly from the card, or browse the templates library manually to override.

---

**Stage 6 · Contract / Agreement (`approved`) — Legal (Contract Return) / Account Mgr**

The legal team verifies the returned signed documents, then the account manager triggers disbursement. Tasks in this card:

- Confirm that the signed contract has been returned by the client.
- Check that the returned documents are correct, complete, and clearly legible.
- Upload the signed contract to the card.
- Upload one, two, or three signed guarantee documents depending on the credit requirement.
- Hand off to the Account Manager once all signed documents are validated.

> **Yumna. AI Actions — `generate_invoice`**
> Once all approvals and signed documents are in place, Yumna. AI surfaces: *"All approvals are in place. I can generate the invoice for this transaction now. Choose who pays the MDR."* It prompts the team to confirm the MDR scenario (seller / buyer / split) and then generates the invoice ready for disbursement. This is the trigger point for the buyer's delivery confirmation and MDR consent flow.

---

**Stage 7 · Onboarding (`disbursed`) — Account Mgr**

The account manager finalises the client's activation. Tasks in this card:

- Confirm that all steps (KYC, credit, legal) are fully completed.
- Ensure the client is able to sign in to the platform.
- Assign the approved credit limit to the client's account.
- Mark the client as ready to launch — the account is now live and the client can begin placing orders on credit.

> **Yumna. AI Actions — `monitor`**
> After disbursement is processed, Yumna. AI confirms the net disbursement amount sent to the seller's IBAN and states the expected repayment date: *"Disbursement complete. SAR [amount] repayment expected from [buyer] on [date]. I will send installment reminders automatically."* No further action is required from the team unless the buyer misses a payment.

---

**Stage 8 · Repayment (`repayment`) — Collections**

Collections monitors the active repayment schedule. Tasks in this card:

- Review the installment structure and schedule (number of installments, frequency, amounts, due dates).
- Send payment notifications and reminders ahead of each due date.
- Track paid vs unpaid installment status in real time.
- If a payment is missed, move the card to the Overdue stage and initiate escalation.

> **Yumna. AI Actions — `monitor`**
> Yumna. AI tracks each installment due date and automatically sends pre-emptive reminders to the buyer before each one falls due. It logs buyer acknowledgements and surfaces a status summary: *"Repayment is on track. Installment [X] of [Y] is due on [date]. I have already sent a pre-emptive reminder and received acknowledgement."* No manual action is needed unless a payment is missed.

---

**Stage 9 · Overdue & Escalation (`overdue` / Repayments pipeline) — Collections → Legal**

When a buyer misses payments, the collections process escalates through three levels. Each level is logged in the card's escalation log with date, contact, outcome, and notes.

- **Level 1 — Soft Follow-Up (Collections):** System sends an automated reminder. Collections officer makes a soft follow-up call. Outcomes logged: no answer, voicemail, answered and promised payment, or payment received.
- **Level 2 — Firm Legal Follow-Up (Legal/Operations):** Legal team contacts the buyer with a firmer tone via registered letter or formal call. The dispute is documented. Outcomes logged: disputing, unresponsive, partial resolution.
- **Level 3 — Lawyer Engagement (Legal):** The case is escalated to an external lawyer for execution of the promissory note or enforcement of the guarantee. Outcomes: in progress, resolved, or written-off. The card is then closed.

> **Yumna. AI Actions by escalation level**
>
> **Overdue / L1 — `escalate`:**
> When the promised payment deadline passes with no payment, Yumna. AI flags the account: *"This account is [X] days overdue and the promised payment deadline has passed. I recommend escalating to a formal notice."* It pre-drafts a formal overdue notice addressed to the buyer — ready to send or edit before dispatch.
>
> **L1 in progress — `follow_up`:**
> If L1 has had one unanswered contact attempt, Yumna. AI advises: *"[Buyer] has had one unanswered call. Log a second attempt before escalating to L2 — legal involvement is premature at this stage."* It holds escalation until the minimum contact threshold is met.
>
> **L2 — `escalate`:**
> If disputes remain unresolved after L2 contact, Yumna. AI recommends: *"Buyer disputes are unresolved after L2 contact. Consider escalating to L3 if no payment or agreement is reached this week."* It pre-drafts a formal legal demand letter with a 7-day payment ultimatum, referencing the signed Framework Agreement.
>
> **L3 — `close`:**
> Once L3 (lawyer engagement) is underway, Yumna. AI surfaces: *"This account is at maximum escalation. Complete the execution checklist and close as resolved or written-off once the lawyer confirms the outcome."* No further automated actions are taken — closure is a manual decision by the legal team.

---

#### Lane-Level Yumi Actions

Each stage column header has a "✦" button that opens a **Lane Actions popover** with three bulk actions:
- **Auto-chase missing documents** — Yumi messages all buyers in the lane with incomplete docs
- **Flag stale cards (>3 days)** — marks cards overdue for review
- **Auto-assign unassigned cards** — distributes based on team capacity

---

#### New Ticket Modal

A "New Ticket" button at the top of the Pipeline creates a new finance request card, providing a quick way for admins to manually open a case.

---

### 5.4 Repayments Pipeline

A second Kanban board dedicated to post-disbursement repayment management.

**Repayment Stages**

| Stage | Label | Handled By |
|---|---|---|
| `rp_active` | Active | Collections |
| `rp_overdue` | Overdue | Collections |
| `rp_escalation_l1` | Escalation L1 | Collections |
| `rp_escalation_l2` | Escalation L2 | Legal |
| `rp_escalation_l3` | Escalation L3 | Legal |
| `rp_closed` | Closed | — |

Role visibility:
- **Collections** sees: Active, Overdue, Escalation L1
- **Legal** sees: Escalation L2, Escalation L3
- **Super Admin / Account Mgr** see all stages

---

**Repayment Card Detail**

Each repayment card contains:

**Summary header:**
- Buyer name, merchant name
- Disbursement date
- Total credit limit, available credit
- Number of installments, EMI frequency, EMI amount

**Fee Model** — who pays MDR:
- `merchant_full` — seller absorbs full MDR
- `split_50_50` — buyer and seller each pay 50%
- `buyer_full` — buyer pays full MDR

**Financial Summary:**
- Total amount, repaid amount, total outstanding, current balance due
- Buyer fees, merchant fees, Yumna income

**Installment Schedule:**
A table of all installments with number, amount, due date, status (paid / overdue / pending), late fee, and payment confirmation reference.

**Escalation Log:**
Chronological record of each escalation contact attempt with level, date, contacted by, outcome (no_answer, answered_promised, voicemail, disputing, in_progress), and notes.

**Correspondence:**
Team messages and system events.

**Yumna. AI Suggestion:**
Action recommendation with optional pre-drafted message. The specific action and draft text depend on which repayment stage the card is in (see below).

---

**Escalation Flow & Yumna. AI Actions per Repayment Stage**

When a buyer defaults, escalation moves through three levels. Yumna. AI provides a specific action and recommendation at each stage:

| Stage | Yumna. AI Action | What it does |
|---|---|---|
| `rp_active` | `monitor` | Confirms account is on track. States next instalment due date. No action needed unless a payment is missed. |
| `rp_overdue` | `escalate` | Flags days overdue, recommends initiating L1. Pre-drafts a formal overdue notice to the buyer with account details and outstanding balance. |
| `rp_escalation_l1` | `follow_up` | Advises logging a second contact attempt before escalating to L2 — legal involvement is premature after only one unanswered call. |
| `rp_escalation_l2` | `escalate` | Recommends moving to L3 if disputes remain unresolved this week. Pre-drafts a formal demand letter referencing the signed promissory note and a 7-day payment ultimatum. |
| `rp_escalation_l3` | `close` | Confirms maximum escalation is active. Prompts the legal team to complete the execution checklist and close the account as resolved or written-off once the lawyer confirms the outcome. |
| `rp_closed` | `monitor` | Confirms the account is fully repaid and closed. No further action required. |

Closed stage types: `resolved` (fully repaid) or written-off.

---

### 5.5 Sellers Section

A list view of all onboarded sellers showing:
- Business name, seller name
- CR number, city
- MDR rate
- Volume month-to-date
- Invoice count
- Status (Active / Inactive)

Clicking a seller opens a detail view with full account information.

---

### 5.6 Buyers Section

A list view of all registered buyers showing:
- Name, CR number, city
- Credit limit and current utilization
- Risk tier (Low / Medium / High)
- SIMAH credit score
- Transaction count and volume
- Last transaction date
- Status (Active / Suspended)

Clicking a buyer opens a detail view including credit history, active invoices, and risk flags.

---

### 5.7 Task Manager

A personal task queue showing tasks assigned to the current user.

**Task Properties:**
- Task ID (T-001, T-002, …)
- Title (e.g., "Verify CR for Q Parts Co.")
- Linked Finance Request card (e.g., FR-0047)
- Team assignment (verifier, credit, risk, collections, account_mgr, legal)
- Priority: critical / high / medium / low
- Status: open / in_progress / blocked / pending / done / unassigned
- Due date

**Team capacity:**
Each team member has a `currentLoad` and `maxLoad`. Yumi uses this to suggest auto-assignment.

---

### 5.8 Templates

Visible only to **Super Admin** and **Legal** roles.

A library of legal document templates that can be applied to finance requests. Each template has:
- ID (TPL-001, etc.)
- Name (e.g., "Standard ICT Credit Framework v2.1")
- Type: Framework Agreement / MDR Agreement / Credit Terms
- Conditions (sector, credit type, amount range, tenure range)
- Last updated date and uploaded by
- Status: Active / Draft
- AI-suggested flag (if Yumi recommended it for a specific open transaction)

Yumi can suggest the best-matching template for a card based on sector, amount, and tenure. For example, when the Legal role views FR-0046 (ICT, SAR 185,000, 90-day tenure), Yumi suggests "Standard ICT Credit Framework v2.1."

---

### 5.9 Yumi AI Panel

The Yumi panel is a slide-in sidebar accessible from the top bar across all admin sections.

**Role-specific greetings and focus:**

| Role | Greeting | Focus |
|---|---|---|
| Super Admin | "Good morning, Layla. Here's your business pulse." | Full portfolio overview and team performance |
| Verifier | "Hi Sara! You have new submissions to verify." | KYC document completeness and identity verification |
| Credit | "Good morning, Faisal. 2 applications await credit scoring." | SIMAH scores, credit limits, utilization ratios |
| Risk | "Hi Noura. One card has a missing document that needs your attention." | Risk scores, document gaps, escalation triggers |
| Collections | "Morning Omar. FR-0043 is 20 days overdue — action needed." | Overdue accounts, repayment schedules, collection efficiency |
| Account Mgr | "Hi Rania! FR-0042 is approved and ready for invoice generation." | Invoice generation, client health, disbursement status |
| Legal | "Good morning, Tariq. A new ICT transaction is awaiting your legal review." | Template matching, agreement conditions, compliance terms |

Yumi surfaces context-aware suggestions including:
- Draft communication text ready to send to buyers or sellers
- Document request messages with itemized missing documents
- Escalation notices with formal legal language
- Template recommendations based on transaction characteristics
- Monitoring notes when no action is needed

---

## 6. End-to-End Transaction Flow

The complete lifecycle of a single trade finance transaction across all personas:

```
SELLER                  ADMIN TEAM                      BUYER
  │                         │                              │
  ├─ Creates finance         │                              │
  │  request (4-step         │                              │
  │  wizard, OTP sign)       │                              │
  │                          │                              │
  │                   ┌─────▼──────┐                       │
  │                   │ DOC        │                        │
  │                   │ COLLECTION │ Verifier collects      │
  │                   │ (submitted)│ KYC docs               │
  │                   └─────┬──────┘                       │
  │                          │                              │
  │                   ┌─────▼──────┐                       │
  │                   │ CHECKING   │                        │
  │                   │ DOCS (kyc) │ Verifier validates     │
  │                   └─────┬──────┘ CR, Nafath, docs       │
  │                          │                              │
  │                   ┌─────▼──────┐                       │
  │                   │ CREDIT     │                        │
  │                   │ REVIEW     │ Credit Mgr pulls       │
  │                   └─────┬──────┘ SIMAH, sets limit      │
  │                          │                              │
  │                   ┌─────▼──────┐                       │
  │                   │ RISK       │                        │
  │                   │ ASSESSMENT │ Risk Analyst scores,   │
  │                   └─────┬──────┘ flags concerns         │
  │                          │                              │
  │                   ┌─────▼──────┐                       │
  │                   │ DOCUMENT   │                        │
  │                   │ SIGNING    │ Legal matches template, │
  │                   │ (legal)    │ prepares agreements     │
  │                   └─────┬──────┘                       │
  │                          │                              │
  │                   ┌─────▼──────┐                       │
  │                   │ CONTRACT   │                        │
  │                   │ / AGREEMENT│ Account Mgr generates  │
  │                   │ (approved) │ invoice, confirms MDR  │
  │                   └─────┬──────┘                       │
  │                          │                              │
  │                          │                    ┌────────▼───────┐
  │                          │                    │ BUYER confirms │
  │                          │                    │ delivery       │
  │                          │                    │ + MDR consent  │
  │                          │                    │ + OTP sign     │
  │                          │                    └────────┬───────┘
  │                          │                             │
  │◄─── SAR disbursed ───────┤                             │
  │     (net of MDR)         │                             │
  │                   ┌─────▼──────┐                       │
  │                   │ ONBOARDING │ Account Mgr monitors  │
  │                   │ (disbursed)│ post-disburse          │
  │                   └─────┬──────┘                       │
  │                          │                              │
  │                   ┌─────▼──────┐                       │
  │                   │ REPAYMENT  │ Collections monitors   │
  │                   └─────┬──────┘ installment schedule  │
  │                          │                              │
  │             ┌────────────┼────────────┐                │
  │         On time     Overdue →         │                 │
  │             │       L1 Collections    │                 │
  │             │       L2 Legal          │                 │
  │             │       L3 Lawyer         │                 │
  │             │                         │                 │
  │         ┌──▼──┐                  ┌───▼──┐             │
  │         │CLOSED│                 │CLOSED│             │
  │         │Resolved               │Written-off         │
  └─────────┴──────┘                └──────┘              │
```

**Disbursement calculation:**
> Net payout = Invoice Total (incl. VAT) − MDR portion paid by seller
>
> Where MDR = Invoice Total × 2.5%
>
> Example: SAR 85,000 invoice, Scenario A (seller pays full MDR) → Seller receives SAR 85,000 × 0.975 = **SAR 82,875**

---

## 7. Key Concepts & Glossary

| Term | Definition |
|---|---|
| **MDR** | Merchant Discount Rate — the fee charged by Yumna on each financed invoice (default 2.5%). Can be paid by the seller, buyer, or split. |
| **Finance Request (FR)** | A financing application submitted by a seller for a specific invoice/delivery. Identified as FR-XXXX. |
| **Credit Limit** | The maximum outstanding credit a buyer can have at any time on the Yumna platform, set by the credit team using SIMAH data. |
| **SIMAH** | Saudi Credit Bureau — provides credit reports and scores used in buyer credit assessment. |
| **Nafath** | Saudi national identity verification service used in KYC. |
| **SAMA** | Saudi Central Bank — the regulatory authority. Yumna operates under SAMA regulation. |
| **KYC** | Know Your Customer — the document and identity verification process required before credit is extended. |
| **Tenure** | The repayment period in days (30 / 60 / 90 / 120 / 180). The buyer repays Yumna within this period. |
| **Credit Tier** | A loyalty classification for buyers (Bronze → Silver → Gold → Platinum) earned through transaction history, which may affect credit terms. |
| **OTP** | One-Time Password — used to digitally sign agreements and finance requests via SMS to the registered mobile. |
| **Onboarding (pipeline)** | A pipeline card type for a buyer who is being onboarded by a seller for the first time (as opposed to a repeat invoice_finance transaction). |
| **Repayment (pipeline)** | The stage where an active financed invoice is within its repayment period and installments are being collected. |
| **Yumi** | Yumna's internal AI assistant for admin staff — provides contextual suggestions, drafts communications, and recommends actions. |
| **TAT** | Turnaround Time — how quickly each team processes their queue. Tracked per team with a target. |
| **Sales Ledger** | A credit type where Yumna maintains the buyer's accounts receivable record (vs Full Credit which is a larger facility). |
| **Framework Agreement** | The master legal contract between Yumna and a buyer/seller that governs all transactions on the platform. |
| **IBAN Letter** | A bank-issued letter confirming the seller's IBAN — required for disbursement. |
| **CR (Commercial Registration)** | The official business registration certificate issued by the Ministry of Commerce in Saudi Arabia. |
