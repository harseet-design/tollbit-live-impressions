# Spec — Live AI Impressions + Bubble Chart (`impressions-fall-down`)

Engineering reference for the animation. Pair with the screen recording.
Scope is intentionally narrow: only the **Live AI Impressions** list on
the left and the **Bubble Chart** on the right. Top nav, hero number,
and bottom timeline are static.

---

## 1. The event that triggers everything

A new article is logged. In the prototype this fires on a
**3800ms** interval (`AUTO_INTERVAL_MS`), but the timer is just a stand-in
for the real event from your data source.

Every "new article" event fires three things simultaneously:

| State                | What it drives                                  | Clear after |
| -------------------- | ----------------------------------------------- | ----------- |
| `newId`              | Drop-in + text-mask sweep on the new row        | 1600ms      |
| `glowingTopic`       | Coral radial glow on the matching bubble        | 1600ms      |
| `topicBumps[topic]`  | Permanent +8px diameter growth on that bubble   | persists    |

`1600ms` is the **hold window** (`NEW_ARTICLE_HOLD_MS`). After that, `newId`
and `glowingTopic` flip back to `null`. The bubble growth (`topicBumps`)
is cumulative and never clears.

---

## 2. Color tokens

All hex from the Figma library. CSS variables in `src/index.css`.

| Token                       | Value                       | Used by                                  |
| --------------------------- | --------------------------- | ---------------------------------------- |
| `--color-bg-primary`        | `#f5efed`                   | Page background                          |
| `--color-content-primary`   | `#332724`                   | Headline + bot label                     |
| `--color-content-secondary` | `#736865`                   | Bubble label text                        |
| `--color-content-tertiary`  | `#a69b98`                   | URL                                      |
| `--color-brand`             | `#ff471a`                   | "today" emphasis                         |
| `--color-brand-6`           | `#ff5c33`                   | **Text-mask sweep + bubble glow**        |
| `--color-positive`          | `#528c46`                   | Live status dot                          |
| `--color-line-10`           | `rgba(26, 21, 20, 0.1)`     | Static hairline                          |
| `--color-warm-shadow-1`     | `rgba(101, 52, 40, 0.05)`   | Bubble shadow (outer)                    |
| `--color-warm-shadow-2`     | `rgba(40, 12, 5, 0.04)`     | Bubble shadow (inner)                    |

Font: **Plus Jakarta Sans** — weights 400 / 500 / 700.

---

## 3. Easing curves

Only two cubic-bezier curves are used:

| Name                      | Bezier                       | Where                                    |
| ------------------------- | ---------------------------- | ---------------------------------------- |
| `EASE_FALL`               | `0.66, 0, 0.33, 1`           | Row y-fall, layout reflow                |
| `EASE_SWEEP`              | `0.45, 0, 0.55, 1`           | Text-mask sweep, bubble glow opacity, bubble growth |

Springs are used only for bubble repositioning (see §6.3).

---

## 4. Live AI Impressions list

### 4.1 Container

```
position: absolute
left: 48px, top: 112px
width: 312px

list viewport (below the "Live AI impressions" heading):
  width: 312px
  height: 540px
  overflow: hidden
  mask-image: linear-gradient(to bottom, black 75%, transparent 100%)
```

A **1px hairline** anchored at `left: 0`, full viewport height, color
`--color-line-10`. It never moves.

### 4.2 Heading

`Live AI impressions` — Plus Jakarta Sans Bold 16/26, content-primary.
Preceded by a **status dot**: 16px square, with a positive-green inner dot
(6px) and a pulsing outer ring (`bg-positive/20`, `scale(0.85→1.4)`,
`opacity 0.9→0`, 2s linear infinite).

### 4.3 Article row (typography)

| Element     | Font                       | Size / line-height / tracking | Color                    |
| ----------- | -------------------------- | ----------------------------- | ------------------------ |
| Bot label   | Plus Jakarta Sans 400      | 10 / 16 / 0.1                 | `--color-content-primary` |
| Headline    | Plus Jakarta Sans 700 Bold | 13 / 20 / 0                   | `--color-content-primary` |
| URL         | Plus Jakarta Sans 400      | 10 / 16 / 0.1                 | `--color-content-tertiary` |

Row container: `padding: 16px 0` (vertical), `padding-left: 16px` for the
content. Vertical gap between bot row, headline, and URL: **2px**.
Row total height: ~88px.

Bot icon: 14×14 rounded chip (`border-radius: 3px`) with a single
uppercase letter centered, 8px bold. Color is per-bot.

### 4.4 New-row drop animation

When a row's id matches `newId`, on mount it animates:

```
y:   −120  →  0
duration: 1500ms
ease:     cubic-bezier(0.66, 0, 0.33, 1)   (EASE_FALL)
```

`−120` is chosen so the row's bottom edge sits clearly above the previous
top row (88px row height + 32px breathing room). No text from the
incoming row can overlap text from the row beneath it at any point of
the animation.

### 4.5 Layout reflow (existing rows)

When a new row mounts at the top, every other row shifts down. Uses
Framer Motion's `layout` prop with the **same transition as the row's
y-fall** so they move as one cohesive motion:

```
duration: 1500ms
ease:     cubic-bezier(0.66, 0, 0.33, 1)   (EASE_FALL)
```

Rows leaving the bottom (`exit`) fade out: opacity 1 → 0 and height
→ 0, no specific duration tuning — they're already past the mask fade
so the visual effect is minimal.

### 4.6 Coral text-mask sweep on headline

Only the **headline** gets the orange treatment — bot label and URL
remain at their normal colors throughout.

Effect: a soft coral gradient sweeps left → right *through the glyph
shapes* of the headline. Implemented as a duplicate overlay span:

```
position: absolute, inset: 0
color: transparent (-webkit-text-fill-color: transparent)
background-image: linear-gradient(
  90deg,
  rgba(255,92,51,0) 30%,
  #ff5c33 50%,
  rgba(255,92,51,0) 70%
)
background-size: 200% 100%
background-repeat: no-repeat
background-clip: text
-webkit-background-clip: text

animate background-position-x: 150% → −50%
duration: 1200ms
delay:    500ms
ease:     cubic-bezier(0.45, 0, 0.55, 1)   (EASE_SWEEP)
```

The 500ms delay exists because the row starts at `y: −120` (above the
viewport). By the time the headline has fallen into view, the sweep
starts. End-to-end timeline:

```
t = 0     ms   y-fall + layout reflow start
t = 0     ms   bubble glow starts
t = 500   ms   text-mask sweep starts
t = 1500  ms   y-fall + layout reflow end
t = 1600  ms   newId / glowingTopic clear (bubble glow fades out, sweep ends naturally just before)
t = 1700  ms   text-mask sweep ends
```

---

## 5. Bubble chart

### 5.1 Container

```
position: absolute
left: calc(25% + 32px), top: 96px
width: 1000px
height: 600px
```

11 bubbles. Each has a **home position** `(cx, cy)` measured to the
bubble's center, and a **base size** (diameter in px). All values
verbatim from Figma — see `src/data.ts → BUBBLES`.

### 5.2 Bubble visual

```
border-radius: 50%
border: 1px solid white
background:
  linear-gradient(157.17deg, rgba(26,21,20,0.045) 0%, rgba(26,21,20,0) 40%),
  linear-gradient(90deg, #fffdfc 0%, #fffdfc 100%)
box-shadow:
  0 4px 20px var(--color-warm-shadow-1),
  0 2px 8px  var(--color-warm-shadow-2)
```

Label: Plus Jakarta Sans Bold, content-secondary. Font size scales
with bubble diameter — see `BUBBLES[*].fontSize / lineHeight / tracking`
in `src/data.ts`. (The Apple bubble at 280px uses 24/28/−0.24, the small
"Milan" bubble at 112px uses 9.6/11.2/−0.096, etc.)

### 5.3 Continuous drift (sine float)

Every bubble drifts in a smooth ±3px circle around its current
position, **always on**, independent of any event. Implemented as a
sampled sine wave (24 keyframes per cycle) so the linear chords between
samples don't cause visible kinks in the label text.

```
amplitude:   3px (x and y, with y inverted)
duration x:  (5.5 + (i % 4) * 0.6) / 0.9 s
duration y:  (6.2 + ((i + 2) % 4) * 0.55) / 0.9 s
delay  x:  −((i * 0.71) % 1) * durationX  (negative → starts mid-cycle)
delay  y:  −((i * 1.37) % 1) * durationY
ease:       linear (between dense sine samples ≈ true sine)
repeat:     Infinity
```

Per-bubble variation in duration + phase ensures the cluster never
moves in lock-step.

### 5.4 Coral glow ("ping")

When `glowingTopic` matches a bubble's topic, an SVG radial gradient
overlay is faded in via opacity:

```
position: absolute, inset: 0, border-radius: 50%
background:
  inline SVG with a radialGradient (see APPLE_GLOW_SVG in App.tsx)
  stops: transparent → semi-coral (rgba(178,72,38,0.5)) → full coral (#ff5c33)
  opacity wrapper: 0.15
pointer-events: none

transition: opacity 1200ms cubic-bezier(0.45, 0, 0.55, 1)   (EASE_SWEEP)
glow on:   opacity 1
glow off:  opacity 0
```

Fades in over 1200ms when the article logs, holds visible (the
opacity is steady at 1), then fades out over 1200ms when the hold
expires at `t = 1600ms`. Total visible footprint: ~2800ms.

### 5.5 Growth + collision relaxation

Each "new article on topic X" event permanently grows that bubble's
diameter by **+8px**. The growth uses a scale animation on the bubble
itself:

```
scale: previous → grownSize / baseSize
duration: 1200ms
ease:     cubic-bezier(0.45, 0, 0.55, 1)   (EASE_SWEEP)
```

After growth, neighbors are pushed out of the way so no two bubbles
overlap. This runs in `relaxBubbles()` (see `src/data.ts`):

- **Home-pull**: every bubble is gently pulled back toward its home
  position each iteration (`HOME_PULL = 0.04`).
- **Overlap resolution**: pairwise, mass-weighted. Mass ∝ radius²
  (≈ area), so the smaller bubble absorbs most of the displacement.
  A **PADDING of 8px** is added between bubbles so the worst-case
  float (±3px each direction = ±6px) plus spring overshoot can't cause
  edges to touch during motion.
- 240 iterations per relaxation pass.

Once the target position is computed, the bubble's outer wrapper
springs to it:

```
spring stiffness: 140
spring damping:    11
spring mass:        0.7
```

This gives a soft underdamped overshoot for pushed neighbors. The
*growing* bubble barely moves (its mass-weighted share of any conflict
is large), so it doesn't visibly bounce.

The float (§5.3) keeps running on top of these transforms — they
compose cleanly because the outer wrapper handles relaxation
displacement and the inner wrapper handles scale + float.

---

## 6. Sync points between the list and the bubbles

| Event            | List                                            | Bubbles                                          |
| ---------------- | ----------------------------------------------- | ------------------------------------------------ |
| article logs     | row drops in (1500ms / EASE_FALL)               | matching bubble's glow fades in (1200ms / EASE_SWEEP) |
| article logs     | layout reflow shifts existing rows (1500ms / EASE_FALL) | matching bubble grows +8px (1200ms / EASE_SWEEP) |
| article logs     | text-mask sweep on headline starts at t=500ms (1200ms / EASE_SWEEP) | (already running) |
| t = 1600ms       | `newId` / `glowingTopic` clear                  | glow fades out over 1200ms                       |

The **text-mask sweep** and the **bubble glow** share the same
`EASE_SWEEP` curve and 1200ms duration on purpose — they're the same
coral color, doing the same "ping" job in two different surfaces. The
sweep is delayed 500ms because the headline literally isn't on screen
yet, but the curve and duration match so the two effects feel like
one gesture.

---

## 7. Implementation notes

- Stack: React 19 · TypeScript · Vite · Tailwind v4 (`@theme` tokens)
  · Framer Motion.
- All Tailwind tokens defined in `src/index.css` via the v4 `@theme`
  block — no `tailwind.config.js`.
- The SVG used for the bubble glow is inlined as a data URL in
  `App.tsx` (`APPLE_GLOW_SVG`) because the gradient relies on an affine
  transform that CSS `radial-gradient()` cannot express.
- Text masking uses `background-clip: text` + transparent fill, with
  both `background-clip` and `-webkit-background-clip` set for Safari.
- The bubble glow opacity uses Tailwind's native `transition-opacity`,
  not Framer Motion — it's a simpler effect and the conditional class
  name (`opacity-100` / `opacity-0`) lets engineers read the on/off
  state directly in the markup.

---

## 8. Quick checklist for parity

- [ ] Article rows drop in from `y: −120` to `0`, 1500ms `EASE_FALL`
- [ ] Layout reflow uses same 1500ms `EASE_FALL` — push-down moves with the drop
- [ ] Coral sweep through headline glyphs, 1200ms `EASE_SWEEP`, delayed 500ms
- [ ] Bubble coral glow fades in/out on opacity, 1200ms `EASE_SWEEP`
- [ ] Bubble grows +8px diameter per matching article, 1200ms `EASE_SWEEP`
- [ ] Mass-weighted collision: smaller bubbles get pushed harder
- [ ] All bubbles drift ±3px on a per-bubble sine cycle (5.5–7.5s), always on
- [ ] Hairline stays at `left: 0`, never moves
- [ ] Hold window: 1600ms, then `newId` / `glowingTopic` clear
