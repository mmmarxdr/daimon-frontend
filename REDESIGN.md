# MicroAgent Dashboard — Redesign Brief

A comprehensive design specification for transforming the MicroAgent dashboard from its current light/slate aesthetic into a dark, minimal, Vercel-inspired interface. The goal: feel like a professional CLI tool got a beautiful web companion — not a SaaS marketing site.

---

## Current State Analysis

### What exists today
- **Theme**: Light default (#F5F5F0 warm beige) with dark mode (#0F172A slate-900)
- **Accent**: Indigo (#6366F1) — the classic "AI purple" cliche
- **Fonts**: Geist + Inter via Google Fonts import
- **Cards**: `rounded-lg shadow-sm` with background fill — visible shadows in dark mode (sloppy)
- **Sidebar**: 240px expanded, 56px collapsed, indigo active indicator
- **Layout**: Token system via CSS variables (good foundation to build on)

### What needs to change
- Drop the warm beige light theme entirely — dark-only or dark-default
- Replace indigo accent with a single intentional color
- Remove Google Fonts import (Geist is already local or use system stack)
- Strip shadows from dark surfaces — they are invisible/ugly
- Tighten border radii — `rounded-lg` (8px) max, prefer `rounded-md` (6px)
- Kill any remaining "AI glow" or gradient tendencies

---

## Color System

### Backgrounds
| Token | Value | Usage |
|-------|-------|-------|
| `--color-background` | `#0a0a0a` | Page background, body |
| `--color-surface` | `#111111` | Cards, panels, sidebar |
| `--color-hover-surface` | `#1a1a1a` | Hover states, elevated elements |
| `--color-logs-alt-row` | `#0f0f0f` | Alternating table rows |

### Borders
| Token | Value | Usage |
|-------|-------|-------|
| `--color-border` | `#222222` | Default borders, dividers |
| `--color-border-strong` | `#333333` | Emphasis borders, focus rings |

### Text
| Token | Value | Usage |
|-------|-------|-------|
| `--color-text-primary` | `#fafafa` | Headings, body text, values |
| `--color-text-secondary` | `#888888` | Labels, descriptions, metadata |
| `--color-text-disabled` | `#555555` | Placeholders, disabled states |

### Accent — Emerald
One color. No gradients. No secondary accent.

| Token | Value | Usage |
|-------|-------|-------|
| `accent` | `#10b981` | Primary actions, active states, links |
| `accent-hover` | `#059669` | Hover on accent elements |
| `accent-light` | `rgba(16, 185, 129, 0.1)` | Subtle backgrounds (active nav, badges) |
| `accent-light-border` | `rgba(16, 185, 129, 0.2)` | Borders on accent-light elements |

**Why emerald**: Evokes terminal green, agent/automation feel, high contrast on dark backgrounds, avoids the indigo/purple AI cliche entirely.

**Alternative**: If the team prefers a more neutral/trust feel, use blue `#3b82f6` with the same token structure. Do not use both.

### Semantic Colors
| Token | Value | Usage |
|-------|-------|-------|
| `success` | `#10b981` | Healthy, running, connected |
| `warning` | `#f59e0b` | Approaching limits, degraded |
| `error` | `#ef4444` | Failed, disconnected, over budget |
| `success-light` | `rgba(16, 185, 129, 0.1)` | Badge/banner backgrounds |
| `warning-light` | `rgba(245, 158, 11, 0.1)` | Badge/banner backgrounds |
| `error-light` | `rgba(239, 68, 68, 0.1)` | Badge/banner backgrounds |

Note: In dark mode, semantic `-light` variants must use transparent colors, not opaque light backgrounds like `#ECFDF5`. The current codebase has this wrong.

---

## Typography

### Font Stack
Remove the Google Fonts `@import` from `index.css`. Use this stack:

```css
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
```

If Geist is bundled locally (not via CDN), it can stay at the front of the stack. But the Google Fonts import must go.

### Scale
Keep it tight. This is a dashboard, not a marketing page.

| Name | Size | Weight | Usage |
|------|------|--------|-------|
| `text-xs` | 12px | 400/500 | Timestamps, tertiary labels, helper text |
| `text-sm` | 14px | 400/500 | Body text, descriptions, table cells |
| `text-base` | 16px | 400 | Rarely used — only for prominent body copy |
| `text-lg` | 20px | 600 | Page titles only |
| `text-xl` | 24px | 600 | Overview hero numbers only |

**Rules**:
- No `text-2xl` or larger anywhere in the app
- `font-semibold` (600) for headings only — never `font-bold` (700)
- `font-medium` (500) for labels and nav items
- `font-mono` for all numbers, costs, tokens, timestamps, code, tool names
- Uppercase tracking (`uppercase tracking-wide`) only on card labels — nowhere else

### Tailwind classes for page headings
```
text-lg font-semibold text-text-primary
```

### Tailwind classes for page descriptions
```
text-sm text-text-secondary mt-1
```

---

## Component Patterns

### Cards

**Current**: `bg-background border border-border rounded-lg shadow-sm p-5`

**New**:
```
bg-surface border border-border rounded-md p-5
```

- Background: `bg-surface` (#111111), not `bg-background`
- Border radius: `rounded-md` (6px), never `rounded-lg` or larger
- No shadows. Zero. On dark backgrounds they are invisible or create muddy halos.
- No hover effects on static cards. Only interactive cards get `hover:border-border-strong`

### Buttons

| Variant | Classes |
|---------|---------|
| Primary (filled) | `bg-accent text-white hover:bg-accent-hover rounded-md px-4 py-2 text-sm font-medium` |
| Secondary (outline) | `bg-transparent text-text-primary border border-border hover:bg-hover-surface rounded-md px-4 py-2 text-sm font-medium` |
| Ghost | `bg-transparent text-text-secondary hover:text-text-primary hover:bg-hover-surface rounded-md px-4 py-2 text-sm font-medium` |
| Destructive | `bg-transparent text-error border border-error/30 hover:bg-error/10 rounded-md px-4 py-2 text-sm font-medium` |
| Icon | `h-9 w-9 rounded-md flex items-center justify-center text-text-secondary hover:bg-hover-surface hover:text-text-primary` |

**Rules**:
- Default to ghost/secondary. Filled (primary) only for the ONE main action per view.
- `font-medium` not `font-semibold` on buttons.
- Destructive should be outline/ghost, not filled red (too aggressive).
- Disabled: `opacity-50 cursor-not-allowed` (current is fine).

### Badges

```
inline-flex items-center rounded-sm text-xs font-medium px-2 py-0.5
```

| Variant | Classes |
|---------|---------|
| Default | `bg-hover-surface text-text-secondary` |
| Success | `bg-success-light text-success` |
| Warning | `bg-warning-light text-warning` |
| Error | `bg-error-light text-error` |
| Accent | `bg-accent-light text-accent` |

Note: Remove the `dark:` overrides in Badge.tsx — with proper transparent `-light` colors, one set of classes works for both themes.

### Inputs

**Current**: Standard bordered inputs with focus ring.

**New**:
```
bg-transparent border border-border rounded-md px-3 py-2 text-sm text-text-primary
placeholder:text-text-disabled
focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-border-strong
```

- No `focus:ring-accent` — too loud. Use subtle border strengthen instead.
- Background transparent, not surface-colored.
- Consistent `rounded-md` with buttons and cards.

### Tables

```html
<table class="w-full text-sm">
  <thead>
    <tr class="border-b border-border text-left">
      <th class="py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wide">...</th>
    </tr>
  </thead>
  <tbody>
    <tr class="border-b border-border hover:bg-hover-surface transition-colors">
      <td class="py-3 px-4 text-text-primary">...</td>
    </tr>
  </tbody>
</table>
```

- No zebra stripes. Clean border-separated rows.
- Header: `text-xs uppercase tracking-wide font-medium text-text-secondary`
- Numeric cells: add `font-mono` class
- Row hover: `hover:bg-hover-surface`
- Clickable rows: add `cursor-pointer`

### Charts

- Use ONE color: the accent emerald (#10b981)
- Area charts: `fill: rgba(16, 185, 129, 0.1)`, `stroke: #10b981`
- If you need a second series, use `#888888` (secondary text color)
- Axis labels: `text-xs text-text-secondary font-mono`
- Grid lines: `stroke: #222222` (border color)
- No multi-color palette. No Tremor rainbow defaults.
- Tooltip: `bg-surface border border-border rounded-md shadow-none text-sm`

### Toast / Notifications

```
bg-surface border border-border rounded-md px-4 py-3 text-sm
```

With semantic left border for type:
- Info: `border-l-2 border-l-accent`
- Success: `border-l-2 border-l-success`
- Warning: `border-l-2 border-l-warning`
- Error: `border-l-2 border-l-error`

---

## Layout

### Sidebar

**Width**: 240px expanded, 56px collapsed (current values are good).

**New classes**:
```
bg-surface border-r border-border
```

Not `bg-background` — the sidebar should be one shade lighter than the page to create depth without shadows.

**Active nav item**:
```
bg-accent-light text-accent border-l-2 border-l-accent
```

**Inactive nav item**:
```
text-text-secondary hover:bg-hover-surface hover:text-text-primary
```

**Brand section**: Remove the `border-b` bottom border on the logo area. Let it breathe. Use subtle spacing instead.

### Content Area

```
<main class="flex-1 min-w-0 overflow-hidden">
  <div class="max-w-[1200px] mx-auto px-6 md:px-8 py-6 md:py-8">
    <!-- page content -->
  </div>
</main>
```

- Max width 1200px, centered.
- Padding: 24px mobile, 32px desktop.
- Current `p-4 md:p-8` in OverviewPage is close — standardize to `px-6 md:px-8 py-6 md:py-8`.

### Page Header Pattern

Every page should start with:
```tsx
<div className="mb-8">
  <h1 className="text-lg font-semibold text-text-primary">Page Title</h1>
  <p className="text-sm text-text-secondary mt-1">One-line description.</p>
</div>
```

Current OverviewPage uses `text-2xl font-bold` — too large. Scale down.

---

## Anti-Patterns — Do Not Use

| Pattern | Why |
|---------|-----|
| `rounded-xl`, `rounded-2xl`, `rounded-3xl` | Looks like a toy app. Max is `rounded-md` (6px). |
| `shadow-sm`, `shadow-md`, `shadow-lg` | Invisible on dark backgrounds. Creates muddy artifacts. |
| `bg-gradient-to-*` | No gradients anywhere. Flat colors only. |
| `backdrop-blur`, `bg-opacity` glass effects | Trend-chasing. Hurts performance. Looks dated. |
| Purple/indigo accent (#6366F1) | The universal "AI product" color. Change to emerald. |
| Multiple accent colors | One accent. One. Semantic colors (success/warning/error) are not "accents". |
| `animate-*` except `pulse` and `spin` | Only `animate-pulse` for streaming/loading, `animate-spin` for spinners. No bounces, no slides. |
| `text-2xl` or larger | This is a dashboard, not a billboard. `text-lg` max for headings. |
| `font-bold` (700) | Too heavy. Use `font-semibold` (600) for headings, `font-medium` (500) for labels. |
| Google Fonts `@import` | Blocks rendering. Use system stack or locally bundled fonts. |
| Opaque semantic light colors in dark mode | `#ECFDF5` on `#0a0a0a` looks wrong. Use `rgba()` transparencies. |
| Card shadows on dark backgrounds | They're invisible or create ugly dark halos. Use borders. |
| Tremor default chart colors | Rainbow vomit. Single-color charts. |
| Decorative icons | Only use icons where they serve a functional purpose. |
| "AI glow" effects (box-shadow with accent color) | Tacky. Professional tools don't glow. |

---

## Page-Specific Redesign Notes

### 1. Overview (`OverviewPage.tsx`)

**Current issues**:
- `text-2xl font-bold` heading — too large
- StatCard uses Card component with shadow
- Grid is fine but could use `gap-3` instead of `gap-4` for tighter feel

**Target**:
```tsx
<div className="px-6 md:px-8 py-6 md:py-8 max-w-[1200px] mx-auto">
  <div className="mb-8">
    <h1 className="text-lg font-semibold text-text-primary">Overview</h1>
    <p className="text-sm text-text-secondary mt-1">Agent health and usage at a glance.</p>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
    {/* StatCards — bg-surface border border-border rounded-md p-4 */}
  </div>

  {/* QuotaBar — keep but use accent color for bar fill */}
</div>
```

- StatCard values: `text-xl font-semibold font-mono` (not `text-2xl font-bold`)
- StatCard labels: `text-xs font-medium text-text-secondary uppercase tracking-wide`
- StatusCard dot: keep as-is, good pattern
- QuotaBar: accent fill, `bg-hover-surface` track, `border-border` border

### 2. Chat (`ChatPage.tsx`)

**Current issues**:
- Chat bubbles with rounded corners and accent background for user — looks like iMessage
- Should feel more like a terminal/IDE conversation

**Target**:
- Remove bubble style entirely. Messages are full-width blocks.
- User messages: `border-l-2 border-l-accent pl-4 py-2`
- Agent messages: `border-l-2 border-l-border-strong pl-4 py-2 font-mono text-sm`
- Tool call blocks: keep the collapsible pattern but use `bg-surface` background
- Streaming cursor: keep `animate-pulse` on the block cursor character
- Input area: full-width textarea, minimal border, no rounded pill shape

```tsx
{/* User message */}
<div className="border-l-2 border-l-accent pl-4 py-2 mb-3">
  <p className="text-sm text-text-primary">{msg.content}</p>
  <p className="text-xs text-text-disabled font-mono mt-1">{timestamp}</p>
</div>

{/* Agent message */}
<div className="border-l-2 border-l-border-strong pl-4 py-2 mb-3">
  <p className="text-sm text-text-primary font-mono leading-relaxed">{msg.content}</p>
  <p className="text-xs text-text-disabled font-mono mt-1">{timestamp}</p>
</div>
```

- Connection status badge: top-right, small, unobtrusive
- Empty state: just centered text, no circular icon container
- Input: `bg-transparent border border-border rounded-md` — no `focus:ring-offset-2` (leaves a gap artifact on dark)

### 3. Conversations (`ConversationsPage.tsx`)

**Target**: Clean table layout.

```
text-sm w-full
```

- Columns: Channel, Started, Messages, Duration, Status
- Clickable rows → expand to show summary or navigate to detail
- Status column: Badge component with semantic variant
- Timestamp columns: `font-mono text-text-secondary`
- No card wrapper — table sits directly in the content area with top border

### 4. Memory (`MemoryPage.tsx`)

**Target**: Search bar + flat list.

- Search input at top: full-width, `bg-transparent border-b border-border` (no box, just underline)
- Memory entries: simple rows with `border-b border-border py-3`
- Tags: Badge component, accent variant
- Key/value display: key in `text-text-secondary`, value in `text-text-primary font-mono`
- No cards wrapping individual entries

### 5. Metrics (`MetricsPage.tsx`)

**Target**: Single-color area charts.

- Chart area: emerald fill at 10% opacity, emerald stroke
- Axis labels: `text-xs font-mono text-text-secondary`
- Grid: `#222222` horizontal lines only (no vertical grid)
- Period selector: ghost button group, one active with `bg-hover-surface`
- Metric summary cards above charts: same StatCard pattern as Overview
- If comparing periods, use `#888888` for the comparison line (no second bright color)

### 6. Settings (`SettingsPage.tsx`)

**Target**: Clean form sections.

- Sections separated by `border-b border-border pb-6 mb-6`
- Section titles: `text-sm font-semibold text-text-primary`
- Section descriptions: `text-sm text-text-secondary`
- Form fields: label above input, both at `text-sm`
- Inputs: transparent background, border-border, rounded-md
- Save button: primary (filled accent) — the one filled button on this page
- Toggle switches: `bg-border` off, `bg-accent` on

### 7. Logs (`LogsPage.tsx`)

**Target**: Terminal-inspired log viewer.

```tsx
<div className="font-mono text-xs leading-relaxed">
  {logs.map(log => (
    <div key={log.id} className="flex gap-3 px-4 py-1 hover:bg-hover-surface">
      <span className="text-text-disabled shrink-0 w-[140px]">{log.timestamp}</span>
      <span className={cn(
        'shrink-0 w-[50px] uppercase font-medium',
        log.level === 'error' && 'text-error',
        log.level === 'warn' && 'text-warning',
        log.level === 'info' && 'text-accent',
        log.level === 'debug' && 'text-text-disabled',
      )}>{log.level}</span>
      <span className="text-text-primary">{log.message}</span>
    </div>
  ))}
</div>
```

- Monospace everything
- Color-coded levels: error=red, warn=amber, info=accent, debug=disabled
- Timestamp in disabled color, fixed width
- No wrapping cards, no borders between rows
- Dense: `py-1` line height
- Filter bar at top: level buttons (ghost style), search input
- Auto-scroll with "jump to bottom" pill (reuse Chat pattern)

---

## CSS Variable Updates

Replace the current `index.css` theme tokens with:

```css
:root {
  /* Dark-first design — light mode is secondary */
  --color-background:          #0a0a0a;
  --color-surface:             #111111;
  --color-hover-surface:       #1a1a1a;
  --color-logs-alt-row:        #0f0f0f;
  --color-border:              #222222;
  --color-border-strong:       #333333;
  --color-text-primary:        #fafafa;
  --color-text-secondary:      #888888;
  --color-text-disabled:       #555555;
  --color-accent-light:        rgba(16, 185, 129, 0.1);
  --color-accent-light-border: rgba(16, 185, 129, 0.2);
}

/* Optional light mode — if kept */
.light {
  --color-background:          #fafafa;
  --color-surface:             #ffffff;
  --color-hover-surface:       #f5f5f5;
  --color-logs-alt-row:        #fafafa;
  --color-border:              #e5e5e5;
  --color-border-strong:       #d4d4d4;
  --color-text-primary:        #0a0a0a;
  --color-text-secondary:      #737373;
  --color-text-disabled:       #a3a3a3;
  --color-accent-light:        rgba(16, 185, 129, 0.08);
  --color-accent-light-border: rgba(16, 185, 129, 0.15);
}
```

## Tailwind Config Updates

```ts
colors: {
  background: 'var(--color-background)',
  accent: {
    DEFAULT: '#10b981',
    hover:   '#059669',
    light:   'var(--color-accent-light)',
    muted:   '#6ee7b7',
    'light-border': 'var(--color-accent-light-border)',
  },
  surface:  'var(--color-surface)',
  'hover-surface': 'var(--color-hover-surface)',
  border: {
    DEFAULT: 'var(--color-border)',
    strong:  'var(--color-border-strong)',
  },
  text: {
    primary:   'var(--color-text-primary)',
    secondary: 'var(--color-text-secondary)',
    disabled:  'var(--color-text-disabled)',
  },
  success: { DEFAULT: '#10b981', light: 'rgba(16, 185, 129, 0.1)' },
  warning: { DEFAULT: '#f59e0b', light: 'rgba(245, 158, 11, 0.1)' },
  error:   { DEFAULT: '#ef4444', light: 'rgba(239, 68, 68, 0.1)' },
},
fontFamily: {
  sans: ['-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'system-ui', 'sans-serif'],
  mono: ["'JetBrains Mono'", "'SF Mono'", "'Fira Code'", 'monospace'],
},
borderRadius: {
  sm:  '3px',
  md:  '6px',
  lg:  '8px',
  // Remove xl entirely — not used
},
boxShadow: {
  // Remove all shadow definitions — not used in dark design
},
```

---

## Implementation Order

1. **Theme tokens** — Update `index.css` variables and `tailwind.config.ts`. This changes everything instantly.
2. **Remove Google Fonts import** — Delete the `@import` line in `index.css`.
3. **Card component** — Remove shadow, change to `bg-surface rounded-md`.
4. **Button component** — Update variant classes, switch to `font-medium`.
5. **Badge component** — Remove `dark:` overrides, use transparent backgrounds.
6. **Sidebar** — Update to `bg-surface`, adjust active styles to emerald.
7. **Overview page** — Scale down heading, tighten grid gap.
8. **Chat page** — Replace bubbles with terminal-style messages.
9. **Remaining pages** — Apply patterns above.
10. **Chart components** — Single-color emerald palette.
11. **Final pass** — Search codebase for `shadow`, `rounded-xl`, `font-bold`, `text-2xl`, `gradient` and eliminate.

---

## Accessibility Notes

- Emerald (#10b981) on #0a0a0a = contrast ratio 6.8:1 (passes WCAG AA for normal text)
- #fafafa on #0a0a0a = contrast ratio 19.4:1 (passes AAA)
- #888888 on #0a0a0a = contrast ratio 5.2:1 (passes AA for normal text)
- #555555 on #0a0a0a = contrast ratio 3.1:1 (fails for body text — only use for disabled/placeholder)
- All interactive elements must have `:focus-visible` ring using `border-strong` color
- Maintain `prefers-reduced-motion` media query — disable `animate-pulse` and `animate-spin`
- Keep semantic HTML (nav, main, aside, heading hierarchy)
- Minimum tap target: 44x44px for all buttons and interactive elements
