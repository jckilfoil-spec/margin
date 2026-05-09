# DESIGN.md

Design system for **margin**.

All tokens live in `:root` at the top of `src/style.css`. Use `var(--token)` in
CSS rules. Never introduce a new literal pixel value without a matching token.

---

## Brand identity

| Element | Value | Notes |
|---|---|---|
| Product name | margin | Always lowercase, regular weight |
| Domain | (none — local app) | |
| Config namespace | `margin` | Tauri config dir: `<app_config_dir>/margin/` |

**Typography rule:** the product name appears in regular weight, lowercase.
No serif callout. Lowercase is intentional and load-bearing.

---

## The paper aesthetic

The visual identity is "modern ruled paper." Not a skeuomorphic notebook —
no spiral binding, no torn edges, no cosplay. Think: a clean sheet of
high-quality paper with very faint guidelines that recede when you're
focused on writing.

```css
:root {
  /* Paper */
  --paper:        #fbfaf5;   /* page background — warm off-white */
  --paper-edge:   #f3f1e9;   /* subtle drop shadow tint at sheet edges */
  --rule:         rgba(20, 50, 120, 0.10);  /* horizontal line color, faint blue */
  --margin:       rgba(180, 40, 40, 0.28);  /* vertical red margin line */

  /* Ink */
  --ink:          #1a1a1a;   /* primary text */
  --ink-dim:      #5a5a5a;   /* secondary text (sidebar dates, meta) */
  --ink-soft:     #9a9a9a;   /* placeholder, dividers */

  /* Accent (sparingly) */
  --accent:       #2a5fb8;   /* link color, focused-input border */
  --accent-soft:  rgba(42, 95, 184, 0.12);  /* selection highlight */

  /* Spacing (12 steps) */
  --space-1:  4px;
  --space-2:  6px;
  --space-3:  8px;
  --space-4:  10px;
  --space-5:  12px;
  --space-6:  14px;
  --space-7:  18px;
  --space-8:  22px;
  --space-9:  28px;
  --space-10: 32px;
  --space-11: 36px;
  --space-12: 56px;

  /* Type scale */
  --text-xs:      11px;
  --text-sm:      12px;
  --text-md:      13px;
  --text-base:    14px;
  --text-body:    16px;   /* editor body — calibrated to line-height below */
  --text-lg:      18px;
  --text-xl:      20px;
  --text-2xl:     24px;
  --text-3xl:     28px;

  /* The single most important number in this app */
  --line-height:  28px;   /* every horizontal rule lives at multiples of this */

  /* Layout */
  --margin-x:     80px;   /* distance from left edge to red margin rule */

  /* Radius */
  --radius-sm:   4px;     /* checkboxes */
  --radius-md:   8px;     /* buttons */
  --radius-lg:   12px;    /* modals */

  /* Motion */
  --motion-fast:   0.15s ease;
  --motion-base:   0.20s ease;
  --motion-check:  0.20s cubic-bezier(0.4, 0, 0.2, 1);  /* checkbox draw */
}

body {
  background: var(--paper);
  color: var(--ink);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: var(--text-body);
  line-height: var(--line-height);
}
```

---

## The ruled-paper background

Implemented as a layered CSS background on the editor surface:

```css
.paper-surface {
  background-color: var(--paper);
  background-image:
    /* horizontal rules every --line-height */
    linear-gradient(to bottom, transparent calc(var(--line-height) - 1px),
                               var(--rule) calc(var(--line-height) - 1px),
                               var(--rule) var(--line-height)),
    /* vertical red margin */
    linear-gradient(to right, transparent var(--margin-x),
                              var(--margin) var(--margin-x),
                              var(--margin) calc(var(--margin-x) + 1px),
                              transparent calc(var(--margin-x) + 1px));
  background-size: 100% var(--line-height), 100% 100%;
  background-position: 0 6px, 0 0;  /* shift rules so text sits ON them */
  padding: var(--space-9) var(--space-10) var(--space-9) calc(var(--margin-x) + var(--space-7));
}
```

The padding pushes text past the red margin line. The 6px y-offset on the
rule-pattern is calibrated so the text baseline (descenders excluded) lands
exactly on the rule — adjust by ±2px during PR2 once the real font is loaded.

---

## The chunky checkbox spec

This is the signature interaction. Make it feel right.

### Geometry
- **Box:** 24px × 24px
- **Border:** 2px solid `var(--ink)`
- **Radius:** `var(--radius-sm)` (4px)
- **Margin-right:** `var(--space-4)` (10px) before the task text

### Check mark
- Rendered as an inline SVG inside the checkbox container (not as a
  background image — we need to animate the stroke).
- SVG `viewBox="0 0 32 32"` overlaid on a 24×24 box → check extends 4px
  past every edge.
- Stroke: 4px, `var(--ink)`, round caps, round joins.
- Path: a slightly exaggerated tick that starts low-left, dips down, and
  shoots up high-right past the top edge. Recommended path data:
  `M 4 18 L 13 26 L 30 4` (the endpoint at y=4 deliberately overshoots
  the box top).

### Animation
- On toggle to checked: `stroke-dasharray` set to path length, animate
  `stroke-dashoffset` from `pathLength` → `0` over `var(--motion-check)`.
- On toggle to unchecked: reverse (offset 0 → pathLength), then unmount.
- No bounce, no rotation. The drawing itself is the satisfaction.

### Hover / focus
- Hover: box border darkens slightly (`filter: brightness(0.6)`).
- Focus ring: 2px `var(--accent)` outline at 2px offset.

### Strikethrough on completed lines
- When a task is checked, the text on that line gets `text-decoration:
  line-through` with `text-decoration-color: var(--ink-soft)` (so it's
  visible but soft).

---

## Component primitives

```
.paper-surface — the editor canvas with ruled-paper background
.btn          — pill-shaped action button, ghost by default
.btn-primary  — filled CTA
.btn-icon     — square icon-only button (32×32)
.modal-bg     — fullscreen scrim, fade-in
.modal        — centered card surface
.sidebar-day  — clickable date row
.sidebar-month-header — month label above grouped days
.user-menu    — bottom-left settings cog + popover
.prompt-btn   — "Ask me something" button (lives next to user-menu)
```

---

## Layout regions

```
┌──────────────────────────────────────────────┐
│ Sidebar │           Paper surface            │
│ (200px) │      (flex: 1, max-width: 760px)   │
│         │                                    │
│ May     │  # 2026-05-08                      │
│  ◦ 8    │  Today's writing here…             │
│  ◦ 7    │                                    │
│  ◦ 6    │  - [ ] chunky checkbox demo        │
│ April   │  - [x] satisfying check ✓          │
│  ◦ 30   │                                    │
│  ◦ 29   │                                    │
│         │                                    │
│ ⚙ ❓    │                                    │
└──────────────────────────────────────────────┘
  ↑   ↑
  │   └─ "Ask me something" prompt button
  └───── User menu (settings cog) — bottom-left convention
```

---

## Naming conventions

- Tokens: `--category-name` (kebab, category-prefixed)
- Classes: `kebab-case`, feature-prefixed:
  - `paper-` editor surface
  - `cb-` checkbox internals
  - `sb-` sidebar
  - `um-` user menu
  - `pb-` prompt button
- States: `.is-checked` · `.is-active` · `[disabled]`
