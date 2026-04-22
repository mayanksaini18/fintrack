# Kharcha — Design System
## Inspired by supermemory.ai

---

## Philosophy

Dark-first. Premium. Spatial. The UI should feel like looking through frosted glass at a lit room — depth, glow, and calm. Every surface is semi-transparent; ambient light bleeds through. No harsh edges, no flat white boxes. The app feels like an intelligent system, not a spreadsheet.

---

## Color Palette

### Background
| Token | Value | Use |
|-------|-------|-----|
| `--background` | `#09090c` (oklch 0.09 0.005 277) | Page background — near-black, cool violet tint |
| `--surface-1` | `rgba(255,255,255,0.04)` | Card base — barely-there white |
| `--surface-2` | `rgba(255,255,255,0.07)` | Elevated surfaces, hovered cards |
| `--surface-3` | `rgba(255,255,255,0.11)` | Active / selected states |

### Accent — Violet
| Token | Hex | OKLCH |
|-------|-----|-------|
| `--accent-1` | `#3b1f82` | oklch(0.30 0.18 277) — darkest violet for subtle bg tints |
| `--accent-2` | `#7c3aed` | oklch(0.47 0.26 277) — deep violet, CTA backgrounds |
| `--accent-3` | `#8b5cf6` | oklch(0.56 0.24 277) — primary violet, main interactive color |
| `--accent-4` | `#a78bfa` | oklch(0.67 0.22 277) — light violet, text links, icons |
| `--accent-5` | `#ddd6fe` | oklch(0.88 0.10 277) — palest violet, gradient text endpoint |

### Text
| Role | Value |
|------|-------|
| Primary | `oklch(0.95 0 0)` — near white |
| Secondary | `oklch(0.65 0 0)` — muted, ~40% opacity feel |
| Tertiary | `oklch(0.45 0 0)` — very muted labels |
| Gradient heading | `from-white via-violet-200 to-violet-400` |

### Semantic
| Color | Value | Use |
|-------|-------|-----|
| Success | `#10b981` (emerald-500) | Income, positive trends |
| Danger | `#f43f5e` (rose-500) | Expenses, alerts, over-budget |
| Warning | `#f59e0b` (amber-500) | Budget warnings, caution |

### Borders
| Name | Value |
|------|-------|
| Default | `rgba(255,255,255,0.08)` |
| Hover | `rgba(255,255,255,0.14)` |
| Focus/Active | `rgba(139,92,246,0.5)` — violet glow border |

---

## Typography

**Font**: Geist (already loaded via Next.js)

| Role | Size | Weight | Notes |
|------|------|--------|-------|
| Hero heading | 3xl–5xl | 700 | Gradient text effect |
| Section heading | xl–2xl | 600 | Near-white |
| Card value | 24–28px | 600 | Tabular nums, tight tracking |
| Label | 11px | 500 | Uppercase, wide letter-spacing |
| Body | 14px | 400 | Secondary text color |
| Caption | 11–12px | 400 | Muted tertiary |

---

## Spacing & Radius

| Token | Value |
|-------|-------|
| `--radius` | `0.75rem` (12px) — cards |
| Card padding | `20–24px` |
| Section gap | `20px` (`gap-5`) |
| Inner component gap | `12–16px` |

---

## Glass Morphism System

The signature visual treatment. Applied to all cards, sidebar, header.

```css
/* Standard glass card */
background: rgba(255, 255, 255, 0.04);
border: 1px solid rgba(255, 255, 255, 0.08);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border-radius: 16px;

/* Elevated glass (hover / dialog) */
background: rgba(255, 255, 255, 0.07);
border: 1px solid rgba(255, 255, 255, 0.13);
backdrop-filter: blur(32px);

/* Sidebar / Nav glass */
background: rgba(9, 9, 12, 0.85);
border-right: 1px solid rgba(255, 255, 255, 0.06);
backdrop-filter: blur(24px);
```

---

## Ambient Glow System

Radial gradient orbs are fixed in the background, giving the page depth and warmth.

```
Top-left orb   — violet  — 600×600px  — opacity 10%  — blur 120px
Right-center   — blue    — 500×500px  — opacity  8%  — blur 120px
Bottom-center  — violet  — 400×400px  — opacity  8%  — blur 100px
```

These are `pointer-events-none`, `position: fixed`, `z-index: -1`.

---

## Components

### Button — Primary
```
Background: linear-gradient(135deg, #7c3aed → #6d28d9)
Border: none
Box-shadow: 0 0 20px rgba(124, 58, 237, 0.4) — violet glow
Hover: brightness 1.1 + increased glow
Border-radius: 10px
```

### Button — Secondary (outline)
```
Background: rgba(255,255,255,0.05)
Border: 1px solid rgba(255,255,255,0.10)
Hover: rgba(255,255,255,0.09) background
```

### Card
```
Glass: see Glass Morphism above
On hover: border transitions to rgba(255,255,255,0.14)
Subtle inner shadow for depth
```

### Summary / Stat Card
```
Left border accent: 2px violet gradient line
Value text: large, near-white, tabular
Label: 11px uppercase muted
Trend badge: pill shaped, emerald/rose bg at 15% opacity
```

### Sidebar
```
Full-height glass panel
Brand area: Logo + "Kharcha" wordmark
Nav items: text-white/50 default, text-white bg-white/8 active
Bottom: user avatar + name + email
```

### Header / Top Bar
```
Height: 52px, sticky
Glass: bg-[#09090c]/80 + backdrop-blur
Border-bottom: rgba(255,255,255,0.06)
Page title left, actions right
```

### Chart Cards
```
Glass card wrapping Recharts
Chart grid lines: rgba(255,255,255,0.06)
Axis text: rgba(255,255,255,0.4)
Tooltip: glass with backdrop-blur
Data colors: violet primary, emerald income, rose expense
```

---

## Motion & Animation

- Card entrance: `fade-in` + `slide-in-from-bottom-3`, 80–200ms staggered
- Hover transitions: `200ms ease` for bg/border/shadow
- Glow pulse (optional, used on primary CTA): subtle `@keyframes` scale glow opacity 0.4→0.7
- No jarring transforms — everything is smooth and subtle

---

## Dark Mode Only

This design is dark-first. Light mode retains the existing zinc/white clean design for accessibility. Dark mode is the premium default experience.

---

## Implementation Checklist

- [x] `globals.css` — dark mode CSS vars updated to violet accent
- [x] `ThemeProvider` — default to dark
- [x] `app/(app)/layout.tsx` — ambient glow orbs background
- [x] `Sidebar` — glass + violet active states
- [x] `Header` — glass backdrop
- [x] `SummaryCards` — glass cards with violet accents
- [x] `BalanceTrendChart` — glass card + chart recolor
- [x] `SpendingBreakdownChart` — glass card
- [ ] Transactions table — glass container
- [ ] Budgets — glass cards
- [ ] AI Chat — glass messages
- [ ] Mobile nav — glass bottom bar
