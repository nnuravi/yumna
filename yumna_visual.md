# Yumna — Visual Direction & Design System

A reference for building the **Yumna mobile web flow (PWA)** and **dashboard** so they feel like one product with the existing landing site. Hand this file to a UI tool/designer as the source of truth.

---

## 1. Brand essence

- **Who:** Yumna (يُمنى) — a **CMA-regulated, Sharia-compliant Saudi (KSA) fintech** for trade credit & financing. Tagline: *"The right hand for every trade."*
- **Personality:** trustworthy, modern, calm, premium, institutional-but-human. Not flashy.
- **Market:** KSA-first. **Arabic + English, full RTL ↔ LTR.** Arabic is the default.
- **Logo:** colorful gradient mark (`logo.png`, icon) + wordmark "Yumna يُمنى" (`wordmark.png/svg`). On dark surfaces, recolor the SVG wordmark white (`brightness-0 invert`).
- **Design ethos:** **shadow-light, hairline borders, generous whitespace, full-bleed (no boxy max-width cage), one accent color.** Clean over decorative.

---

## 2. Color system

Single accent (lavender/violet) on a soft off-white canvas with near-black ink text. Greens are reserved for success/verification only.

```css
/* Core tokens (CSS custom properties) */
--color-ink:           #0b0f19;  /* primary text, dark surfaces, footer */
--color-ink-soft:      #374151;  /* secondary text on light */
--color-muted:         #6b7280;  /* tertiary text, captions, icons */
--color-line:          #e5e7eb;  /* hairline borders, dividers, track bg */
--color-page:          #edeef1;  /* app/page background (off-white) */
--color-card:          #f6f6f8;  /* subtle raised surface */
--color-primary:       #8f85ff;  /* brand accent — CTAs, active, links */
--color-primary-hover: #7d72f5;  /* accent pressed/hover */
--color-white:         #ffffff;  /* cards, inputs, sheets */
```

**Semantic / status (use sparingly):**
- Success / approved / verified: `emerald-500 #10b981` (text on tints `emerald-50/600`).
- Live/online dot: `emerald-500`.
- Soft accent tint (selected option, success circle bg): `color-mix(in srgb, var(--color-primary) 12%, #fff)`.
- Error/destructive: `#e5484d` (rose) — not used on the site yet; introduce only for form errors.
- Info: reuse `--color-primary`.

**Usage rules**
- Backgrounds: `--color-page` for the app canvas; `#fff` for cards/sheets/inputs; `--color-card` for a barely-raised panel; `--color-ink` for dark/hero surfaces.
- Text on light: ink → ink-soft → muted (3 levels). Text on dark (`--color-ink`): `white`, `white/80`, `white/55-60`.
- **Borders are hairlines:** `rgba(11,15,25,0.05)` (`border-black/5`) or `--color-line`. Avoid heavy borders.
- One accent only. Don't introduce secondary brand colors; vary with neutral grays + opacity instead.

**Optional dark surface** (hero/login splash precedent): bg `#0b0f19`, text white, glass cards `rgba(11,15,25,0.45)` + `backdrop-blur`, border `white/10`.

---

## 3. Typography

Two families, self-hosted via next/font; **always pair a Latin font with an Arabic fallback** in the same stack.

| Role | Latin | Arabic | Weight |
|---|---|---|---|
| Display / headings (`.display`) | **Sora** | **Tajawal** | 600 (LTR) / 500 (RTL) |
| Body / UI (default) | **Inter** | **Noto Sans Arabic** | **300** (Light) base |

```css
--font-display: var(--font-sora),  var(--font-tajawal),     ui-sans-serif, system-ui, sans-serif;
--font-sans:    var(--font-inter), var(--font-noto-arabic), ui-sans-serif, system-ui, sans-serif;
body { font-family: var(--font-sans); font-weight: 300; }
.display { font-family: var(--font-display); font-weight: 600; letter-spacing: -0.02em; }
[dir="rtl"] .display { font-weight: 500; letter-spacing: -0.005em; }  /* Arabic titles lighter, less negative tracking */
```

**Type scale** (px; mobile → desktop). Headings use `.display`; everything else uses the sans body.
- Display XL (hero): 30 → 44–60, line-height ~1.05, tracking -0.02em
- H1 / section: 30 → 56
- H2 / sub-section: 24 → 32
- Card / screen title: 18–24
- **Body (primary): 15.5px**, line-height 1.6–1.7 (the house body size)
- Body small / secondary: 13–14.5px
- Caption / helper: 11.5–12.5px
- **Eyebrow / label: 10.5–11.5px, UPPERCASE, `font-weight 600`, `letter-spacing 0.12–0.18em`, color muted/gray-400–500**
- Numerics/amounts: add `font-variant-numeric: tabular-nums` (`.tabular`).

**Arabic specifics:** use Arabic-Indic digits in AR (`٠١٢٣٤٥٦٧٨٩`) for counters, amounts, dates. Don't force `uppercase`/`letter-spacing` on Arabic eyebrows (no case in Arabic; keep tracking subtle). Body weight 300 reads well in both.

---

## 4. Spacing, layout & grid

- **Spacing scale:** 4px base (Tailwind). Common steps: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
- **Screen padding (mobile):** 20px sides (`px-5`). Tablet 32 (`sm:px-8`), desktop 48 (`lg:px-12`).
- **Section rhythm (marketing/long pages):** `py-16 / sm:py-20 / lg:py-28`.
- **Full-bleed:** content stretches edge-to-edge inside the screen padding; **no centered max-width cage** for page surfaces. Constrain *text measure* with `max-w-xl/2xl` only.
- **Cards:** inner padding `p-6 → sm:p-8`. Grids: `gap-5/6` (cards), `gap-8/10` (columns).
- **Two-column pattern** (content + device/visual): content ~58% / visual ~42% on desktop, **stacks to one column on mobile** (content first, visual after).
- **Mobile grids:** start `grid-cols-1`; never use 12-col with large gaps on mobile (the gaps don't shrink and cause overflow). Use `overflow-x: clip` on the root as a safety net.

---

## 5. Radii, borders, elevation

- **Radii:** inputs/small `rounded-xl` (12px) · cards `rounded-2xl` (16px) · large cards/sheets `rounded-3xl` (24px) · pills/buttons/chips `rounded-full` · phone/device mock `~2.2rem`.
- **Borders:** hairline only — `border-black/5` (`rgba(11,15,25,0.05)`) or `--color-line`. On dark: `white/10`.
- **Elevation:** prefer **flat + hairline**. When needed: `shadow-sm` for resting cards; soft deep shadow for floating/device, e.g. `0 24px 60px -24px rgba(11,15,25,0.35)`; toast `0 12px 30px -10px rgba(11,15,25,0.4)`. Avoid stacked heavy shadows.
- **Glass** (over imagery/dark): `bg rgba(255,255,255,0.6) + backdrop-blur(12px)` (light) or `rgba(11,15,25,0.45) + blur` (dark).

---

## 6. Iconography

- **Stroke icons**, Lucide/Feather style: `viewBox 0 0 24 24`, `fill none`, `stroke currentColor`, `stroke-width 1.7–2.2`, round caps/joins. Size 14–20 inline, 24–30 feature.
- Color: inherit text color (muted by default, ink/primary when active).
- Avoid filled/duotone icon sets. Keep them light to match the type.

---

## 7. Core components (specs)

**Primary button (`cta-primary`)**
- bg `--color-primary`, text white, `rounded-full`, padding `14px 26px`, font 14/600, gap 14px.
- Optional trailing **arrow in a white circle** (30px, icon color = primary). Hover: `translateY(-1px)` + `--color-primary-hover`. Disabled: `opacity-40`, no pointer.
- **Joined input+button pill** (entry CTA): one `rounded-full` bordered container; transparent input (`flex-1`) + solid primary button tucked at the trailing edge. Focus ring on the whole group (`focus-within:ring-2 ring-primary/20`).

**Secondary / pill button:** white bg, `border-black/5`, ink text, `rounded-full`, `px-4 py-2`, 12–13/600. Optional leading status dot (`emerald-500`).

**Inputs / fields:** `rounded-xl border-gray-200 bg-white px-4 py-3 text-[15px]`, placeholder `gray-400`; focus `border-primary` + `ring-2 ring-primary/20`. Label above: eyebrow style (uppercase 10.5px tracking). Phone/email/amount inputs force `dir="ltr"` even in RTL.

**Chips / tags:** small `rounded-full border-black/5 bg-gray-50 px-2.5 py-1 text-[11px] text-gray-600`. Selected/“collected” chips: `bg-gray-100` neutral, or accent tint when chosen. (A glass `.chip` variant exists for over-imagery: translucent white + blur, uppercase.)

**Selectable option (radio-as-card / pill):** default `border-line bg-white`; hover darker border; **selected** `border-primary` + soft purple tint bg (`color-mix … 10–12%`), weight 600.

**Cards:** `rounded-2xl border-black/5 bg-white p-6/7` (+ optional `shadow-sm`). Hover (interactive): `-translate-y-1 scale-[1.02]` + `shadow-xl`, 300ms.

**Stat / KPI card (dashboard):** white card, eyebrow label (uppercase muted) + big `.display`/`.tabular` number + small delta/caption. Accent the number or a tiny sparkline in `--color-primary`.

**Badges / status:** pill, tinted bg + colored text. Approved/verified → emerald (`bg-emerald-50 text-emerald-600`); pending → gray; action-needed → primary tint; rejected → rose tint. Include a small dot or check icon.

**Toggle (language / setting):** track white `rounded-full` + sliding **knob in `--color-primary`**, active label white. (`EN / ع`.)

**Segmented progress / stepper:** either equal segments (filled = primary, rest = `--color-line`) or a **single track** (`bg-line`, `rounded-full`) with a primary fill animating width. Fill anchors to the **inline-start** (RTL-safe).

**Avatar:** circle, initial in white on `--color-primary` (or `--color-ink`). Brand "assistant" bubble uses the **logo mark** as the avatar.

**Toast:** small white card, `rounded-xl`, ring + soft shadow, leading status circle (emerald check), slides up + fades in. Auto-dismiss.

**Chat bubble (conversational flows):** light gray bubble (`bg-gray-100`) with one squared corner toward the avatar (`rounded-2xl rounded-ss-sm`), 16px medium text.

---

## 8. Overlays, sheets & layering

- **Mobile:** prefer **bottom sheets** (rounded top `rounded-t-3xl`, drag handle pill, `bg-white`) for actions/forms; full-screen takeover for multi-step flows.
- **Desktop/dashboard:** centered **modal/dialog** — backdrop `bg-black/50 + backdrop-blur-sm` (click to close), white panel `rounded-2xl`, header (title + ✕), body. Close on Escape + backdrop; lock body scroll.
- **z-index scale (keep consistent):** header `40` · mobile drawer `50` · primary flow overlay `60` · auth/login overlay `70` · dialog `80` · global loader/splash `100`.
- Full-viewport flows have their **own minimal header** (logo + language + account) and a prominent **Back**, not the main nav.

---

## 9. Motion

Calm, quick, purposeful. House easing: **`cubic-bezier(0.2, 0.7, 0.2, 1)`** (entrances) and `cubic-bezier(0.4, 0, 0.2, 1)` (linear-ish progress).

- **Entrance (mount):** fade + 8px rise, ~0.7s, slight stagger (`0.05s` steps).
- **Scroll reveal:** fade + 18px rise, 0.6s, triggered by IntersectionObserver (reveal once); stagger cards by ~90ms.
- **Page/section content swap:** 0.45s fade + small slide.
- **Progress fill / upload:** width 0→100 over ~1.6s.
- **Spinners:** simple rotating ring in primary.
- **Brand loader / splash:** breathing logo (scale 1→1.06) + an indeterminate primary sweep bar; min ~1.1s then fade out.
- **Durations:** micro 150–250ms (hover/press), standard 300–450ms, expressive 500–700ms.
- **Always** honor `prefers-reduced-motion`: disable transforms/loops, show final state.

---

## 10. RTL & internationalization (first-class)

- Default **Arabic / RTL**; English / LTR is the toggle. Persist choice (localStorage) + respect `?lang=` and browser language.
- Build with **logical properties** (`ps-/pe-`, `ms-/me-`, `start/end`, `text-start`) and the `rtl:` variant — never hardcode left/right.
- **Mirror:** layout columns, horizontal sliders (flip translate sign), nav, arrows (`rtl:-scale-x-100`), toast/drawer entry side, progress fill direction.
- **Don't mirror:** the top app bar's logo+controls cluster (keep it `dir="ltr"` so brand stays leading-edge), and LTR data inputs (phone/email/amount/IBAN).
- Arabic-Indic digits for numbers in AR; provide a digit-localization helper.
- Headings: Arabic uses the lighter display weight (500) + reduced negative tracking.

---

## 11. PWA mobile app shell

- **Top bar:** logo (leading) + page title (optional) + 1–2 actions (notifications, account/avatar) + language toggle. Sticky, transparent→solid on scroll; hairline divider.
- **Bottom tab bar (primary mobile nav):** 4–5 items, stroke icons + 11px labels, active = `--color-primary` (icon + label), inactive = muted. White bg, hairline top border, **safe-area padding** (`env(safe-area-inset-bottom)`).
- **Screen background:** `--color-page`; content cards in white.
- **Forms / flows:** one question/step per screen (conversational), segmented progress at top, sticky primary CTA at bottom; use bottom sheets for pickers.
- **Empty states:** centered logo/illustration + one line + a primary action.
- **PWA chrome:** `theme-color #edeef1` (light) / `#0b0f19` if a dark shell; maskable icon from the brand mark; splash uses the brand loader; standalone display; offline fallback screen in the same style.
- **Touch targets:** ≥ 44px. Inputs comfortable (`py-3`+). Respect safe areas top/bottom.

---

## 12. Dashboard (web/responsive)

- **Frame:** left **side nav** (collapsible; in RTL it's on the right) with logo at top, grouped stroke-icon items, active item = primary tint pill; top bar with search, language, account menu. Content area on `--color-page`.
- **Layout:** responsive card grid (`gap-6`), `rounded-2xl` white cards, hairline borders, minimal shadows.
- **KPI row:** 3–4 stat cards (eyebrow label + tabular number + delta). One primary-accented highlight card allowed.
- **Charts:** primary `#8f85ff` for the main series, neutrals/`--color-line` for grid/axes, emerald for positive. Keep them clean, few gridlines, rounded line caps.
- **Tables / lists:** hairline row dividers, generous row height, status **badges**, row hover `bg-gray-50`. On mobile, collapse tables into stacked cards.
- **Detail / record pages:** header (title + status badge + actions), summary cards, timeline/stepper (reuse the segmented progress), document list with verify states (AI / human review → emerald check), action buttons.
- **Account menu:** avatar pill → dropdown (signed-in id, settings, sign out).

---

## 13. Accessibility & quality bar

- Contrast: ink/ink-soft on light pass AA; check primary `#8f85ff` text only on white at ≥16px/bold, otherwise use it for fills not small text.
- Visible focus rings (`ring-2 ring-primary/20` + border-primary).
- All interactive elements are real buttons/links with labels; icons get `aria-label`.
- Honor reduced-motion; don't convey state by color alone (pair with icon/text).
- No horizontal overflow at 360–390px; test EN **and** AR for every screen.

---

## 14. Quick token reference (copy/paste)

```json
{
  "color": {
    "ink": "#0b0f19", "inkSoft": "#374151", "muted": "#6b7280",
    "line": "#e5e7eb", "page": "#edeef1", "card": "#f6f6f8",
    "primary": "#8f85ff", "primaryHover": "#7d72f5",
    "white": "#ffffff", "success": "#10b981", "danger": "#e5484d"
  },
  "radius": { "sm": "12px", "md": "16px", "lg": "24px", "pill": "9999px" },
  "font": { "display": "Sora / Tajawal", "body": "Inter / Noto Sans Arabic", "bodyWeight": 300, "displayWeight": 600 },
  "text": { "body": "15.5px", "small": "13px", "caption": "12px", "eyebrow": "11px/UPPERCASE/0.16em" },
  "space": [4,8,12,16,20,24,32,40,48,64],
  "easing": { "entrance": "cubic-bezier(0.2,0.7,0.2,1)", "progress": "cubic-bezier(0.4,0,0.2,1)" },
  "shadow": { "card": "shadow-sm", "float": "0 24px 60px -24px rgba(11,15,25,0.35)" },
  "z": { "header": 40, "drawer": 50, "flow": 60, "auth": 70, "dialog": 80, "loader": 100 },
  "dir": "rtl-default, logical-properties, mirror-everything-except-appbar-and-ltr-inputs"
}
```

**One-line summary:** Off-white canvas, near-black ink, a single lavender accent (`#8f85ff`), Sora/Tajawal headings + Inter/Noto-Arabic light body, hairline borders & soft shadows, rounded-2xl cards & pill buttons, calm 0.3–0.6s motion, **RTL-first** — clean, premium, trustworthy KSA fintech.
