# Yumna Seller App — UX reference

A walkthrough of the **Seller mobile experience** in the `yumna/` prototype: its screens,
journeys, navigation model, and where to customize each piece. The seller app is a phone-width
React flow under [`src/pages/seller/`](src/pages/seller/) (not the separate `seller-pwa/`
scaffold, which has no seller screens yet).

> **Framing:** rendered as a centered phone frame — `max-w-md` (≤448px), `h-dvh`, safe-area
> padding (`pt-safe` / `safe-bottom`), RTL/Arabic support (`dir="rtl"` + bilingual labels).
> Primary accent `#8f85ff`. State lives in `AppContext` ([src/context/](src/context/));
> mock data in [src/data/mockData.js](src/data/mockData.js).

---

## 1. Entry & routing

| Step | What | File |
|---|---|---|
| Role picker | "Seller" (active — Khalid Al-Zahrani) → `/seller`; "New Seller" (Omar Al-Qahtani) → `/seller/onboard` | [Login.jsx](src/pages/Login.jsx) |
| App shell | Bottom-tab container; **guards onboarding** (status `new`/`pending` → redirect to `/seller/onboard`) | [SellerApp.jsx](src/pages/seller/SellerApp.jsx) |
| Routes | `/seller`, `/seller/onboard`, `/seller/invoice`, `/seller/status` | [App.jsx](src/App.jsx) |

---

## 2. The app shell — 3 tabs

Persistent bottom nav (الرئيسية · المال · التنبيهات) with an unread badge on Alerts.

| Tab | Screen | Purpose / key elements |
|---|---|---|
| **Home** | [SellerHome.jsx](src/pages/seller/SellerHome.jsx) | Dark hero with **"Received Credit"** balance (hide/show); CTAs **New Request** + **Invite Buyer**; 2×2 metrics grid (Active Requests, Cash Incoming, Volume, MDR Cost); recent-requests carousel; buyer credit-utilization list; alerts preview |
| **Money** | [SellerMoney.jsx](src/pages/seller/SellerMoney.jsx) | Sub-tabs: **All Transactions**, **Total Business** (KPIs), **Active Requests** (Raise Dispute / Increase Limit) |
| **Alerts** | [SellerAlerts.jsx](src/pages/seller/SellerAlerts.jsx) | Notification feed (disbursement / credit warning / approval); unread left-border + "Mark all read"; empty state |

---

## 3. Element glossary

| Name (use this) | What it is | File |
|---|---|---|
| **Seller Shell** | Phone-frame container + bottom tab bar | [SellerApp.jsx](src/pages/seller/SellerApp.jsx) |
| **Home Hero** | Dark gradient header: greeting, balance, primary CTAs | [SellerHome.jsx](src/pages/seller/SellerHome.jsx) |
| **Metrics Grid** | 2×2 KPI tiles below the hero | SellerHome.jsx |
| **Recent Requests carousel** | Horizontal cards of latest finance requests w/ status badge | SellerHome.jsx |
| **Buyer Credit list** | Buyers ranked by utilization %, progress bar (red >80%) | SellerHome.jsx |
| **Onboarding Wizard** | 4-phase KYC funnel | [SellerOnboard.jsx](src/pages/seller/SellerOnboard.jsx) |
| **Request Wizard** | 4-step finance-request creator | [CreateInvoice.jsx](src/pages/seller/CreateInvoice.jsx) |
| **Status Trail** | 4-step request-tracking progress | [SubmissionStatus.jsx](src/pages/seller/SubmissionStatus.jsx) |
| **Add Buyer sheet** | Bottom-sheet invite (WhatsApp/SMS/Email) | [AddBuyerSheet.jsx](src/pages/seller/AddBuyerSheet.jsx) |

---

## 4. Primary journeys

### A. Onboarding (New Seller) — `SellerOnboard.jsx`, 4 phases
1. **PRE (wizard)** — Business details (name, CR#, city, phone, email) → upload **5 documents**
   (Commercial Registration, Owner ID, National Address Certificate, VAT, IBAN letter) → Review → **Submit**.
2. **PENDING** — "verifying within ~4 hours" + 4-step trail (Submitted → Verification → Contract
   → Activated). Has a **correction sub-state**: amber "Action Required" → re-upload → Resubmit.
3. **POST** — **MDR Agreement** (2.50%, scroll-to-unlock checkbox) → **Contract Signing**
   (scroll + checkbox + **6-digit OTP**).
4. **DONE** — confetti, account summary (business, CR, Account ID, MDR, activation date),
   "What's next", and an **Add Buyers** prompt → dashboard.

### B. Create a finance request — `CreateInvoice.jsx`, 4 steps
1. **Invoice Details** — pick/search buyer (or invite), PO reference, amount (≥10,000 SAR,
   auto VAT 15%), upload invoice doc.
2. **Credit Terms** — tenure (30/60/90/120/180d) + **buyer credit-check bar** (blocks if limit
   exceeded) + due-date preview.
3. **MDR Config** — fee bearer: **A) Seller covers / B) Buyer covers / C) Split** (slider) →
   live **net payout** preview.
4. **Review & Sign** — summary + **OTP** → submit → routes to status tracking + toast.

### C. Track a request — `SubmissionStatus.jsx`
4-step trail: **Submitted → Approved → Delivery Confirmed → Disbursed** (then *Repaid* in
history). Shows net payout, tenure, MDR, risk score; demo links to Admin/Buyer views.

### D. Grow the credit circle — `AddBuyerSheet.jsx`
Bottom sheet: channel (**WhatsApp / SMS / Email**) → contact → pre-composed invite (deep-links
to wa.me / sms / mailto) or **copy invite link** (`https://yumna.sa/register`).

### E. Alerts — `SellerAlerts.jsx`
Disbursement ✓ / credit-limit warning ⚠ / approval feed; unread indicator; "Mark all read".

---

## 5. Navigation model
- **Persistent bottom tab bar** (Home/Money/Alerts) — active tab uses the primary accent.
- **Full-page route drill-downs** for wizards: `/seller/invoice`, `/seller/status`,
  `/seller/onboard` (back via header back-button / `useNavigate`).
- **Bottom sheets** for the buyer-invite flow (drag handle, dark backdrop, dismiss on backdrop).
- **Cross-tab links** (e.g. Home "See All" → Money; hero bell → Alerts).
- **Gating pattern:** binding steps (onboarding contract, request submission) require
  **scroll-to-agree + OTP**.

---

## 6. Status color language (shared with the admin pipeline)
From the status maps in `SellerHome.jsx` / `SubmissionStatus.jsx`:

| State | Color |
|---|---|
| Submitted / Approved | purple `#5b4fe0` on `rgba(143,133,255,0.14)` |
| Delivery Confirmed | amber `#b45309` |
| Disbursed / Repaid | green `#0a8f63` |
| Denied / Stalled | red `#c03539` / grey |

---

## 7. Data & state
- **Shared (AppContext):** `currentUser`, `liveStatus`/`liveData` (the in-flight request),
  `requests[]`, `notes.seller[]` (alerts), `toasts[]`. Actions: `SET_USER`,
  `COMPLETE_ONBOARDING`, `SUBMIT`, `ADMIN_DECIDE`, `BUYER_CONFIRM`, `DISBURSE`, `MARK_READ`.
- **Local (per screen):** `activeTab`; wizard `step`/`phase`; form fields; OTP arrays;
  scroll-progress; sheet visibility.
- **Mock data ([mockData.js](src/data/mockData.js)):** `USERS` (seller / new_seller / buyer /
  admin), `MOCK_BUYERS`, `MOCK_REQUESTS`, `MOCK_SELLERS`, `MOCK_SELLER_ALERTS`, `formatSAR()`.

---

## 8. How to customize
- **Accent / theme:** the seller flow uses `#8f85ff` (primary) + the page tokens. Recolor via
  the shared tokens in [src/index.css](src/index.css) (`--color-primary`, `--color-page`).
- **Tabs:** add/rename/reorder the bottom-nav items in [SellerApp.jsx](src/pages/seller/SellerApp.jsx).
- **Wizard steps:** the step arrays at the top of [CreateInvoice.jsx](src/pages/seller/CreateInvoice.jsx)
  and the phase/step logic in [SellerOnboard.jsx](src/pages/seller/SellerOnboard.jsx) define the
  funnels — edit labels/order there.
- **Status states & colors:** edit the status maps in [SellerHome.jsx](src/pages/seller/SellerHome.jsx)
  and [SubmissionStatus.jsx](src/pages/seller/SubmissionStatus.jsx).
- **Seed content:** buyers, requests, alerts, and the MDR rate come from
  [mockData.js](src/data/mockData.js).
- **Onboarding docs / KYC list:** the 5 required documents are defined in
  [SellerOnboard.jsx](src/pages/seller/SellerOnboard.jsx).

---

## 9. One-glance flow
```
Login ─┬─ Seller (active) ──→ SellerApp [Home · Money · Alerts]
       │        ├─ New Request → CreateInvoice (Invoice → Terms → MDR → Sign+OTP) → SubmissionStatus
       │        └─ Invite Buyer → AddBuyerSheet (WhatsApp/SMS/Email)
       │
       └─ New Seller ──→ SellerOnboard:  PRE(details+5 docs) → PENDING(review/correction)
                                          → POST(MDR + contract + OTP) → DONE → Home
```
**Essence:** a seller onboards via KYC → MDR/contract → live, then works a dashboard whose two
jobs are **create financing requests against buyer invoices** and **track them to disbursement**,
while **growing their buyer credit circle** — gated by scroll-to-agree + OTP and surfaced through
a status-color language shared with the admin pipeline.
```
