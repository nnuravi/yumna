# YUMNA — Pipeline & CRM Design Changes
## Post-Meeting Synthesis for UX Design Revision
**Source:** CRM capabilities and pipeline design review with Ali · Jun 2  
**Prepared for:** Senior UX Designer  
**Status:** Action Required — Multiple flows need redesign

---

## How to Use This Document

This document captures everything discussed in the Jun 2 meeting with Ali (Yumna operations lead), cross-referenced against the existing UX document (v1.1). It is organized into three layers:

1. **Structural changes** — pipeline architecture is fundamentally different from what's currently designed
2. **Stage-by-stage breakdowns** — what happens at each stage, who does it, what the UI must support
3. **Gap analysis** — specific screens, fields, and flows that need to be added, changed, or removed

Every section ends with a clear **Design Action** block so you know exactly what to build or revise.

---

## 1. Fundamental Architecture Change: Two Pipelines, Not One

### What the Current UX Doc Assumes
The existing UX doc (Sections 5–8) treats the entire journey as a single continuous flow: Onboarding → Invoice Creation → Delivery Confirmation → Disbursement → Repayment → Collections. The admin dashboard (FOMS) manages everything in one pipeline view.

### What Ali Confirmed
There are **two completely separate pipelines** that should be treated as independent operational tracks:

| Pipeline | Name | Scope | Teams Involved |
|----------|------|-------|----------------|
| **Pipeline 1** | Sales / Onboarding Pipeline | From first client contact through account activation | Sales, Document Verification, Credit, Legal, Operations |
| **Pipeline 2** | Installments / Repayments Pipeline | From invoice issuance through payment completion or escalation | Operations, Collections, Legal |

Ali was explicit: *"I would suggest separating the pipelines."* The onboarding pipeline ends when the client is active. Everything after — invoicing, installments, repayment tracking, escalation — lives in a second pipeline with its own stages, views, and team responsibilities.

### Why This Matters for UX
The current FOMS (Section 16.3) uses a single pipeline table. This needs to become two distinct pipeline views, each with their own stage columns, filters, and detail panels. The admin sidebar navigation needs to reflect this separation.

**Design Action:**
- Split the FOMS pipeline view into two: "Onboarding Pipeline" and "Repayments Pipeline"
- Add a pipeline switcher or separate sidebar nav items for each
- Each pipeline gets its own stage columns, filters, and KPI summary row
- Rename "Finance Requests" in the FOMS to reflect that it covers onboarding tickets specifically

---

## 2. Pipeline 1 — Sales / Onboarding Pipeline (Complete Redesign)

### Current UX Doc Stages (Flow A-1 + A-2)
The existing doc has two admin flows for onboarding:
- A-1: Loan Verification (document checklist → AML screening → approve/reject/request more info)
- A-2: Credit Score Manager (SIMAH pull → assign credit limit → set terms → activate)

### What Ali Described (7 Stages)
The real onboarding pipeline has **seven distinct stages**, each owned by a specific team, with specific actions required before the ticket can advance.

```
Sales → Document Check → Credit Review → Credit Assessment → Legal → Onboarding → Active
```

Below is each stage broken down in full detail.

---

### Stage 1: Sales (Ticket Creation)

**Owner:** Sales Team  
**Purpose:** First contact with the client. Create the onboarding ticket and collect initial information and documents.

**What the sales team captures:**

| Field | Required | Notes |
|-------|----------|-------|
| Contact name | Yes | |
| Email | Yes | |
| Phone number | Yes | |
| Client type | Yes | Buyer or Seller (Merchant) |
| Business information | Yes | Business name, type, location |
| Finance request amount | Yes | **Critical field** — drives downstream document requirements. Can be zero for merchant-only onboarding |
| Documents | Yes | Uploaded by sales team after collection from client |

**Critical Design Detail — Finance Request Amount:**
Ali confirmed this field belongs in the onboarding pipeline, not just post-onboarding. The current UX doc does not include a finance request amount at the sales/onboarding stage. The credit team needs this number to determine what level of assessment to perform and what documents to request.

A value of **zero** is valid — it means the client is being onboarded as a merchant with no credit limit, requiring only KYC documents and skipping the credit assessment stage entirely.

**What happens after the sales team fills this in:**
The AI reviews the uploaded documents and checks whether all required documents have been received (based on the amount entered — see tiered document model below). If documents are missing, the system surfaces a checklist showing what's still needed, and the sales team can send a document request to the client. Once all documents are present, the sales team confirms receipt and the ticket advances.

**Design Action:**
- Add "Finance Request Amount (SAR)" field to the onboarding ticket creation form, with clear labeling that zero is permitted
- Add a "Client Type" selector (Buyer / Merchant) at ticket creation
- Build an AI-powered document completeness checker that runs after documents are uploaded
- Show a visual checklist of received vs. missing documents
- Add a "Send Document Request" action that notifies the client about missing documents
- Add a "Confirm Receipt" action that gates advancement to the next stage
- Show outbound message log so the sales team can see what was sent to the client

---

### Stage 2: Document Check (AI-Assisted Verification)

**Owner:** Operations Team (with AI assistance)  
**Purpose:** Verify that all submitted documents are valid, consistent, and complete.

**Three AI verification checks:**

| Check | What It Does | Difficulty |
|-------|-------------|------------|
| **Validity Date Check** | Confirms CR, tax certificate, and national address are all within their validity periods | Straightforward for AI |
| **Name Unification** | Confirms the business name is consistent across all documents (CR matches tax cert matches national address, etc.) | Harder — documents are in Arabic, names may have slight variations |
| **IBAN Extraction** | Reads and records the bank account number from the submitted bank documents | OCR task |

**Post-AI Manual Review:**
Ali was clear that even after the AI runs its checks, a human operations team member manually verifies the results. Reasons: some CRs use barcode-based formatting that AI can't parse, and certain business sectors are excluded by policy, which requires human judgment.

**Tiered Document Requirements (New — Not in Current UX Doc):**
This is a significant addition. The documents required depend on the finance request amount entered by the sales team in Stage 1.

| Finance Request Amount | Required Documents |
|------------------------|-------------------|
| **Zero** (merchant only, no credit) | KYC documents only. Ticket skips Credit Review and Credit Assessment, goes directly to Legal. |
| **Below SAR 50,000** | KYC documents + Sales ledger + Bank account details of the owner/manager |
| **SAR 50,000 and above** | Everything above + SIMAH report + Returns for 4 quarters + Financial statements for 2 years |

**Conditional Document Upload Zone:**
The system must dynamically show which documents are required based on the amount. If the amount changes (e.g., sales team corrects it), the document requirements should update and flag any newly-required but missing documents.

Ali also mentioned that the credit team can send the ticket back to sales if they need additional documents. This means the system needs an "Additional Documents (Optional)" upload area that can be populated on reassignment.

**Design Action:**
- Build the AI verification panel showing three check results: Validity Dates, Name Unification, IBAN Extraction — each with pass/fail/warning status
- Add a manual verification toggle: "I have verified this manually" with the officer's name and timestamp
- Implement the tiered document model — document checklist dynamically adapts to the requested amount
- If amount = 0, show only KYC documents and route the ticket to Legal (skip Credit Review and Credit Assessment)
- Add an "Additional Documents" section that appears when the ticket is reassigned from Credit back to Sales
- Add a "Clear KYC" action button that advances the ticket to Credit Review
- The existing UX doc's "AML / Sanctions screening" step should remain here but Ali didn't mention it — confirm whether it's still needed or if it's been absorbed into the AI checks

---

### Stage 3: Credit Review (Pass/Fail — Not Scored)

**Owner:** Operations Team  
**Purpose:** Final human check that all document information is consistent before passing to the credit assessment team.

**Critical Difference from Current UX Doc:**
The existing UX doc (Section 7, Flow A-2) describes a scoring-based credit review with SIMAH integration, rule-based engine recommendations, and manual override capability. Ali explicitly stated: *"We don't have a scoring key. It's whether he passed or he doesn't. No score."*

At this stage, the operations person simply confirms:
- Serial numbers are valid
- Unified phone number is valid
- Email is valid
- ID or Power of Attorney matches the contact name and number
- All documents have consistent details

This is a **binary pass/fail gate**, not a scored assessment. There is no credit score assigned at this stage.

**Design Action:**
- Redesign the Credit Review stage to show a simple pass/fail verification checklist, not a scoring dashboard
- Remove the scoring UI from this stage (move it to Credit Assessment if needed)
- Checklist items: Serial number valid, Phone valid, Email valid, ID/POA matches contact, Document details consistent
- Two actions: "Pass — Advance to Credit Assessment" and "Fail — Return to Sales with Notes"
- If amount = 0, this stage is skipped entirely (ticket goes from Document Check to Legal)

---

### Stage 4: Credit Assessment (by Credit Team — AK's Domain)

**Owner:** Credit Team (AK)  
**Purpose:** Evaluate the client's creditworthiness and determine the credit limit and guarantee requirements.

**Important Context:**
Ali deferred to "AK" (the credit team lead) for the specifics of how evaluation is done. He said: *"This is the one to be usually by AK. It's his work. I really don't know how he does it."* A follow-up conversation with AK is needed to design the detailed assessment UI.

**What Ali did confirm — Five Possible Outcomes:**

| Outcome | What Happens | Required Input from Credit Team |
|---------|-------------|-------------------------------|
| **1. Rejected** | Client is denied credit | Must specify reason for rejection |
| **2. Approved — Promissory Note only** | Default approval outcome; single personal promissory note required | No reason required for approval |
| **3. Approved — Promissory Note + Institutional Promissory Note** | Higher guarantee level | Guarantee requirement specification |
| **4. Approved — Promissory Note + Institutional PN + Assignment of Right** | Highest guarantee level | Guarantee requirement specification |
| **5. Returned for More Info** | Ticket is reassigned back to the Sales team | Must specify what additional documents or information are needed |

**The guarantee type determined here is critical** — it gets passed to the Legal team in the next stage, telling them exactly which documents to prepare and collect.

**Routing Rule:**
If the finance request amount is zero, this stage is skipped entirely. The ticket goes from Document Check directly to Legal (KYC-only onboarding for merchants without a credit limit).

**Design Action:**
- Build a decision panel with five outcome options (not just approve/reject)
- For "Rejected": require a reason text field before the action can be submitted
- For the three approval levels: show the guarantee requirements clearly so Legal knows what to collect
- For "Returned for More Info": require a note specifying what's needed, and provide a document request action that notifies the sales team
- Add a "Requested Amount" display prominently in this view so the credit team sees what the client asked for
- Include space for the credit team's assessed amount (may differ from requested — e.g., client requests 1M, credit approves 500K)
- Schedule a follow-up with AK to understand the assessment methodology and what data/tools the credit team needs in their UI
- If amount = 0, skip this stage in the pipeline flow

---

### Stage 5: Legal (Two Sub-Stages)

**Owner:** Legal Team  
**Purpose:** Issue contracts and guarantees, collect signatures, verify everything is properly executed.

Ali described Legal as having two distinct phases that could be modeled as sub-stages or as two separate stages in the pipeline:

#### Sub-Stage 5A: Contract & Guarantee Issuance

**Actions:**
1. Legal selects the appropriate contract template for this client
2. Legal prepares the guarantee documents based on what the Credit Assessment team specified (promissory note only, PN + institutional PN, or PN + institutional PN + assignment of right)
3. Legal sends the contract and guarantee documents to the client for signature
4. System tracks that documents have been sent and awaits return

**AI Automation Opportunity:**
Ali mentioned that when the signed contract is returned, *"AI will automatically move this ticket to contract agreement"* — meaning the system should detect the upload of a signed document and auto-advance to the verification sub-stage.

#### Sub-Stage 5B: Contract Agreement Verification

**Actions:**
1. Legal verifies the returned contract is properly signed
2. Legal confirms the contract is under the correct name (not someone else's)
3. Legal verifies all required guarantees are signed and complete
4. Legal uploads the signed contract and all guarantee documents to the system
5. Legal confirms everything is in order

**What Legal does NOT do:**
Legal does not make credit decisions. They do not assess risk. They execute on what Credit Assessment decided and ensure the paperwork is airtight.

**Design Action:**
- Split the Legal stage into two visible sub-stages in the pipeline: "Contract Issuance" and "Contract Verification"
- In Contract Issuance: show which guarantee level was requested by Credit Assessment, provide contract template selector, "Send to Client" action, sent/awaiting status tracker
- In Contract Verification: show uploaded documents, provide verification checklist (correctly signed, correct name, all guarantees present), "Approve — Advance to Onboarding" action
- Implement auto-detection of returned signed documents to trigger the transition from Issuance to Verification
- The existing UX doc (Section 9) already has eSign flows but they assume digital-first signing. Ali described a model where physical documents are signed, scanned, and uploaded. The UI should support both paths.

---

### Stage 6: Onboarding (Final Activation)

**Owner:** Operations Team  
**Purpose:** Confirm the client is ready to use the platform.

**What operations does:**
1. Ensure the client can sign in to the platform (mobile app or web)
2. Assign the approved credit limit to the client's account
3. Confirm the client is ready to be launched and start activities

**Mobile-First Consideration:**
Vishnu raised an important point in the meeting: since the platform is mobile-first, much of the document collection and signing could happen through the app itself, reducing the sales team's manual work. The client downloads the app, uploads documents from their phone, signs digitally, and waits while the internal pipeline processes their application.

**Design Action:**
- Keep this stage lightweight in the admin UI — it's a final confirmation gate, not a complex workflow
- Show a checklist: Account created, Can sign in, Credit limit assigned, Ready to launch
- "Activate Client" action button
- Consider the client-side experience: what does the buyer/seller see while their application is being processed? The current UX doc (Section 5, Flow B-1) shows "Pending Admin Review" but doesn't detail the waiting experience. Design a status tracker for the client side showing progress through the pipeline stages.

---

### Stage 7: Active

**Status:** Client is live on the platform and can begin transacting.

No admin action needed — this is a terminal state for Pipeline 1.

---

## 3. Pipeline 2 — Installments / Repayments Pipeline (New Pipeline)

### What the Current UX Doc Covers
The existing doc handles repayment (Flow B-3) and collections (Flow A-4) as part of the main flow. Repayment is a buyer-side action; collections is an admin-side escalation workflow. They're not treated as a unified pipeline.

### What Ali Described
Post-onboarding, when invoices are issued and credit is extended, each transaction creates a repayment record that moves through its own pipeline. Ali screen-shared their current manual tracking system (built in Odoo) to show what data is tracked.

---

### Data Model Per Repayment Record

Each record in this pipeline represents **one buyer-merchant relationship for one transaction**. It contains:

| Data Field | Description |
|-----------|-------------|
| Buyer name | The buyer in this transaction |
| Merchant name | The seller/merchant in this transaction |
| Disbursement date | When funds were released |
| Total credit limit | Buyer's total approved limit |
| Available credit | Remaining credit after this transaction |
| Number of installments | How many payments the repayment is split into |
| EMI frequency | Payment frequency (monthly, etc.) |
| EMI amount | Auto-calculated installment amount |
| Primary email | For sending payment reminders and notices |
| Fee model | Merchant credit, 50/50 split, or financing |
| Buyer fees | MDR amount charged to buyer |
| Merchant fees | MDR amount charged to merchant |
| Yumna income | Platform revenue from this transaction |
| Total amount | Full invoice value |
| Repaid amount | How much has been paid so far |
| Total outstanding | Remaining balance |
| Balance due | Current amount due |
| Installment schedule | Per-installment: amount, due date, paid/unpaid status, late/on-time indicator, payment confirmation |

**Design Action:**
- Build a repayment detail view that shows all of the above fields
- The existing "Buyer Ledger" in the admin dashboard (Section 16.4) partially covers this but needs to be expanded into a full per-transaction repayment record
- Include a visual installment timeline showing each payment's status

---

### Escalation Model (3 Levels — Replaces Current Collections Flow)

The existing UX doc (Flow A-4) describes a collections workflow with automated reminders (Day 1, 3, 7) and then manual intervention. Ali described a more structured **three-level escalation model:**

| Level | Owner | Action | Tone |
|-------|-------|--------|------|
| **Level 1** | System / Operations | Phone call to the client as a friendly reminder | Polite, relationship-preserving |
| **Level 2** | Legal Team (soft approach) | Phone call with a firmer tone, attempting to collect | Professional but firm |
| **Level 3** | Lawyer (enforcement) | Execute the promissory note through legal channels | Formal legal action |

**Key Difference from Current UX Doc:**
The current doc's collections flow (Flow A-4) has: automated reminders → formal demand notice → payment plan negotiation → legal escalation → write-off. Ali's model is simpler and more phone-call-driven, with the promissory note execution as the final step.

**Design Action:**
- Redesign the escalation stages in the Repayments Pipeline to reflect three levels, not the current reminder-based model
- Each escalation level should be a visible stage in the pipeline
- Show escalation history: who called, when, outcome, notes
- At Level 3, show the promissory note details and execution status
- Add the ability to filter the pipeline by escalation level (e.g., "show all Level 2 escalations")

---

### "Pause Reminders" — Explicitly Excluded

Ali currently has a "pause reminders" option in their Odoo system and explicitly said he does **not** want this in the new system. Do not include a pause/snooze reminders feature in the Repayments Pipeline.

---

### 50/50 MDR and Collections Responsibility

Vishnu asked whether the seller shares responsibility for collections in a 50/50 MDR split scenario. Ali's answer was unambiguous: **Only the buyer is responsible for repayment, regardless of MDR split.**

The 50/50 split only determines how Yumna collects its MDR fee:
- Seller receives less than the invoice amount (their share of MDR is deducted)
- Buyer repays more than the invoice amount (their share of MDR is added)

But the repayment obligation sits entirely with the buyer. The seller is never contacted for collections.

**Design Action:**
- In the Repayments Pipeline, the "responsible party" for collections is always the buyer
- Do not show seller contact information in escalation workflows
- The MDR split information should be visible for reference (explaining why the repayment amount differs from the invoice amount) but should not imply shared liability

---

## 4. Admin FOMS — Required UI Changes

### Current FOMS Structure (Section 16.3)
Single pipeline table with columns: Request ID, Buyer → Seller, Amount, Risk score, Stage, Submitted date, Action.

### Required Changes

**Navigation:**
- Add two pipeline views to the sidebar: "Onboarding Pipeline" and "Repayments Pipeline"
- Each pipeline has its own table, filters, and stage columns

**Onboarding Pipeline View:**
- Stage columns reflecting the 7-stage flow: Sales → Document Check → Credit Review → Credit Assessment → Legal (Issuance) → Legal (Verification) → Onboarding → Active
- Each ticket shows: Client name, type (buyer/merchant), requested amount, current stage, assigned team member, days in current stage, document completeness indicator
- Clicking a ticket opens a detail panel with stage-specific tabs and actions (as described in each stage above)

**Repayments Pipeline View:**
- Stage columns: Active → Overdue → Escalation L1 → Escalation L2 → Escalation L3 → Closed
- Each record shows: Buyer, Merchant, total amount, outstanding, next due date, DPD (days past due), escalation level
- Clicking a record opens the full repayment detail view with installment schedule, payment history, and escalation log

**Cross-Pipeline Linking:**
- From a client's onboarding ticket, link to their repayment records (if any)
- From a repayment record, link back to the client's onboarding profile

---

## 5. Fields & Features to Add, Change, or Remove

### Add (Not in Current UX Doc)

| Item | Where | Why |
|------|-------|-----|
| Finance request amount field | Sales stage (Pipeline 1) | Drives tiered document requirements and credit assessment |
| Client type selector (Buyer/Merchant) | Ticket creation | Determines flow routing |
| Tiered document checklist | Document Check stage | Amount-conditional document requirements (0 / <50K / ≥50K) |
| Five-outcome credit decision | Credit Assessment stage | Current doc only has approve/reject; actual system has 5 outcomes with guarantee tiers |
| Guarantee level indicator | Legal stage | Legal needs to know which guarantee documents to prepare |
| Contract issuance + verification sub-stages | Legal stage | Legal has two distinct workflow phases |
| Separate Repayments Pipeline | FOMS | Currently mixed into one pipeline |
| 3-level escalation model | Repayments Pipeline | Replaces the current reminder-based collections flow |
| Assessed amount (credit team's decision) | Credit Assessment stage | May differ from requested amount |
| "Send Document Request" action | Sales + Document Check stages | For requesting missing documents from the client |
| Per-transaction repayment detail view | Repayments Pipeline | Full data model as described by Ali |
| Client-side application status tracker | Buyer/Seller app | Shows pipeline progress while the client waits for activation |

### Change (Exists but Needs Modification)

| Item | Current State | Required Change |
|------|--------------|-----------------|
| Credit review | Scoring-based with SIMAH, rule engine, manual override | Binary pass/fail checklist — no scoring at this stage |
| Collections workflow | Automated reminders (Day 1, 3, 7) → demand notice → payment plan → legal → write-off | 3-level escalation: friendly call → firm call → promissory note execution |
| Pipeline architecture | Single continuous flow | Two separate pipelines (Onboarding + Repayments) |
| Legal stage | Single stage for eSign | Two sub-stages: issuance and verification |
| Admin decision outcomes | Approve / Deny / Stall | Five outcomes with guarantee tier specifications |
| Document requirements | Static checklist (CR, Nafath, IBAN, VAT, bank statements) | Dynamic checklist based on requested amount tier |

### Remove or Deprioritize

| Item | Reason |
|------|--------|
| "Pause reminders" feature | Ali explicitly excluded this from the new system |
| Credit scoring UI at the review stage | No scoring model exists — it's pass/fail |
| Shared collections responsibility for sellers in 50/50 MDR | Buyer is solely responsible regardless of MDR split |

---

## 6. Routing Rules Summary

These routing rules determine how tickets flow through Pipeline 1 based on the finance request amount:

```
Amount = 0 (Merchant, no credit):
  Sales → Document Check (KYC only) → Legal → Onboarding → Active
  [Skips: Credit Review, Credit Assessment]

Amount < SAR 50,000:
  Sales → Document Check (KYC + sales ledger + bank account) →
  Credit Review → Credit Assessment → Legal → Onboarding → Active

Amount ≥ SAR 50,000:
  Sales → Document Check (KYC + sales ledger + bank account +
  SIMAH + 4-quarter returns + 2-year financials) →
  Credit Review → Credit Assessment → Legal → Onboarding → Active
```

Additionally, at any point the Credit Assessment team can **return the ticket to Sales** if they need more documents, creating a loop: Credit Assessment → Sales → Document Check → Credit Review → Credit Assessment.

---

## 7. Open Questions for Follow-Up

These items were raised but not fully resolved in the meeting:

| Question | Who to Ask | Impact |
|----------|-----------|--------|
| How does the credit assessment team actually evaluate clients? What tools, data, and methodology do they use? | AK (Credit Team Lead) | Needed to design the Credit Assessment stage UI |
| How can AI assist in the credit assessment stage? | AK + AI team | Determines whether AI recommendations are shown in the Credit Assessment view |
| Is AML / Sanctions screening still a separate step, or is it absorbed into the AI document checks? | Ali / Compliance | Affects the Document Check stage design |
| What are the exact SAR thresholds for document tiers? Ali mentioned both 100K and 50K at different points before settling on 50K — confirm the final number | Ali | Affects the tiered document model |
| What is the exact installment/EMI calculation logic? | Finance team | Needed for the Repayments Pipeline detail view |
| Are there additional statuses in the Repayments Pipeline beyond what was discussed? (e.g., restructured, written off, disputed) | Ali / Collections | Affects the pipeline stage columns |
| What does the client see on their app while their onboarding application is being processed? | Product team | Client-side status tracker design |

---

## 8. Meeting Participants & Roles Reference

| Person | Role in Meeting | Relevance |
|--------|----------------|-----------|
| **Vishnu Ravi** | UX/Product Designer | Presented designs, drove the discussion, captured requirements |
| **Ali** | Operations Lead, Yumna | Walked through current Odoo workflows, confirmed pipeline stages, described escalation model |
| **Sajid** | Team member (observer) | Kept in the loop; no substantive questions |
| **Munir** | Team member (joined late) | Observer; no substantive questions |
| **AK** | Credit Team Lead (not present) | Referenced as the owner of credit assessment methodology — follow-up needed |
| **Abdul** | Stakeholder (not present) | Referenced as having approved designs in a prior session |

---

## 9. Quick Reference: Current UX Doc Sections Affected

| UX Doc Section | Impact Level | What Changes |
|----------------|-------------|-------------|
| §5 (Buyer Flows) | Moderate | Add client-side onboarding status tracker; repayment flow changes to match new escalation model |
| §7 (Super Admin Flows) | **Major** | All four admin flows (A-1 through A-4) need restructuring to match the two-pipeline model |
| §8 (Cross-Functional Flow) | **Major** | End-to-end flow diagram needs to be split into two pipeline diagrams |
| §10 (Edge Cases) | Minor | Add edge cases for tiered document requirements and five credit outcomes |
| §11 (Notifications) | Moderate | Add notifications for pipeline stage transitions, document requests, escalation level changes |
| §13 (Screen Inventory) | **Major** | Admin screens need significant additions for both pipelines |
| §16 (Admin Dashboard) | **Major** | FOMS needs complete redesign with two pipeline views |
| §17 (Credit Tier System) | None | No changes discussed |
| §18 (Global App State) | Moderate | State machine needs to account for two separate pipeline flows |

---

*Document prepared from meeting transcript dated Jun 2 · Cross-referenced against yumna_ux_doc.md v1.1*
