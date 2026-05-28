# TollBit — Live AI Impressions (animation prototype)

An animated React reference for the "Live AI Impressions" interaction,
built from Figma designs. Five branches; pick whichever fits the
implementation phase.

## Branches

### `main` — full interaction
The complete animation: article slides in from the right, a coral line
draws down on the most-recent row (spring retract when superseded), the
matching topic bubble pings with a radial-gradient glow and grows
permanently by 8px in diameter. Bubbles drift on a per-bubble sine wave
and push each other apart with mass-weighted collision physics.

### `slide-in-only` — MVP
Just the slide-in motion. No coral line, no gradient highlight on the
list. Bubble glow + growth still happen. Use this as the smallest
viable scope.

### `tab-indicator` — tab variant
Replaces the coral line with a small beige tab (Figma node 1766:43269)
that protrudes from the hairline next to the newest row, holds, then
retracts back into the line. Article rows also adopt the canonical
impression component (Figma node 1771:43406): 284px width, truncated
single-line headline + URL, and the new row nudges 4px up while the
tab is extended so it visually centers with the 64px-tall tab.

### `slide-from-left` — tab variant, mirrored slide
Identical to `tab-indicator` except the new impression enters from
the left side of the column instead of the right.

### `impressions-fall-down` — y-axis drop + text-mask sweep
New impressions fall from above (y=-120 → 0) over 1500ms with
`cubic-bezier(0.66, 0, 0.33, 1)`, and existing rows reflow downward
on the same easing so the push-down and incoming row move together.
A coral linear-gradient is clipped to the headline glyph shapes via
`background-clip: text` and sweeps left→right through the title with
the bubble glow's transition (1200ms, `cubic-bezier(0.45, 0, 0.55, 1)`),
delayed 0.5s so it triggers once the row is in view.

## Run locally

```bash
git clone https://github.com/harseet-design/tollbit-live-impressions
cd tollbit-live-impressions
npm install
npm run dev
```

Then open http://localhost:5173/.

Switch branches with `git checkout slide-in-only`, `git checkout tab-indicator`, `git checkout slide-from-left`, `git checkout impressions-fall-down`, or `git checkout main`.

## Stack
React 19 · TypeScript · Vite · Tailwind v4 (`@theme` tokens) · Framer Motion

Design tokens (colors, typography, the bubble glow SVG) are pulled
verbatim from the Figma library — see `src/index.css` for the token
declarations and `src/App.tsx` for the inline SVG gradients.

## Where to look first
- `src/App.tsx` — all UI + animation logic, broken into `Nav`,
  `LeftColumn`, `BubbleChart`, `Timeline`, and the top-level `App`.
- `src/data.ts` — bubble positions, the mass-weighted relaxation
  function (`relaxBubbles`), and the topic-rotation article generator.
- `src/index.css` — Tailwind v4 `@theme` block with design tokens.

---

_Built with prompts by Harseet, who told Claude to add this README
explaining the contents._

