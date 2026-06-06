# Doc Collection — Deal Detail View (UI reference)

A naming + customization guide for the screen you see at
**Pipeline → Zahrani Trading Co. (FR-0047)** when a deal is at the **Doc Collection** stage.
Use the names below to talk about the screen, and the "How to customize" section to change
how it looks.

> The whole screen is rendered by one component: **`CardDetailPage`** in
> [`src/pages/admin/Pipeline.jsx`](src/pages/admin/Pipeline.jsx) (lines 265–1868). It opens
> when you click any deal card in the Pipeline list.

---

## 1. What this screen is — layout map

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Pipeline / FR-0047     🏪 Zahrani Trading Co.   👤 Q Parts Co.    1 / 9  ‹ › │  ← Deal Context Bar
├────────────────────────────────────────────────────────────────────────────┤
│  SALES ● Doc Collection │ OPS ○ Checking Docs │ CREDIT ○ Credit Review …     │  ← Stage Progress Tracker
│  └─ Department Lane ──┘   └─ Department Lane ┘   (each ○/● = a Stage Step)    │     (Department Lanes + Stage Steps)
├──────────────────────────────────────────────────────────┬─────────────────┤
│  CUSTOMER & BASIC INFO   (persistent band — both tabs)   │                   │
│  [ Overview ]  [ Documents (3) ]               ← Detail Tabs                  │
│                                                          │   Activity panel  │
│  ✦ Yumnai Briefing             (Yumnai Briefing)         │   (Chatter /      │
│  Finance Request               (Finance Request panel)   │    Timeline)      │
│  Required Documents  ☐☐☐       (Required Documents)      │                   │
│                                                          │                   │
└──────────────────────────────────────────────────────────┴─────────────────┘
```

**Quick answer to the two naming questions**

- **"progress step"** → the individual circle-and-label nodes = **Stage Steps**, which live
  inside the **Stage Progress Tracker** (row 2).
- **"swimlane status section"** → the `SALES / OPS / CREDIT / LEGAL` bands that group those
  steps by team = **Department Lanes** (a.k.a. *Swimlanes / Phase groups*).

> ⚠️ Don't confuse this with the **main Pipeline board swimlanes** — that's the kanban *list*
> view (Pipeline.jsx ~2290–2412) where each lane is a column of cards. On *this* detail
> screen, the "swimlane" is just the team-banded progress tracker.

---

## 2. Element glossary

| # | Name (use this) | What it is | Code anchor |
|---|---|---|---|
| 1 | **Deal Detail View** | The whole screen (code: `CardDetailPage`) | [Pipeline.jsx:265](src/pages/admin/Pipeline.jsx#L265) |
| 2 | **Deal Context Bar** | Top row: breadcrumb + party chips + pager | [Pipeline.jsx:569-613](src/pages/admin/Pipeline.jsx#L569-L613) |
| 2a | **Deal Breadcrumb** | `Pipeline / FR-0047` | ~:569 |
| 2b | **Merchant chip** | 🏪 Zahrani Trading Co. (the seller) | ~:585 |
| 2c | **Buyer chip** | 👤 Q Parts Co. (the customer) | ~:595 |
| 2d | **Card pager** | `1 / 9` + ‹ › prev/next | ~:600 |
| 3 | **Stage Progress Tracker** | Row 2 — the full horizontal stage row (code comment: "Pipeline Stage Bar") | [Pipeline.jsx:615-675](src/pages/admin/Pipeline.jsx#L615-L675) |
| 3a | **Department Lanes** *(Swimlanes)* | The `SALES / OPS / CREDIT / LEGAL` bands. Data: `STAGE_GROUPS` | [Pipeline.jsx:15-22](src/pages/admin/Pipeline.jsx#L15-L22), render :618/:625 |
| 3b | **Stage Step** *(Stage node)* | One circle + label (Doc Collection, Checking Docs…). Data: `PIPELINE_STAGES` | [mockData.js:653](src/data/mockData.js#L653), render :628-666 |
| 4a | **Customer & Basic Info** card | White card above the tabs (shown on both tabs). **Collapsible** via the chevron toggle (top-right): collapsed = Seller + Buyer only; expanded = all fields. **Scrolls away** with the content under the Stage Progress Tracker. | [Pipeline.jsx:685](src/pages/admin/Pipeline.jsx#L685) |
| 4b | **Detail Tabs** | `Overview` \| `Documents (n)` — **sticky** directly under the Stage Progress Tracker while you scroll | [Pipeline.jsx:760-775](src/pages/admin/Pipeline.jsx#L760-L775) |
| 6 | **Yumnai Briefing** panel | AI attention items + suggested actions | [Pipeline.jsx:898](src/pages/admin/Pipeline.jsx#L898) |
| 7 | **Finance Request** panel | Amount / Tenure / MDR, fee structure, outcomes, repayment schedule | [Pipeline.jsx:1239](src/pages/admin/Pipeline.jsx#L1239) |
| 8 | **Required Documents** checklist | The doc-collection block (verify/request docs) | [Pipeline.jsx:1043](src/pages/admin/Pipeline.jsx#L1043) |
| 9 | **Document List rail** | Left 300px list in the Documents tab | [Pipeline.jsx:707](src/pages/admin/Pipeline.jsx#L707) |
| 10 | **Document Preview pane** | Right side of the Documents tab (status, meta, notes, actions) | [Pipeline.jsx:704-810](src/pages/admin/Pipeline.jsx#L704-L810) |
| 11 | **Activity panel** *(Chatter / Timeline)* | Right column: Send message / Log note + history | [Pipeline.jsx:147-261](src/pages/admin/Pipeline.jsx#L147-L261) |

---

## 3. Stage Progress Tracker — deep dive

The tracker is two nested concepts:

- **Department Lanes** — defined by `STAGE_GROUPS` ([Pipeline.jsx:15-22](src/pages/admin/Pipeline.jsx#L15-L22)).
  Each lane has a `label` (the grey uppercase band — `SALES`, `OPS`, `CREDIT`, `LEGAL`) and a
  list of `stages` it owns. Lanes are separated by a `|` divider.
- **Stage Steps** — each stage in `PIPELINE_STAGES` ([mockData.js:653](src/data/mockData.js#L653))
  renders as a circle + label inside its lane, separated by `›`.

**The four step states** ([Pipeline.jsx:632-666](src/pages/admin/Pipeline.jsx#L632-L666)):

| State | When | Look |
|---|---|---|
| **Completed** | step is before the current stage | circle `#f0f0f0` fill with a `✓`, label `#a3a3a3` |
| **Current** | step == the deal's stage | **light-green pill** `#dcfce7` with `#86d6a3` border, green dot `#16a34a`, label `#15803d` **bold** — so the active stage is obvious |
| **Upcoming** | step is after the current stage | empty circle, border `#e5e5e5`, label `#525252` |
| **N/A** | onboarding deals on `risk`/`repayment`/`overdue` | whole step dimmed to `opacity: 0.3` |

The current stages for FR-0047 is **Doc Collection** (`submitted`). Clicking another step
calls `handleMoveStage` to move the deal.

**The 9 stages** (`id` → on-screen `label`):
`submitted` → Doc Collection · `kyc` → Checking Docs · `credit_score` → Credit Review ·
`risk` → Risk Assessment · `legal` → Document Signing · `approved` → Contract / Agreement ·
`disbursed` → Onboarding · `repayment` → Repayment · `overdue` → Rejected by Credit.

---

## 4. Overview tab — panels

**Customer & Basic Info** is now a **persistent band above the tabs** (visible on both the
Overview and Documents tabs), not part of the Overview tab — 2-column grid: Seller (Merchant),
Buyer (Customer), Assigned To, Days in Stage, Contact Person/Email/Phone, Process Type badge
(💼 Invoice Finance / 🚀 Onboarding), and Buyer Credit (limit/used/remaining). Labels are 10px
uppercase `#a3a3a3`; values 13px `#262626`; links use `--color-primary`.

The **Overview tab** itself now starts with Yumnai Briefing, top to bottom:

- **Yumnai Briefing** (heading `✦ Yumnai Briefing`)
  + an animated pulse dot (`@keyframes yumnai-pulse`), a list of attention items, and a
  suggested action (e.g. **Send Request →**) driven by `card.yumnaiSuggestion`.
- **Finance Request** ([:1239](src/pages/admin/Pipeline.jsx#L1239)) — Amount / Tenure / MDR
  headline, Fee Structure (who bears cost + EMI frequency), Deal Outcomes, and the Repayment
  Schedule table. Left border uses the stage color.
- **Required Documents** ([:1043](src/pages/admin/Pipeline.jsx#L1043)) — the doc-collection
  checklist: a `verified / total` progress badge and a toggle per document
  (verified / pending / missing).

---

## 5. Documents tab

- **Document List rail** ([:707](src/pages/admin/Pipeline.jsx#L707)) — fixed 300px, `#fafafa`
  background. Each row: status icon (`✓` / `✗` / `○`) + name + status pill.
- **Document Preview pane** ([:704-810](src/pages/admin/Pipeline.jsx#L704-L810)) — header with
  doc icon + name + status selector, a meta grid (FR id, Buyer, Stage, Days in Stage), a Notes
  textarea, and actions (**Request from buyer →**, **✓ Mark as Verified**).

Status pill colors come from **`statusColor()`** ([Pipeline.jsx:42](src/pages/admin/Pipeline.jsx#L42)):
`verified` → `#262626` on `#f5f5f5`, `pending` → `#525252` on `#f5f5f5`, `missing` → `#737373`
on `#f0f0f0`.

---

## 6. Activity panel (Chatter / Timeline)

`ChatterPanel` ([Pipeline.jsx:147](src/pages/admin/Pipeline.jsx#L147)) — the right column, laid
out like a **chat window**: the timeline (history, correspondence, payments, notes) fills the
top and scrolls; **Send message** / **Log note** and the composer are docked at the **bottom**
(tapping a button reveals the textarea + Send/Discard).

**Yumnai AI bubbles** (`entry.from === 'Yumnai AI'`) are branded and differentiated: a pastel
theme-gradient background (`linear-gradient(135deg,#efedff,#e9edff,#e6f4ff)` + soft purple
border), the gradient `/yumnai.svg` mark, and a "Yumnai" label in `--color-primary`, with dark
text for contrast. Human/System entries stay neutral (`#fafafa`). To restyle the AI bubble,
edit the `isYumnai` branch in the correspondence block.

---

## 7. How to customize

### Global look (affects the whole app)
Edit the design tokens in [`src/index.css`](src/index.css) `@theme` block:

| Token | Controls | Default |
|---|---|---|
| `--color-primary` | Breadcrumb link, active **Detail Tab** underline, primary buttons (e.g. *Send Request*) | `#9084fd` |
| `--color-primary-soft` | Soft purple backgrounds / highlights | `#efedff` |
| `--radius-sm/md/lg` | Card corner radii | `12 / 16 / 24px` |
| `--shadow-card` | Panel/card shadows | see file |

Changing `--color-primary` instantly recolors the breadcrumb, the active tab, and every
primary button across the dashboard.

### This screen's greys are hardcoded
The Stage Progress Tracker, section labels, and most panel chrome use **inline hex greys**
(not tokens). To restyle them you edit the values directly in
[`src/pages/admin/Pipeline.jsx`](src/pages/admin/Pipeline.jsx). The palette in use:

```
#171717  current step / strong ink     #a3a3a3  muted labels, completed step
#262626  primary values                #c4c4c4 / #d4d4d4  dividers
#404040  body text                     #e5e5e5  upcoming-step border, hairlines
#525252  secondary values / labels     #f0f0f0 / #f5f5f5  pill & chip backgrounds
#737373  tertiary / "missing"          #fafafa  Document List rail background
```

### Content / structure changes
- **Rename a stage or relabel a Stage Step** → edit the `label` in `PIPELINE_STAGES`
  ([mockData.js:653](src/data/mockData.js#L653)). e.g. change `'Doc Collection'`.
- **Regroup the Department Lanes (swimlanes)** → edit `STAGE_GROUPS`
  ([Pipeline.jsx:15-22](src/pages/admin/Pipeline.jsx#L15-L22)) — move stage ids between lanes
  or rename a lane `label`.
- **Step state colors** → edit the inline styles at
  [Pipeline.jsx:648-666](src/pages/admin/Pipeline.jsx#L648-L666).
- **Document status pill colors** → edit `statusColor()`
  ([Pipeline.jsx:42](src/pages/admin/Pipeline.jsx#L42)).
- **Add/remove a Detail Tab** → edit the tab array at
  [Pipeline.jsx:686-689](src/pages/admin/Pipeline.jsx#L686-L689).
