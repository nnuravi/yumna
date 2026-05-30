# YUMNA – Trade Credit Platform
## UX Persona Mapping & User Flows · v1.1
**Saudi Arabia · Invoice Financing Platform**

---

## Table of Contents
1. [Platform Overview](#1-platform-overview)
2. [Persona Mapping](#2-persona-mapping)
3. [Core Financing Model](#3-core-financing-model)
4. [MDR Scenarios](#4-mdr-scenarios)
5. [User Flows – Buyer (Retailer)](#5-user-flows--buyer-retailer)
6. [User Flows – Seller (Wholesale Trader)](#6-user-flows--seller-wholesale-trader)
7. [User Flows – Super Admin (Yumna)](#7-user-flows--super-admin-yumna)
8. [Cross-Functional Flow – End-to-End Transaction](#8-cross-functional-flow--end-to-end-transaction)
9. [Agreement & eSign Flows](#9-agreement--esign-flows)
10. [Edge Cases & Error States](#10-edge-cases--error-states)
11. [Notifications & Communication Framework](#11-notifications--communication-framework)
12. [Design Principles & UX Notes](#12-design-principles--ux-notes)
13. [Prototype Screen Inventory](#13-prototype-screen-inventory)
14. [Seller App — Implemented UX](#14-seller-app--implemented-ux)
15. [Buyer App — Implemented UX](#15-buyer-app--implemented-ux)
16. [Admin Dashboard (FOMS) — Implemented UX](#16-admin-dashboard-foms--implemented-ux)
17. [Credit Tier System](#17-credit-tier-system)
18. [Global App State Architecture](#18-global-app-state-architecture)

---

## 1. Platform Overview

**Yumna** is a B2B trade credit and invoice financing platform built for the Saudi Arabian market. It bridges the liquidity gap between wholesale traders (Sellers) and retailers (Buyers) by allowing sellers to offer deferred payment terms backed by Yumna's financing infrastructure.

**Core Value Proposition:**
- Sellers get paid immediately upon buyer confirmation of delivery
- Buyers get credit terms (30/60/90 days) without traditional bank dependency
- Yumna earns through MDR (Merchant Discount Rate) on financed invoices
- Compliant with Saudi Central Bank (SAMA) regulations and VAT requirements

**Regulatory Context (Saudi Arabia):**
- SAMA (Saudi Central Bank) regulated
- eKYC via Nafath / Absher integration
- eSign via Absher OTP or Najm-compliant digital signature
- VAT-inclusive invoicing (15% VAT standard)
- Arabic + English bilingual UI required

---

## 2. Persona Mapping

---

### Persona 1 – BUYER (Retailer)

| Attribute | Detail |
|---|---|
| **Name** | Ahmed Al-Otaibi |
| **Role** | Owner / Procurement Manager, Mid-size Retail Store |
| **Location** | Riyadh, Saudi Arabia |
| **Age** | 32–48 |
| **Business Type** | FMCG retail, electronics retail, or building materials |
| **Tech Literacy** | Moderate – uses WhatsApp Business, basic ERP or paper-based |
| **Language** | Arabic primary, basic English |
| **Annual Turnover** | SAR 2M – SAR 20M |

**Goals:**
- Purchase goods from trusted wholesalers without upfront cash pressure
- Manage cash flow to pay suppliers within 30–90 days
- Track invoices and credit limits in one place
- Avoid complex bank financing paperwork

**Pain Points:**
- Banks require collateral for credit lines
- Wholesalers push for immediate payment, straining cash flow
- Lack of transparency in credit terms
- Fear of hidden charges or MDR costs being pushed onto them

**Motivations:**
- Grow business inventory without liquidity constraints
- Build a digital credit history for future financing
- Simple, Arabic-first mobile experience

**Mental Model:**
> "I just want to order my goods and pay later, like I trust my supplier — but more formally."

---

### Persona 2 – SELLER (Wholesale Trader)

| Attribute | Detail |
|---|---|
| **Name** | Khalid Al-Zahrani |
| **Role** | Sales Director / Owner, Wholesale Distribution Company |
| **Location** | Jeddah / Dammam |
| **Age** | 35–55 |
| **Business Type** | FMCG distributor, electronics wholesaler, construction materials |
| **Tech Literacy** | Moderate-High – uses accounting software (Odoo/Zatca-compliant ERP) |
| **Language** | Arabic primary |
| **Annual Turnover** | SAR 10M – SAR 200M+ |

**Goals:**
- Offer competitive credit terms to retailers without holding receivables
- Get paid immediately after buyer confirms delivery
- Manage multiple buyers and their credit lines on a dashboard
- Reduce collections risk and bad debt

**Pain Points:**
- Tying up working capital in 60-90 day receivables
- Risk of buyer default
- Managing MDR costs — for large invoices, absorbing the full MDR is painful
- Negotiating MDR split with buyers is awkward without a formal mechanism

**Motivations:**
- Accelerate cash cycle
- Scale sales without working capital constraints
- Trust a SAMA-regulated platform over informal credit

**Mental Model:**
> "I'll give credit to grow sales, but I need to get paid now — and I need a proper system to manage who owes what."

---

### Persona 3A – SUPER ADMIN: Loan Verification Officer

| Attribute | Detail |
|---|---|
| **Name** | Sara Al-Ghamdi |
| **Role** | Loan Verification Specialist, Yumna Ops Team |
| **Responsibilities** | KYC verification, document validation, onboarding approval |
| **Tools** | Admin dashboard, Nafath API, document viewer |

**Goals:**
- Verify Buyer/Seller identity documents accurately and quickly
- Approve or reject onboarding requests with clear audit trail
- Escalate suspicious applications to Risk team

**Pain Points:**
- High volume of onboarding requests during growth phases
- Manual document checks are error-prone
- Incomplete submissions cause back-and-forth delays

---

### Persona 3B – SUPER ADMIN: Credit Score Manager

| Attribute | Detail |
|---|---|
| **Name** | Faisal Al-Dosari |
| **Role** | Credit Analyst, Yumna Risk Team |
| **Responsibilities** | Set/update credit limits, monitor buyer creditworthiness, integrate SIMAH scores |
| **Tools** | Credit scoring dashboard, SIMAH API integration, manual override panel |

**Goals:**
- Assign accurate credit limits to buyers at onboarding and during reviews
- Monitor repayment behavior to adjust limits dynamically
- Reduce default exposure

**Pain Points:**
- SIMAH data may be incomplete for small retailers
- Need to balance growth (high limits) vs. risk (defaults)
- No easy way to communicate limit changes to buyers

---

### Persona 3C – SUPER ADMIN: Risk Analyst

| Attribute | Detail |
|---|---|
| **Name** | Noura Al-Shehri |
| **Role** | Risk & Compliance Officer |
| **Responsibilities** | Portfolio risk monitoring, fraud detection, regulatory reporting for SAMA |
| **Tools** | Risk analytics dashboard, transaction monitoring, alert system |

**Goals:**
- Identify high-risk transactions before disbursement
- Monitor concentration risk (single buyer/seller overexposure)
- Ensure SAMA compliance and AML checks

**Pain Points:**
- Fraud patterns evolve quickly in trade finance
- Reconciling data across buyer, seller, and disbursement systems
- Generating SAMA-compliant reports manually

---

### Persona 3D – SUPER ADMIN: Collections Manager

| Attribute | Detail |
|---|---|
| **Name** | Omar Al-Mutairi |
| **Role** | Collections & Recovery Specialist |
| **Responsibilities** | Track overdue invoices, initiate recovery workflows, manage payment plans |
| **Tools** | Collections dashboard, escalation workflows, communication templates |

**Goals:**
- Minimize days past due (DPD) on financed invoices
- Automate reminders and escalation
- Negotiate payment plans for distressed buyers

**Pain Points:**
- Buyers ignore automated reminders
- No structured escalation path beyond phone calls
- Difficulty tracking partial payments across multiple invoices

---

## 3. Core Financing Model

```
PURCHASE ORDER FLOW

Buyer raises PO  ──►  Seller accepts PO
                            │
                            ▼
               Seller creates Invoice on Yumna
                            │
                            ▼
               Yumna reviews & approves invoice
                            │
                            ▼
               Buyer confirms Delivery of Goods
                            │
                            ▼
           Yumna disburses amount to Seller (minus MDR)
                            │
                            ▼
           Buyer repays Yumna within credit tenure
                        (30/60/90 days)
```

**Key Financial Flow:**
- Invoice Value: SAR X
- MDR Rate: e.g., 2.5% (agreed during onboarding or per transaction)
- Seller receives: SAR X minus MDR amount (if seller bears full MDR)
- Buyer repays: SAR X to Yumna at tenure end

---

## 4. MDR Scenarios

### Scenario A – Seller Bears Full MDR (Default)
```
Invoice: SAR 100,000 | MDR: 2.5% = SAR 2,500
Yumna disburses: SAR 97,500 to Seller
Buyer repays: SAR 100,000 to Yumna
Yumna profit: SAR 2,500
```
**UX Trigger:** Standard flow — no additional negotiation step needed.

---

### Scenario B – Buyer Bears Full MDR (Large Invoice Negotiation)
```
Invoice: SAR 1,000,000 | MDR: 2.5% = SAR 25,000
Seller requests Buyer to bear MDR
Buyer reviews MDR request in app → Accepts/Rejects
If Accepted:
  Yumna disburses: SAR 1,000,000 to Seller
  Buyer repays: SAR 1,025,000 to Yumna
```
**UX Trigger:** Seller flags "Request Buyer to Cover MDR" when creating invoice. Buyer gets an in-app notification + MDR breakdown before confirming delivery.

---

### Scenario C – Split MDR (Equal or Custom Split)
```
Invoice: SAR 500,000 | MDR: 2.5% = SAR 12,500
Split: 50/50 → Seller: SAR 6,250 | Buyer: SAR 6,250

Yumna disburses: SAR 493,750 to Seller (deducting Seller's share)
Buyer repays: SAR 506,250 to Yumna (principal + Buyer's MDR share)
```
**UX Trigger:** Seller selects "Split MDR" and chooses split ratio (50/50 or custom %). Buyer sees split terms clearly before accepting delivery confirmation.

---

## 5. User Flows – Buyer (Retailer)

---

### Flow B-1: Onboarding & KYC

```
START
  │
  ▼
Download Yumna App (iOS/Android) or Web
  │
  ▼
Select: "Register as Buyer"
  │
  ▼
Enter Mobile Number (Saudi) → OTP via SMS
  │
  ▼
Nafath / Absher Identity Verification
  │  ├─ National ID (Iqama for expats)
  │  └─ Selfie liveness check
  │
  ▼
Business Details
  │  ├─ Commercial Registration (CR) number
  │  ├─ CR document upload
  │  ├─ VAT registration number
  │  └─ Bank account details (IBAN)
  │
  ▼
eSign: Buyer Framework Agreement (Murabaha/Credit Terms)
  │  └─ OTP-based Absher signature or DocuSign-equivalent
  │
  ▼
Application submitted → Pending Admin Review
  │
  ▼
[Admin: Loan Verification + Credit Score assignment]
  │
  ├─ APPROVED → Credit limit assigned → Buyer dashboard active
  └─ REJECTED → Rejection reason displayed → Re-apply option
```

---

### Flow B-2: Receiving & Confirming an Invoice

```
Seller submits Invoice on Yumna
  │
  ▼
Buyer receives Push Notification + SMS:
"New Invoice #INV-0042 from Khalid Trading – SAR 85,000"
  │
  ▼
Buyer opens Invoice Detail Screen
  │  ├─ Invoice items, quantity, value
  │  ├─ Credit tenure (e.g., 60 days)
  │  ├─ MDR terms (who bears it — Scenario A/B/C)
  │  └─ Repayment date
  │
  ▼
[If MDR Scenario B or C]
  │  ├─ MDR breakdown shown prominently
  │  ├─ "I agree to bear MDR of SAR X" checkbox
  │  └─ eSign / OTP confirmation for MDR acceptance
  │
  ▼
"Confirm Goods Received" CTA
  │  ├─ Optional: Upload delivery note / photo
  │  └─ OTP confirmation
  │
  ▼
Confirmation sent to Yumna → Disbursement triggered
  │
  ▼
Buyer dashboard updated:
  ├─ Outstanding balance: SAR X
  ├─ Due date: [Date]
  └─ Available credit limit: SAR Y (reduced by invoice amount)
```

---

### Flow B-3: Repayment

```
Repayment Due Date – 7 days prior:
  → Push notification + SMS reminder
  │
Repayment Due Date – 1 day prior:
  → Final reminder
  │
  ▼
Buyer opens "Repay" screen
  │  ├─ Outstanding invoices list
  │  ├─ Total due + breakdown
  │  └─ Payment options: SADAD / Bank Transfer / Direct Debit
  │
  ▼
Initiate payment
  │
  ▼
Payment confirmed → Invoice marked PAID
  │  └─ Credit limit restored
  │
[If overdue]
  ├─ Late payment fee applied (if in agreement)
  ├─ Collections workflow triggered (Admin side)
  └─ Credit limit frozen until payment
```

---

### Flow B-4: Credit Limit Review Request

```
Buyer requests credit limit increase
  │
  ▼
Fill request form:
  ├─ Reason for increase
  ├─ Upload: latest bank statements (3 months)
  └─ Business growth evidence
  │
  ▼
Submitted → Credit Score Manager reviews
  │
  ├─ Approved → New limit active
  └─ Rejected → Reason + wait period shown
```

---

## 6. User Flows – Seller (Wholesale Trader)

---

### Flow S-1: Onboarding & KYC

```
START
  │
  ▼
Register as Seller on Yumna Web Dashboard (primary) or App
  │
  ▼
Mobile OTP verification
  │
  ▼
Nafath / Absher Identity Verification (Owner / Authorized Signatory)
  │
  ▼
Business Documentation:
  ├─ Commercial Registration (CR)
  ├─ VAT Certificate
  ├─ Bank IBAN (for disbursements)
  ├─ 6-month bank statements
  └─ Trade references (optional)
  │
  ▼
MDR Rate Agreement:
  ├─ Yumna proposes MDR rate (based on volume/risk)
  └─ Seller reviews and accepts via eSign
  │
  ▼
eSign: Seller Platform Agreement (Factoring / Invoice Discounting Terms)
  │
  ▼
Submitted → Loan Verification review
  │
  ├─ APPROVED → Seller dashboard active (can add buyers, create invoices)
  └─ REJECTED → Reason + document re-upload option
```

---

### Flow S-2: Adding a Buyer

```
Seller opens "My Buyers" section
  │
  ▼
"Add Buyer" → Enter Buyer's:
  ├─ Registered mobile number (must be registered on Yumna)
  └─ OR: Commercial Registration number
  │
  ▼
System checks: Is Buyer registered + credit-approved on Yumna?
  │
  ├─ YES → Buyer linked, credit limit visible to Seller
  └─ NO  → "Invite Buyer" CTA → SMS invite sent to Buyer
  │
  ▼
Buyer accepts seller linkage → Relationship active
```

---

### Flow S-3: Creating & Submitting an Invoice

```
Seller clicks "New Invoice"
  │
  ▼
Step 1 – Invoice Details:
  ├─ Select Buyer
  ├─ Reference PO number
  ├─ Line items (description, qty, unit price)
  ├─ VAT calculation (auto 15%)
  └─ Total invoice value
  │
  ▼
Step 2 – Credit Terms:
  ├─ Select tenure: 30 / 60 / 90 days
  └─ Confirm Buyer has sufficient credit limit
  │
  ▼
Step 3 – MDR Configuration:
  ├─ [Scenario A] Seller bears full MDR → Net payout shown
  ├─ [Scenario B] Request Buyer to bear MDR → Reason field + flag
  └─ [Scenario C] Split MDR → Set split % (e.g. 50/50, 30/70)
  │
  ▼
Step 4 – Review & eSign:
  ├─ Invoice summary
  ├─ Net payout preview (after MDR deduction)
  └─ OTP / eSign to submit
  │
  ▼
Invoice submitted → Yumna Risk Review
  │
  ├─ APPROVED → Invoice sent to Buyer for delivery confirmation
  ├─ ON HOLD  → Risk query raised → Seller notified
  └─ REJECTED → Reason shown → Seller can edit & resubmit
```

---

### Flow S-4: Tracking Disbursement

```
Buyer confirms delivery
  │
  ▼
Seller receives notification:
"Delivery confirmed for INV-0042. Disbursement in process."
  │
  ▼
Yumna processes disbursement (SLA: e.g., same business day or T+1)
  │
  ▼
Funds transferred to Seller IBAN
  │
  ▼
Seller dashboard updated:
  ├─ Invoice status: DISBURSED
  ├─ Amount received: SAR X (net of MDR if Scenario A)
  └─ Downloadable disbursement advice / tax invoice from Yumna
```

---

### Flow S-5: Dispute Raising

```
Seller disputes a transaction (e.g., wrong MDR deducted, wrong amount)
  │
  ▼
Open invoice → "Raise Dispute"
  │
  ▼
Select dispute type:
  ├─ MDR discrepancy
  ├─ Disbursement amount mismatch
  └─ Invoice not processed
  │
  ▼
Add description + upload evidence
  │
  ▼
Submitted → Admin (Risk/Ops) reviews
  │
  ├─ Resolved in Seller's favour → Adjustment made
  └─ Rejected → Admin notes visible to Seller
```

---

## 7. User Flows – Super Admin (Yumna)

> The Super Admin portal is a role-based internal dashboard. Each sub-role (Loan Verification, Credit Score, Risk, Collections) has scoped access.

---

### Flow A-1: Loan Verification – Buyer/Seller Onboarding Review

```
New application alert in queue
  │
  ▼
Open application → Document checklist:
  ├─ CR document ✓/✗
  ├─ Nafath verification result ✓/✗
  ├─ IBAN validation ✓/✗
  ├─ VAT certificate ✓/✗
  └─ Bank statements ✓/✗
  │
  ▼
Run AML / Sanctions screening (automated + manual review)
  │
  ▼
Decision:
  ├─ APPROVE → Pass to Credit Score Manager (for Buyers)
  │            OR Activate Seller account directly
  ├─ REQUEST MORE INFO → Flag specific documents → Notify applicant
  └─ REJECT → Select rejection reason → Notify applicant with reason
  │
  ▼
All actions logged with officer ID + timestamp (audit trail)
```

---

### Flow A-2: Credit Score Manager – Credit Limit Assignment

```
Approved Buyer application received from Verification
  │
  ▼
Pull SIMAH credit bureau score (automated API)
  │
  ▼
Review:
  ├─ SIMAH score
  ├─ Business age & CR details
  ├─ Bank statement cash flow analysis
  └─ Requested credit limit vs. recommended
  │
  ▼
Assign credit limit:
  ├─ System-recommended (rule-based engine)
  └─ Manual override with justification note
  │
  ▼
Set credit terms:
  ├─ Max invoice value per transaction
  ├─ Allowed tenures (30/60/90)
  └─ MDR rate bands (if buyer-specific)
  │
  ▼
Activate Buyer account → Buyer notified with limit details
  │
  ▼
Periodic Review Trigger (quarterly or event-based):
  ├─ Repayment history review
  ├─ Limit increase / decrease
  └─ Account suspension if chronic late payment
```

---

### Flow A-3: Risk Analyst – Invoice Pre-Disbursement Review

```
Invoice submitted by Seller → Risk queue
  │
  ▼
Automated risk scoring:
  ├─ Buyer credit utilization check (within limit?)
  ├─ Seller fraud signals (unusual invoice patterns?)
  ├─ Invoice amount vs. historical average (spike flag)
  └─ Buyer-Seller relationship age
  │
  ▼
[Low Risk] → Auto-approved → Forward to Buyer for confirmation
[Medium Risk] → Manual review required
[High Risk] → Hold + Risk Analyst investigation
  │
  ▼
Manual Review Steps:
  ├─ Call/contact Buyer to verify PO existence
  ├─ Request additional documents (signed PO, delivery schedule)
  └─ Cross-check with seller's historical invoices
  │
  ▼
Decision: APPROVE / REJECT with documented rationale
  │
  ▼
Portfolio Dashboard updated:
  ├─ Concentration risk alerts
  ├─ Sector exposure
  └─ Monthly risk report generation (SAMA compliance)
```

---

### Flow A-4: Collections Manager – Overdue Invoice Management

```
Invoice passes due date without payment
  │
  ▼
System auto-triggers:
  Day 1 overdue  → SMS + app push to Buyer
  Day 3 overdue  → Second reminder + email
  Day 7 overdue  → Collections Manager notified
  │
  ▼
Collections Manager opens Overdue Queue:
  ├─ Buyer name, contact, overdue amount, DPD count
  ├─ Repayment history
  └─ Invoice details
  │
  ▼
Action options:
  ├─ Send formal demand notice (templated, Arabicized)
  ├─ Initiate payment plan negotiation
  │    └─ Set installment schedule → Buyer eSign required
  ├─ Escalate to Legal (if DPD > 30 days)
  └─ Mark as "In Dispute" (if buyer raises claim)
  │
  ▼
If payment plan agreed:
  ├─ Installment reminders auto-scheduled
  └─ Account status: "Restructured"
  │
  ▼
If fully recovered → Invoice marked CLOSED
If written off → Sent to bad debt process + credit limit revoked
```

---

### Flow A-5: Super Admin – MDR Dispute Resolution

```
MDR dispute raised by Seller or Buyer
  │
  ▼
Admin reviews:
  ├─ Original invoice MDR terms (from eSign record)
  ├─ Disbursement records
  └─ Any prior communication
  │
  ▼
Decision:
  ├─ Error confirmed → Initiate adjustment / reversal
  └─ No error → Communicate explanation with evidence
```

---

## 8. Cross-Functional Flow – End-to-End Transaction

```
┌──────────┐     ┌──────────┐     ┌──────────────────────┐
│  BUYER   │     │  SELLER  │     │   YUMNA ADMIN        │
└──────────┘     └──────────┘     └──────────────────────┘
     │                │                      │
     │  Issues PO     │                      │
     │───────────────►│                      │
     │                │ Creates Invoice      │
     │                │ (MDR Scenario A/B/C) │
     │                │─────────────────────►│
     │                │                      │ Risk Review
     │                │                      │ (Auto + Manual)
     │◄───────────────────────────────────── │ Invoice approved
     │ Notification:  │                      │ → sent to Buyer
     │ "Review INV"   │                      │
     │                │                      │
     │ [MDR B/C] Review MDR terms + eSign    │
     │                │                      │
     │ Confirms Goods Received (OTP)         │
     │─────────────────────────────────────►│
     │                │                      │ Disbursement
     │                │◄─────────────────────│ (T+0 / T+1)
     │                │ SAR received         │
     │                │ (net of MDR)         │
     │                │                      │
     │ [On due date] Repayment              │
     │─────────────────────────────────────►│
     │                │                      │ Invoice CLOSED
     │ Credit limit   │                      │ Credit limit
     │ restored       │                      │ restored
```

---

## 9. Agreement & eSign Flows

> In trade finance, agreements are foundational. Every touchpoint requiring commitment must be formally signed.

### Documents Requiring eSign

| Document | Who Signs | When | Method |
|---|---|---|---|
| Buyer Framework Agreement | Buyer | Onboarding | Absher OTP / DocuSign |
| Seller Platform & Factoring Agreement | Seller | Onboarding | Absher OTP / DocuSign |
| MDR Rate Agreement | Seller (+ Buyer if B/C) | Onboarding / Per invoice | OTP confirmation |
| Invoice Acceptance & MDR Consent | Buyer | Per invoice (B/C scenario) | In-app OTP |
| Delivery Confirmation | Buyer | Per invoice | In-app OTP |
| Payment Plan / Restructuring Agreement | Buyer | Collections | eSign |
| Demand Notice Acknowledgement | Buyer | Collections escalation | SMS read receipt |

### eSign Flow

```
Document presented in app → Full document readable (scroll-enforced)
  │
  ▼
"I have read and agree" checkbox
  │
  ▼
Enter OTP (sent to registered Saudi mobile)
  │
  ▼
Signed document:
  ├─ Timestamped
  ├─ IP address + device ID logged
  ├─ PDF copy stored in document vault
  └─ Accessible by Buyer/Seller in "My Documents"
```

---

## 10. Edge Cases & Error States

| Scenario | System Response | UX Action |
|---|---|---|
| Buyer rejects MDR terms (Scenario B/C) | Invoice returned to Seller | Seller notified → can renegotiate or cancel |
| Buyer credit limit insufficient | Invoice blocked pre-submission | Seller sees "Insufficient credit limit" before submitting |
| Buyer disputes delivery (claims goods not received) | Disbursement held | Both parties upload evidence; Admin arbitrates |
| Seller submits duplicate invoice | Auto-detected, flagged | Seller prompted to review and confirm or cancel |
| Payment bounce / SADAD failure | Buyer notified + retry window | Grace period per agreement; late fee applies |
| Nafath/Absher API down | Fallback: manual document upload | Flag for manual KYC review by Verification Officer |
| SIMAH score unavailable | Manual credit assessment | Credit Manager applies thin-file policy |
| Disbursement fails (IBAN error) | Retry T+1; Seller notified | Seller prompted to verify IBAN in settings |

---

## 11. Notifications & Communication Framework

### Notification Triggers

| Event | Channel | Recipient |
|---|---|---|
| New invoice received | Push + SMS | Buyer |
| MDR consent required | Push + SMS + In-app modal | Buyer |
| Invoice approved by Yumna | Push | Seller |
| Delivery confirmed | Push + Email | Seller |
| Disbursement processed | Push + SMS + Email | Seller |
| Repayment due (7 days) | Push + SMS | Buyer |
| Repayment due (1 day) | Push + SMS | Buyer |
| Overdue (Day 1, 3, 7) | SMS + Push + Email | Buyer |
| Credit limit changed | In-app + SMS | Buyer |
| Onboarding approved/rejected | SMS + Email | Buyer/Seller |
| Dispute status update | Push + Email | Buyer/Seller |

---

## 12. MDR Consent Modal Design — Critical Moment of Truth

> The MDR consent modal is the highest-stakes UX interaction on the Yumna platform. It is the legal and financial point of no return for the Buyer. It must be transparent, un-skippable, legally defensible, and emotionally reassuring — all at once.

---

### 12.1 Design Philosophy for This Modal

The MDR consent modal is **not a standard confirmation dialog.** It is a micro-agreement ceremony. The design must:

- **Eliminate ambiguity** — The buyer must understand exactly what they are agreeing to pay, before they agree
- **Prevent accidental acceptance** — Friction is intentional here; it protects both user and platform
- **Build trust** — A transparent breakdown reduces post-transaction disputes
- **Be legally defensible** — OTP signature, timestamped, logged, stored as PDF
- **Respect Arabic-first users** — RTL layout, Hijri date option, SAR formatting

---

### 12.2 When This Modal Appears

| Trigger | Scenario | Who Sees It |
|---|---|---|
| Seller selects "Buyer bears MDR" | Scenario B | Buyer — before delivery confirmation |
| Seller selects "Split MDR" | Scenario C | Buyer — before delivery confirmation |
| Scenario A | Seller bears all MDR | Buyer does NOT see MDR modal (no additional cost to buyer) |
| Seller changes MDR terms after invoice is sent | Edit scenario | Buyer must re-consent via modal |

---

### 12.3 Modal Anatomy — Screen-by-Screen

---

#### SCREEN 1 of 3 — MDR Notice Entry

**Purpose:** Soft interrupt. Warn the buyer that this invoice carries an MDR charge before they see the details.

```
┌─────────────────────────────────────────────────────┐
│  ✕  (close disabled — must read)                    │
│                                                     │
│   ⚠️  مهم — قبل تأكيد الاستلام                     │
│       Important — Before Confirming Receipt         │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  هذه الفاتورة تتضمن رسوم خدمة تمويل (MDR)  │   │
│  │  This invoice includes a financing fee (MDR)│   │
│  │  that applies to your repayment amount.     │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Invoice:        INV-0042                           │
│  Seller:         Khalid Trading Co.                 │
│  Invoice Value:  SAR 1,000,000.00                   │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  💡 The seller has requested that you cover  │  │
│  │     the financing fee for this transaction.  │  │
│  │     Please review the full breakdown before  │  │
│  │     confirming receipt of goods.             │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│         [ Review Fee Breakdown →  ]                 │
│                                                     │
│    ✕ I do not accept — Return to Invoice            │
└─────────────────────────────────────────────────────┘
```

**UX Rules:**
- "✕ close" button is disabled — user must make a choice
- "Confirm receipt" CTA is not visible yet — hidden until Screen 3
- Bilingual (Arabic primary, English secondary) on all screens
- Amber/warning colour tone — not red (alarming) or green (falsely reassuring)

---

#### SCREEN 2 of 3 — Full MDR Breakdown

**Purpose:** Complete financial transparency. No surprises. Every number explained.

```
┌─────────────────────────────────────────────────────┐
│  ← Back       تفاصيل رسوم التمويل       2 of 3     │
│               Financing Fee Breakdown               │
│─────────────────────────────────────────────────────│
│                                                     │
│  INVOICE SUMMARY                                    │
│  ┌───────────────────────────────────────────────┐  │
│  │  Invoice Value (excl. VAT)   SAR  869,565.22  │  │
│  │  VAT (15%)                   SAR  130,434.78  │  │
│  │  ─────────────────────────────────────────    │  │
│  │  Total Invoice Value         SAR 1,000,000.00 │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  MDR CHARGE DETAILS                                 │
│  ┌───────────────────────────────────────────────┐  │
│  │  MDR Rate                           2.50%     │  │
│  │  Applied on Invoice Total                     │  │
│  │  MDR Amount                     SAR 25,000.00 │  │
│  │  ─────────────────────────────────────────    │  │
│  │  MDR Paid By                          YOU     │  │
│  │  (Requested by Seller)                        │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  YOUR REPAYMENT SUMMARY                             │
│  ┌───────────────────────────────────────────────┐  │
│  │  ✦ Invoice Principal         SAR 1,000,000.00 │  │
│  │  ✦ Financing Fee (MDR)          SAR 25,000.00 │  │
│  │  ─────────────────────────────────────────    │  │
│  │  ★ TOTAL YOU REPAY           SAR 1,025,000.00 │  │
│  │                                               │  │
│  │  Repayment Due Date:    15 Muharram 1447 H    │  │
│  │                         (12 August 2025)      │  │
│  │  Credit Tenure:         60 Days               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ℹ️ Why is there a fee?                             │
│  ┌───────────────────────────────────────────────┐  │
│  │  Yumna provides financing to your seller so   │  │
│  │  they receive funds immediately. This fee     │  │
│  │  covers Yumna's financing service.            │  │
│  │  It is agreed between you and the seller.     │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  [ Proceed to Agreement →  ]                        │
│                                                     │
│  ✕ I do not accept — Return to Invoice              │
└─────────────────────────────────────────────────────┘
```

**UX Rules — Split MDR Variant (Scenario C):**
Replace "MDR Paid By: YOU" section with:

```
│  MDR SPLIT AGREEMENT                               │
│  ┌──────────────────────────────────────────────┐ │
│  │  Total MDR Amount            SAR 12,500.00   │ │
│  │  Your Share (50%)             SAR  6,250.00  │ │
│  │  Seller's Share (50%)         SAR  6,250.00  │ │
│  └──────────────────────────────────────────────┘ │
│  ★ TOTAL YOU REPAY             SAR 506,250.00      │
```

---

#### SCREEN 3 of 3 — Consent & eSign

**Purpose:** Formal acceptance. Scroll-enforced agreement text. OTP-signed. Legally binding.

```
┌─────────────────────────────────────────────────────┐
│  ← Back        إقرار الموافقة          3 of 3      │
│                Consent & Agreement                  │
│─────────────────────────────────────────────────────│
│                                                     │
│  Please read the full agreement before signing.     │
│  ┌───────────────────────────────────────────────┐  │
│  │                                               │  │
│  │  MDR CONSENT AGREEMENT                        │  │
│  │  ─────────────────────                        │  │
│  │  I, the undersigned Buyer, hereby confirm:    │  │
│  │                                               │  │
│  │  1. I have reviewed Invoice No. INV-0042      │  │
│  │     issued by Khalid Trading Co. for a        │  │
│  │     total value of SAR 1,000,000.00.          │  │
│  │                                               │  │
│  │  2. I acknowledge that a Merchant Discount    │  │
│  │     Rate (MDR) of 2.5%, amounting to          │  │
│  │     SAR 25,000.00, will be added to my        │  │
│  │     repayment obligation.                     │  │
│  │                                               │  │
│  │  3. My total repayment to Yumna will be       │  │
│  │     SAR 1,025,000.00, due on                  │  │
│  │     12 August 2025 (60-day tenure).           │  │
│  │                                               │  │
│  │  4. I confirm that goods covered by this      │  │
│  │     invoice have been received in full        │  │
│  │     and in satisfactory condition.            │  │
│  │                                               │  │
│  │  5. By signing, I authorise Yumna to          │  │
│  │     disburse SAR 1,000,000.00 to the          │  │
│  │     seller and record my repayment            │  │
│  │     obligation as stated above.               │  │
│  │                                               │  │
│  │  [▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░] Scroll to continue ↓   │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  [Checkbox — enabled only after full scroll]        │
│  ☐  لقد قرأت وأوافق على الشروط أعلاه              │
│     I have read and agree to the terms above        │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  [Sign & Confirm — enabled after checkbox]    │  │
│  │  ──────────────────────────────────────────   │  │
│  │  An OTP will be sent to: +966 5X XXX XX42     │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ✕ Cancel — I do not accept this invoice            │
└─────────────────────────────────────────────────────┘
```

**After tapping "Sign & Confirm":**

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│            أدخل رمز التحقق                         │
│            Enter Verification Code                  │
│                                                     │
│   Sent to +966 5X XXX XX42                          │
│                                                     │
│         [ _ ]  [ _ ]  [ _ ]  [ _ ]  [ _ ]  [ _ ]  │
│                                                     │
│         Resend code in  00:45                       │
│                                                     │
│         [ Confirm Signature ]                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

#### SCREEN 4 — Success Confirmation

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              ✅                                     │
│                                                     │
│       تم تأكيد الاستلام والموافقة على الرسوم       │
│       Delivery Confirmed & Fee Accepted             │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  Invoice:        INV-0042                     │  │
│  │  Seller:         Khalid Trading Co.           │  │
│  │  Total to Repay: SAR 1,025,000.00             │  │
│  │  Due Date:       12 August 2025               │  │
│  │  Signed:         [timestamp]                  │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  📄  Download Signed Agreement (PDF)                │
│                                                     │
│  A copy has been sent to your registered email.     │
│                                                     │
│         [ Go to My Invoices ]                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### 12.4 Rejection Flow — Buyer Declines MDR

```
Buyer taps "I do not accept" on any screen
  │
  ▼
Confirmation dialog:
  "Are you sure? Declining will cancel this
   financing request. The seller will be notified."
  │
  ├─ [Go Back] → Returns to MDR modal
  └─ [Confirm Decline] →
        │
        ▼
        Invoice status → "MDR Rejected by Buyer"
        Seller notified: "Buyer declined MDR terms for INV-0042.
                          You may renegotiate or cancel."
        Seller options:
          ├─ Revise: Switch to Scenario A (absorb MDR)
          ├─ Revise: Adjust split ratio
          └─ Cancel invoice entirely
```

---

### 12.5 Behaviour & Interaction Rules

| Rule | Detail |
|---|---|
| **Scroll enforcement** | "I agree" checkbox is disabled until the user has scrolled to the bottom of the agreement text |
| **CTA progressive unlock** | "Sign & Confirm" CTA is disabled until checkbox is ticked |
| **No close on Screens 1–3** | The X/close button dismisses only to "Cancel invoice" with a confirmation step |
| **Back navigation allowed** | Users can go back between screens but cannot skip forward |
| **OTP expiry** | OTP valid for 5 minutes; resend available after 60 seconds |
| **Session timeout** | If user is idle for 10 minutes mid-modal, session saves state and resumes on return |
| **Duplicate protection** | If OTP is entered twice for the same invoice, second submission is rejected |
| **PDF auto-generation** | Signed agreement PDF is generated immediately post-OTP and stored in user's document vault |
| **Audit log entry** | Captures: user ID, invoice ID, device ID, IP address, timestamp (UTC + AST), OTP verified flag |

---

### 12.6 Edge Cases Within the Modal

| Scenario | Handling |
|---|---|
| OTP not received | "Resend" after 60 seconds; after 3 failed OTPs, session locked for 15 minutes |
| User loses connection mid-modal | State saved; on reconnect, user resumes at same screen |
| Invoice amount edited by Seller after Buyer opened modal | Modal refreshed with new values + "Terms Updated" banner; Buyer must restart review |
| Buyer's credit limit drops below invoice total before signing | Modal blocked; "Insufficient credit limit" message; Admin notified |
| Buyer signs but disbursement fails | Consent is still valid and stored; disbursement retried by system; Buyer not re-prompted |

---

### 12.7 Accessibility & Localisation Checklist

- [ ] All text passes WCAG AA contrast ratio (especially SAR figures and fee callouts)
- [ ] Arabic numerals and Western Arabic numerals toggleable in settings
- [ ] Hijri / Gregorian date toggle on all repayment dates
- [ ] Screen reader labels on all interactive elements
- [ ] Minimum touch target: 48x48px for all CTAs
- [ ] Font size minimum: 14sp body, 18sp financial figures
- [ ] High-contrast mode support for visually impaired users
- [ ] Error states (wrong OTP, session expired) in both Arabic and English

---

### 1. Arabic-First, RTL by Default
All screens must be designed right-to-left. Numbers follow Arabic-Indic or Western Arabic based on user preference. Financial figures always in SAR with Hejri/Gregorian date toggle.

### 2. Trust Through Transparency
Every MDR calculation must be broken down clearly before any eSign. No hidden charges. "What you pay / What you receive" summary cards on every invoice review screen.

### 3. Progressive Disclosure
Onboarding is complex — use a step-indicator pattern. Show only what's relevant per step. Save progress so users can return without restarting.

### 4. Consent is Sacred
No pre-checked agreement boxes. Scroll-enforcement on agreements. OTP as the signature layer — familiar to Saudi users via Absher/Nafath experience.

### 5. Mobile-First for Buyers; Dashboard-First for Sellers
Buyers primarily interact via mobile (confirming delivery, repaying). Sellers need a rich web dashboard for invoice management, reporting, and buyer oversight.

### 6. Admin Role Separation
Each Super Admin sub-role has a scoped view. A Collections Manager cannot modify credit limits. A Loan Verifier cannot access portfolio risk reports. RBAC (Role-Based Access Control) is strict.

### 7. Audit Trail Everywhere
Every action — approvals, overrides, eSigns, disputes — is logged with actor ID, timestamp, and IP. Essential for SAMA regulatory examinations.

### 8. Failure is Forgiving
Incomplete applications can be saved. Invoice drafts are auto-saved. Failed payments have a retry window before penalties apply.

---

---

## 13. Prototype Screen Inventory

> All screens built in `index.html` (React + Tailwind CDN, single HTML file, no build step). Open directly in any browser.

### Seller Flow (S-screens)

| Screen | Component | Description |
|---|---|---|
| S1 | `SellerApp` / `SellerHome` | Seller dashboard — 3-tab shell (Home, Money, Alerts) |
| S2 | `S2InvoiceDetails` | Invoice creation: buyer selector, PO ref, amount, upload, line items |
| S3 | `S3CreditTerms` | Credit tenure selection + utilisation bar |
| S4 | `S4MDRConfig` | MDR scenario picker with live payout preview |
| S5 | `S5ReviewSign` | Review, net payout summary, eSign/submit |
| S6 | `S6Submitted` | Live status tracker — 4-step trail, reacts to admin/buyer actions |

### Buyer Flow (B-screens)

| Screen | Component | Description |
|---|---|---|
| B1 | `BuyerApp` / `BuyerHome` | Buyer dashboard — 4-tab shell (Home, Payments, Sellers, Alerts) |
| B2 | `B2InvoiceDetail` | Invoice detail with MDR callout and line items |
| B3 | `B3MDRWarning` | MDR Notice Screen 1 of 3 — soft interrupt |
| B4 | `B4MDRBreakdown` | Full MDR breakdown Screen 2 of 3 |
| B5 | `B5MDRConsent` | Consent & eSign Screen 3 of 3 — scroll-enforced |
| B6 | `B6OTPEntry` | 6-box OTP with auto-focus progression |
| B7 | `B7Success` | Delivery confirmed + fee accepted confirmation |

### Admin Flow (A-screens)

| Screen | Component | Description |
|---|---|---|
| A0 | `AdminDashboard` | Admin shell — sidebar navigation |
| — | `BizOverview` | Business Overview: KPIs, pipeline, TAT table |
| — | `FOMSSection` | Finance Operations Management System — pipeline table + detail |
| — | `BuyerSellerSection` | Buyer & Seller management with ledger/credit-ratio tabs |
| — | `AuditSection` | SAMA-compliant audit trail table |
| — | `FinancingSchemes` | Financing scheme config + AI toggle |
| — | `TemplateSection` | Notification template manager |
| — | `CorrespondenceSection` | Correspondence thread view |
| — | `NotificationsSection` | Platform-wide notification log |

---

## 14. Seller App — Implemented UX

### 14.1 App Shell

The seller app uses a **3-tab bottom navigation**: Home · Money · Alerts.

**Header bar** (above tabs):
- "Logged in at" label + current store/location name
- Tapping the store name opens a **store switcher dropdown** — lists all registered warehouses/locations; selecting fires a toast ("Switched to X")
- Notification bell with unread badge count (red dot, count shown)
- Avatar circle (initials) in top-right

### 14.2 Seller Home Tab

**Dark hero banner** (TradeHero component):
- Role label ("Wholesaler"), Arabic greeting, seller name
- If a live finance request is active, a pill badge appears ("FR-0042 Active")

**KPI cards** (2-column grid):
- Active Requests (count + SAR outstanding)
- Total Credit Given (tappable → opens credit breakdown bottom sheet)

**Credit Breakdown Bottom Sheet** (triggered from Total Credit Given):
- Total limit and utilised amount
- Stacked colour bar showing each client's share of total credit
- Per-client rows: initials avatar, name, limit, utilised %, mini progress bar
- Bar turns red if utilisation > 80%

**Live Finance Request card** (shown when a request is active):
- Coloured border (primary purple)
- FR ID + "● live" indicator
- Buyer name, amount
- Status tag (reactive to admin decision)

**Recent Finance Requests list**: last 3 requests with ID, buyer, date, amount, status tag

**Primary CTAs**: "Finance Request" (→ S2) and "Add Buyer" (→ AddBuyerSheet)

### 14.3 Seller Money Tab

Three sub-tabs:

| Sub-tab | Content |
|---|---|
| All Transactions | Full list of all finance requests with stage tags |
| Total Business | KPI grid: Total Disbursed (SAR 8.1M), Active Requests, Avg MDR Rate (2.50%), Success Rate (94.2%) |
| Active Requests | Filtered view of open requests; each card has "Dispute Credit" and "Increase Limit" action links |

### 14.4 Seller Clients Tab

**Client list**: each row shows initials avatar (red if High Risk, primary if Low/Med), name, city, deal count, volume, last transaction date, status tag.

Tapping a client opens a **3-tab detail view**:
- **Client Profile**: business name, CR, city, phone, email + credit limit bar (utilisation %)
- **Deals Done**: volume + transaction count KPIs, full transaction history list
- **Credit Requests**: active/pending requests for that client

### 14.5 Client Profile Sheet (bottom sheet overlay)

Accessible from Seller Home. Full-height overlay with:
- Client header (avatar, name, city, CR, risk tag)
- Credit bar (limit, used, % utilised)
- Contact strip (Call / WhatsApp / Email quick-action buttons)
- Deals history list
- Activity timeline (vertical connector line between events)
- Contact info (phone, email, CR, city, last deal)

### 14.6 Add Buyer Sheet

Platform picker bottom sheet:
1. Choose channel: **SMS** / **WhatsApp** / **Email**
2. Enter mobile number (with +966 prefix) or email address
3. "Send Invite" CTA — enabled once ≥5 characters entered
4. Success fires a toast: "Invite sent via [Platform]"

### 14.7 Invoice Creation (S2) — Implementation Details

Enhancements beyond the original spec:

| Field | Implementation |
|---|---|
| Buyer selector | Dropdown with name, CR, credit limit displayed |
| Invoice amount | Manual SAR entry + live VAT (15%) preview inline |
| Invoice document upload | PDF/JPG/PNG, max 10MB; dashed upload zone → green confirmation on upload |
| Line items | Optional; add/remove rows; each row: description, qty, unit price, line total |
| Amount validation | Minimum SAR 10,000 (payment processing cost threshold) |
| Totals panel | Live: subtotal excl. VAT, VAT (15%), invoice total |
| Continue gate | Disabled unless: buyer selected + PO ref entered + amount > SAR 10,000 |

### 14.8 Credit Terms (S3) — Extended Tenures

The prototype implements **5 tenure options** (original spec had 3):

| Tenure | Status |
|---|---|
| 30 days | Spec + prototype |
| 60 days | Spec + prototype |
| 90 days | Spec + prototype |
| **120 days** | **Prototype only — not in original spec** |
| **180 days** | **Prototype only — not in original spec** |

Additional prototype features:
- Due date calculated and previewed dynamically (base: invoice submission date)
- Credit utilisation bar per buyer (red if invoice exceeds limit)
- "Sufficient credit limit" / "Credit limit exceeded" callout

### 14.9 Finance Request Status Screen (S6)

**4-step status trail** (linear progress):
```
Submitted → Approved → Delivery → Disbursed
```
Each step: filled circle with check when done, connector line between steps.

**Cross-persona navigation shortcuts** (contextual):
- "→ View in Admin FOMS" (always visible after submission)
- "Preview Buyer Experience" (visible only after admin approval)

Status screen reacts in real-time to global app state — no page refresh needed.

---

## 15. Buyer App — Implemented UX

### 15.1 App Shell

**4-tab bottom navigation**: Home · Payments · Sellers · Alerts.

**Header bar**:
- "Buyer workspace" label + buyer name (Ahmed Al-Otaibi)
- Avatar circle with initials (AA) — tapping navigates to Alerts tab
- Unread badge on avatar (red dot with count)

### 15.2 Buyer Home Tab

**In-app notification cards** (live notifications from global state appear at top as inline banners, not push)

**Outstanding Balance card** (dark hero):
- Total outstanding SAR
- Invoice count + next due date
- "Pay Now" and "Schedule" quick-action buttons → navigate to Payments tab

**Credit tier card** (see Section 17)

**Live Finance Request card** (conditional — shown when request is approved):
- FR ID + seller name, amount, due date
- Action tag: "Confirm Delivery" (red), "Disbursing" (blue), "Due [date]" (yellow), "Paid ✓" (green)

**Quick stats** (2-column grid):
- Available Credit (remaining vs. limit)
- Transactions (total count, paid vs. active)

### 15.3 Buyer Payments Tab

Two sub-tabs: **Outstanding** | **Payment Schedule**

**Outstanding view**:
- Total Outstanding summary card (amount + count)
- Per-invoice cards with state badges:

| State | Visual | Tag |
|---|---|---|
| `overdue` | Red background, red border | "Overdue" (red) |
| `due_today` | Red border | "Due Today" (red) |
| `due_soon` | Normal | "Due Soon" (yellow) |
| `upcoming` | Normal | "Upcoming" (gray) |

- "Pay Now" button on each card → inline payment flow (same tab)

**Payment flow** (inline, no new screen):
1. Invoice + seller + amount summary
2. Payment method picker: **SADAD** / **Bank Transfer** / **Direct Debit**
3. SADAD: displays SADAD bill code (8-digit, formatted)
4. Bank Transfer: displays Yumna IBAN, account name, reference
5. Confirm button → "Payment Initiated" success state with processing note

**Payment Schedule view**:
- Grouped sections: Overdue / Due Today / Due Soon / Upcoming
- Each item shows DPD count (if overdue) or days remaining
- Inline "Pay →" link

### 15.4 Buyer Sellers Tab (Seller Circle)

**Seller list**: each card shows seller initials avatar, name, city, transaction count, volume, time since added, last transaction date, status tag (Active/Pending).

Tapping a seller opens a **3-tab detail view**:
- **Transactions**: volume + count KPIs, full transaction history list (with "● live" indicator for the active FR)
- **Contact**: business details (name, city, CR, added date, last tx) + phone/email; "Message on WhatsApp" CTA
- **Activities**: vertical activity timeline

**Contact strip** (in seller detail header): Call / WhatsApp / Email quick-action buttons.

### 15.5 MDR Consent Flow (B3–B7)

Implements the 3-screen MDR modal spec from Section 12 plus OTP (B6) and success (B7).

**B5 (Consent & eSign)**:
- Scroll progress bar — checkbox disabled until 88% scroll reached
- Checkbox text in Arabic + English
- "Sign & Confirm" CTA disabled until checkbox ticked

**B6 (OTP)**:
- 6-box OTP input with auto-focus: cursor jumps to next box on digit entry, backspace moves backwards
- Resend countdown timer
- "Confirm Signature" CTA

---

## 16. Admin Dashboard (FOMS) — Implemented UX

### 16.1 Admin Shell

Desktop web layout with a **sidebar navigation** listing all sections. Active section highlighted.

### 16.2 Business Overview

**KPI stat row** (4 cards):
- Overall Credit Distributed (SAR 142M)
- Risk-to-Credit Ratio (4.2% — within SAMA threshold)
- Avg TAT for Verification (3.1 hrs — target <4 hrs)
- Credit Trend 30d (+18% vs. prior period)

**Two-column panel**:
- Left: Finance Requests pipeline preview (links to FOMS)
- Right: Credit Trends by Business (buyer names + utilisation bars)

**TAT Score Table** (per team):

| Team | Avg TAT | Target |
|---|---|---|
| Loan Verification | 2.8 hrs | 4 hrs |
| Credit Scoring | 3.4 hrs | 4 hrs |
| Risk Analysis | 4.1 hrs | 4 hrs |
| Collections | 6.2 hrs | 8 hrs |

### 16.3 FOMS (Finance Operations Management System)

Main pipeline view — styled like a Jira-style task board but in table format.

**Finance Requests table**:
- Columns: Request ID, Buyer → Seller, Amount, Risk score tag, Stage tag, Submitted date, Action
- Live requests from seller prototype highlighted in blue row background
- Clicking a row opens **Finance Request Detail** with 6 sub-tabs:

| Sub-tab | Content |
|---|---|
| Related Documents | Document cards (PDF icons) with verification status; upload zone |
| Activity Timeline | Timestamped event log with actor names |
| Risk Score | Score (0–100), SIMAH score, utilisation, fraud signals, AML, sector; automated checks list |
| Request Communication | Internal chat between team members with text input |
| Decision | Approve / Deny / Stall buttons with note field; post-decision shows disbursement trigger |
| Assign Investigation | Team member selector + investigation notes |

**Decision workflow**:
```
Admin opens Decision tab → fills reason note →
  [Stall]    → status → On Hold;  seller notified
  [Deny]     → status → Denied;   seller notified with reason
  [Approve]  → status → Approved; buyer notified
              → "Switch to Buyer" shortcut appears
              → after buyer confirms → "Process Disbursement" button appears
              → after disburse → disbursed confirmation callout
```

**Sales Pipelines tab** (3 kanban columns):
- Pending Collection
- Visits Planned
- Document Pending Update

### 16.4 Buyers & Sellers Section

Two tabs: **Buyers** | **Sellers**

**Buyers table**: name, CR, SIMAH score, credit limit, utilisation bar, risk tag, active request count, View action

**Buyer detail** (4 sub-tabs):
- Profile Details: CR, SIMAH score, risk category, credit limit + utilisation bar
- Ledger: debit/credit/balance table per invoice
- Finance Requests: request history table
- Credit Ratio: limit vs. outstanding callout (alert if > 90%)

**Sellers table**: name, CR, volume MTD, invoice count, MDR rate, status

### 16.5 Audit Trail

SAMA-compliant log table:
- Columns: Timestamp (AST), Actor, Role, Action, Entity, IP Address, Result
- Every platform action logged: approvals, KYC verifications, disbursements, limit changes

### 16.6 Financing Schemes & AI

- Scheme configuration (scheme names, rules)
- **AI-assisted decision toggle**: enables/disables AI recommendations on risk scoring

### 16.7 Template Manager

- Create/edit notification templates (SMS, push, email)
- Bilingual (Arabic/English) template editor

### 16.8 Correspondence

- Threaded correspondence view per buyer/seller
- Attach documents, mark read/unread

### 16.9 Notifications Section

- Platform-wide notification log
- Filter by recipient type (buyer/seller/admin), channel, event type

---

## 17. Credit Tier System

Buyers earn credit tiers based on transaction history and platform tenure. Displayed on the Buyer Home screen as a visual tier card.

| Tier | Label | Colour | Requirement |
|---|---|---|---|
| 1 | Bronze | #CD7F32 | New account (0 tx) |
| 2 | Silver | #A8A9AD | 3+ transactions · 6+ months |
| 3 | Gold | #D4AF37 | 6+ transactions · 12+ months |
| 4 | Platinum | #5B5B8B | 10+ transactions · 24+ months |

**UI**: Circular tier badge (number + colour border) + tier label + horizontal step track showing all 4 tiers. Current and completed tiers filled; future tiers greyed.

**Purpose**: Gives buyers a progression incentive and enables tiered credit limit policies.

---

## 18. Global App State Architecture

The prototype implements a **shared React context** (`AppCtx`) that propagates state changes across all three personas in real-time — no page reload, no mock API.

### State Shape

```
{
  liveStatus:    null | 'submitted' | 'approved' | 'denied' | 'stalled' |
                 'delivery_confirmed' | 'disbursed' | 'repaid',
  liveData:      null | { id, buyer, seller, amt, raw, tenure, mdr, riskScore },
  requests:      [ ...FinanceRequest ],
  adminDecision: null | 'approved' | 'denied' | 'stalled',
  adminNote:     string,
  buyerConfirmed: boolean,
  disbursed:     boolean,
  buyerPaid:     boolean,
  notes: {
    seller: [ ...Notification ],
    buyer:  [ ...Notification ],
    admin:  [ ...Notification ],
  }
}
```

### Action Dispatch Flow

| Action | Triggered by | Effect |
|---|---|---|
| `SUBMIT` | Seller submits S5 | Creates FR-0042, sets status = submitted, fires admin notification |
| `ADMIN_DECIDE` | Admin clicks Approve/Deny/Stall in FOMS Decision tab | Updates status, fires seller + buyer notifications |
| `BUYER_CONFIRM` | Buyer confirms delivery (B5 → B6 → B7) | Sets buyerConfirmed = true, fires seller + admin notifications |
| `DISBURSE` | Admin clicks "Process Disbursement" | Sets disbursed = true, fires seller + buyer notifications |
| `BUYER_REPAY` | Buyer completes payment in Payments tab | Sets buyerPaid = true, closes invoice, restores credit limit |

### Cross-Persona Notification Routing

Each `notes.seller`, `notes.buyer`, `notes.admin` stream is separate. Notifications appear in each persona's Alerts tab and (for buyer) as inline banners on the Home tab.

---

*Document Version: 1.1 | Prepared for: Yumna Product Team | Classification: Internal – UX Planning*
*v1.0 → v1.1: Added Sections 13–18 capturing all UX decisions implemented in the React prototype (index.html)*
