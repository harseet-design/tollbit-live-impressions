export type Bot = {
  name: string;
  color: string;
  letter: string;
};

// Placeholder bot palette — colored chips standing in for the real SVG icons
// (those live as Figma image fills we can't pull through the MCP yet).
export const BOTS: Bot[] = [
  { name: 'Claudebot', color: '#D97757', letter: 'C' },
  { name: 'Claudebot', color: '#FF471A', letter: 'C' },
  { name: 'Claudebot', color: '#1877F2', letter: 'C' },
  { name: 'Claudebot', color: '#736865', letter: 'C' },
  { name: 'Claudebot', color: '#1A1717', letter: 'C' },
];

export type Article = {
  id: string;
  bot: Bot;
  headline: string;
  url: string;
  topic: string;
};

let counter = 0;
export const makeId = () => `a-${Date.now()}-${counter++}`;

export const INITIAL_ARTICLES: Article[] = Array.from({ length: 8 }).map((_, i) => ({
  id: makeId(),
  bot: BOTS[i % BOTS.length],
  headline: "Apple's iPhone sales continue to surge as iP…",
  url: 'apnews.com/live/iran-war-israel-trump-04-16-2026',
  topic: 'Apple',
}));

// Bubbles laid out inside a 1000×600 chart container.
// Sizes / typography are verbatim from Figma. Positions are tuned so no two
// bubbles overlap (every pair has a positive gap), with Apple sitting in the
// upper-left/center area — not beneath Milan.
//
// Stored as CENTER coords (cx, cy) for clarity; the chart computes top-left.
export type Bubble = {
  label: string;
  size: number;
  cx: number; // bubble center X inside the 1000-wide container
  cy: number; // bubble center Y inside the 600-tall container
  fontSize: number;
  lineHeight: number;
  tracking: number;
  padding: number;
  topic: string;
};

/* ─────────────────────────────────────────────────────────
   Position-based dynamics relaxation.
   Given the current grown radius for each bubble (original size + 2*bumps)
   we pull each toward its original "home" position then resolve overlaps
   pairwise. Repeat until stable.
   ───────────────────────────────────────────────────────── */
export function relaxBubbles(
  bubbles: Bubble[],
  bumps: Record<string, number>,
  iterations = 240
): { cx: number; cy: number }[] {
  const pos = bubbles.map((b) => ({ cx: b.cx, cy: b.cy }));
  const radii = bubbles.map((b) => (b.size + 8 * (bumps[b.topic] ?? 0)) / 2);
  const HOME_PULL = 0.04;
  // PADDING must absorb worst-case transient closure between two bubbles:
  //   float amplitude × 2 (both can drift toward each other) + spring overshoot
  //   = 3 × 2 + ~2 = 8px. Below this, edges can momentarily touch during motion.
  const PADDING = 8;

  for (let iter = 0; iter < iterations; iter++) {
    // 1. Pull each bubble toward its home position
    for (let i = 0; i < bubbles.length; i++) {
      pos[i].cx += (bubbles[i].cx - pos[i].cx) * HOME_PULL;
      pos[i].cy += (bubbles[i].cy - pos[i].cy) * HOME_PULL;
    }
    // 2. Resolve all overlaps pairwise — mass-weighted so the bigger bubble
    //    barely moves and the smaller one absorbs most of the displacement
    //    (mass ∝ area ∝ radius²).
    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const dx = pos[j].cx - pos[i].cx;
        const dy = pos[j].cy - pos[i].cy;
        const d = Math.hypot(dx, dy) || 0.01;
        const need = radii[i] + radii[j] + PADDING;
        if (d < need) {
          const overlap = need - d;
          const ux = dx / d;
          const uy = dy / d;
          const m1 = radii[i] * radii[i];
          const m2 = radii[j] * radii[j];
          const total = m1 + m2;
          // bubble i takes fraction (m2 / total) of the push; bubble j takes (m1 / total)
          const share1 = m2 / total;
          const share2 = m1 / total;
          pos[i].cx -= ux * overlap * share1;
          pos[i].cy -= uy * overlap * share1;
          pos[j].cx += ux * overlap * share2;
          pos[j].cy += uy * overlap * share2;
        }
      }
    }
  }
  return pos;
}

export const BUBBLES: Bubble[] = [
  // Top row
  { label: 'Harry Potter',
    size: 147.412, cx: 90,  cy: 110,
    fontSize: 12.64, lineHeight: 14.741, tracking: -0.1264, padding: 21.059,
    topic: 'Harry Potter' },

  { label: 'Samsung',
    size: 173.258, cx: 290, cy: 100,
    fontSize: 14.85, lineHeight: 17.326, tracking: -0.1485, padding: 24.751,
    topic: 'Samsung' },

  { label: "Intel's Panther\nLake chip",
    size: 141.774, cx: 470, cy: 130,
    fontSize: 12.15, lineHeight: 14.177, tracking: -0.1215, padding: 20.253,
    topic: 'Intel' },

  { label: 'Samsung Galaxy\nS24 Ultra',
    size: 176.235, cx: 700, cy: 100,
    fontSize: 15.11, lineHeight: 17.624, tracking: -0.1511, padding: 25.176,
    topic: 'Samsung Galaxy S24 Ultra' },

  // Right column
  { label: 'Trump',
    size: 221.846, cx: 889, cy: 250,
    fontSize: 19.02, lineHeight: 22.185, tracking: -0.1902, padding: 31.692,
    topic: 'Trump' },

  // Middle row
  { label: "de Young\nMuseum's Miner\nAuditorium…",
    size: 112, cx: 220, cy: 280,
    fontSize: 9.6, lineHeight: 11.2, tracking: -0.096, padding: 16,
    topic: 'deYoung' },

  { label: 'Apple',
    size: 280, cx: 440, cy: 360,
    fontSize: 24, lineHeight: 28, tracking: -0.24, padding: 40,
    topic: 'Apple' },

  { label: 'Toyota',
    size: 147.412, cx: 700, cy: 320,
    fontSize: 12.64, lineHeight: 14.741, tracking: -0.1264, padding: 21.059,
    topic: 'Toyota' },

  // Bottom row
  { label: 'Trump',
    size: 221.846, cx: 140, cy: 489,
    fontSize: 19.02, lineHeight: 22.185, tracking: -0.1902, padding: 31.692,
    topic: 'Trump' },

  { label: 'Milan',
    size: 112, cx: 560, cy: 544,
    fontSize: 9.6, lineHeight: 11.2, tracking: -0.096, padding: 16,
    topic: 'Milan' },

  { label: 'Android',
    size: 208.543, cx: 820, cy: 490,
    fontSize: 17.88, lineHeight: 20.854, tracking: -0.1788, padding: 29.792,
    topic: 'Android' },
];

// Headlines for each animatable topic — keep them clearly labeled so
// engineers and designers can tell which bubble should be reacting.
const TOPIC_HEADLINES: Record<string, string[]> = {
  Apple: [
    'New article that just appeared about Apple!',
    'Apple unveils new MacBook Pro lineup with M5 chip',
    'Apple Vision Pro 2 preview leaks online',
    'iPhone 17 rumors: bigger battery, slimmer design',
    "Apple's services revenue hits all-time high",
  ],
  'Harry Potter': [
    'New Harry Potter HBO series casts its lead',
    'Wizarding World theme park expansion announced',
    'Harry Potter at 30: a retrospective',
    "Studio confirms 'Cursed Child' film adaptation",
    'Rare Harry Potter first edition sells at auction',
  ],
  Android: [
    'Android 16 beta drops with new Material design',
    'Pixel 10 Pro leaks: triple-camera bar redesigned',
    'Android Auto adds new dashboard widgets',
    'Google rolls out Android-wide AI assistant',
    'Foldable Android phones gain market share',
  ],
};

const ROTATION = ['Apple', 'Harry Potter', 'Android'] as const;

let bumpIdx = 0;
export function makeNewArticle(): Article {
  const topic = ROTATION[bumpIdx % ROTATION.length];
  const headlines = TOPIC_HEADLINES[topic];
  const headline = headlines[Math.floor(bumpIdx / ROTATION.length) % headlines.length];
  bumpIdx++;
  return {
    id: makeId(),
    bot: BOTS[3],
    headline,
    url: 'apnews.com/live/iran-war-israel-trump-04-16-2026',
    topic,
  };
}
