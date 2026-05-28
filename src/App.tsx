import { useEffect, useMemo, useRef, useState } from 'react';
// NOTE: This branch (`tab-indicator`) replaces the orange line accent
// with a "tab" — a small beige pill that protrudes from the hairline
// next to the newest article row, then retracts back into the line.
// Source: Figma node 1766:43269 ("Tab").
import { AnimatePresence, motion } from 'framer-motion';
import { INITIAL_ARTICLES, BUBBLES, makeNewArticle, relaxBubbles, type Article } from './data';

const NEW_ARTICLE_HOLD_MS = 1600;
const AUTO_INTERVAL_MS = 3800;

/* ─────────────────────────────────────────────────────────
   Verbatim Figma radial gradient for the bubble-active glow.
   Color is the new brand/6 token (#ff5c33) — coral/orange,
   replacing the earlier positive/green tint.
   Inlined as an SVG data URL because the gradient uses an
   affine matrix transform CSS radial-gradient cannot express.
   ───────────────────────────────────────────────────────── */
const APPLE_GLOW_SVG =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 280 280' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%25' width='100%25' fill='url(%23grad)' opacity='0.15'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(8.45 -21.7 42.957 16.728 140 217)'><stop stop-color='rgba(26,21,20,0)' offset='0.26442'/><stop stop-color='rgba(178,72,38,0.5)' offset='0.55529'/><stop stop-color='rgba(255,92,51,1)' offset='0.84615'/></radialGradient></defs></svg>\")";

/* ───────────────────────── Top nav ───────────────────────── */
function Nav() {
  const links = ['Products', 'Solutions', 'Resources', 'Marketplace', 'AI companies', 'About'];
  return (
    <nav className="flex items-center justify-between h-[72px] px-12 py-4">
      <div className="w-[88px] font-jakarta font-bold text-xl tracking-[-0.4px]">TOLLBIT</div>
      <div className="flex gap-12">
        {links.map((l) => (
          <a key={l} className="font-jakarta font-medium text-sm leading-6 text-content-primary cursor-pointer">
            {l}
          </a>
        ))}
      </div>
      <button className="w-28 h-10 rounded-full bg-brand text-button-content font-jakarta font-bold text-sm leading-6 px-4 pb-0.5">
        Get started
      </button>
    </nav>
  );
}

/* ────────────────────── Article row ──────────────────────
   Reverted to the simpler layered structure (gap-0.5 vertical stack,
   no text truncation), but with two carry-overs from the canonical
   Figma impression (node 1771:43406):
     • Inner content width = 284px (matches the Figma component)
     • Bot icon = 10w × 16h chip (Figma's icon footprint)
   Typeface, sizes, tracking already match Figma:
     bot label   10/16/0.1  Regular  content/primary
     headline    13/20      Bold     content/primary
     url         10/16/0.1  Regular  content/tertiary

   The 28px left padding clears the hairline + tab indicator on the
   left edge of the list column.
*/
function ArticleRow({ article }: { article: Article }) {
  return (
    <div className="pl-7 py-4">
      <div className="flex flex-col gap-0.5 w-[284px]">
        <div className="flex items-center gap-1 font-jakarta text-[10px] leading-4 tracking-[0.1px] text-content-primary">
          <span
            className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-[3px] text-white text-[8px] font-bold"
            style={{ background: article.bot.color }}
          >
            {article.bot.letter}
          </span>
          {article.bot.name}
        </div>
        {/* Headline — Body/X Small Bold (Figma node 1764:24169):
            13/20/0 Bold content/primary, single-line ellipsis. */}
        <div className="font-jakarta font-bold text-[13px] leading-5 text-content-primary overflow-hidden text-ellipsis whitespace-nowrap">
          {article.headline}
        </div>
        {/* URL — Body/XS Small (Figma node 1764:24170):
            10/16/0.1 Regular content/tertiary, single-line ellipsis. */}
        <div className="font-jakarta text-[10px] leading-4 tracking-[0.1px] text-content-tertiary overflow-hidden text-ellipsis whitespace-nowrap">
          {article.url}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────── Tab indicator ──────────────────────
   Beige pill that "comes out of" the static grey hairline next to
   the newest article row. Anchored at the hairline (left = 0) with
   origin-left so it grows rightward — visually emerging from the line.

   Dimensions verbatim from Figma node 1766:43269:
     width  6px
     height 65px (≈ one row height)
     border-radius: 0 on the left, 32px on the right (pill end)
     background: --color-tab-bg (#dfd9d7)

   Animation:
     • isNew true  → scaleX 0 → 1, smooth ease-out  (emerges)
     • isNew false → scaleX 1 → 0, snappier ease    (retracts)
*/
function TabIndicator({ isNew }: { isNew: boolean }) {
  return (
    <motion.span
      aria-hidden
      className="absolute left-0 top-1 h-16 w-1.5 rounded-r-[32px] bg-tab-bg origin-left pointer-events-none"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: isNew ? 1 : 0 }}
      transition={
        isNew
          ? { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
          : { duration: 0.45, ease: [0.4, 0, 0.2, 1] }
      }
    />
  );
}

/* ───────────────── Hero + live impressions ───────────────── */
function LeftColumn({
  articles,
  newId,
}: {
  articles: Article[];
  newId: string | null;
}) {
  return (
    <div className="absolute left-12 top-28 w-[312px]">
      <h1 className="m-0 font-jakarta font-bold text-[44px] leading-[52px] tracking-[-1.32px] text-content-primary">
        8,751,845
      </h1>
      <p className="m-0 font-jakarta font-normal text-[13px] leading-5 text-content-secondary">
        AI impressions across TollBit sites today
      </p>

      <div className="mt-10">
        {/* Shift the row left by 8px so the dot's center (which sits 8px
            in from the dot container's left edge) aligns exactly with the
            list's static hairline at column-x = 0. */}
        <div className="flex gap-3 items-center mb-4 -ml-2">
          {/* Animated status dot: outer ring pulses, inner stays solid */}
          <span className="relative w-4 h-4">
            <span className="absolute inset-0 rounded-full bg-positive/20 animate-live-pulse" />
            <span className="absolute left-[5px] top-[5px] w-1.5 h-1.5 rounded-full bg-positive" />
          </span>
          <span className="font-jakarta font-bold text-base leading-[26px] text-content-primary">
            Live AI impressions
          </span>
        </div>

        <div
          className="relative w-[312px] h-[540px] overflow-hidden"
          style={{
            // fade out at the bottom so older items dissolve
            maskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
          }}
        >
          {/* Continuous static hairline divider — anchored at the list's
              left edge, full height. It never moves; new article rows slide
              in horizontally beside it. Per-row coral overrides (in
              ArticleRow) render on top of this. */}
          {/* Hairline starts at top-1 (4px) so its top edge aligns with
              the tab indicator, which is also anchored at top-1. */}
          <span className="absolute left-0 top-1 bottom-0 w-px bg-line-10" />

          <AnimatePresence initial={false}>
            {articles.map((a) => {
              const isNew = a.id === newId;
              return (
                // Outer wrapper handles vertical reflow (layout) + opacity
                // fade-in for the row as a whole. It does NOT slide
                // horizontally — that's the inner wrapper's job.
                <motion.div
                  key={a.id}
                  layout
                  initial={isNew ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    layout: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                    opacity: { duration: 0.45 },
                  }}
                  className="relative"
                >
                  {/* Beige tab indicator — protrudes from the hairline next
                      to the newest article, then retracts when it's no
                      longer the most recent. */}
                  <TabIndicator isNew={isNew} />

                  {/* Sliding content — the article text slides in from
                      the LEFT with a slow, heavy spring. (Same motion as
                      the tab variant, just mirrored on the x axis.) */}
                  <motion.div
                    initial={isNew ? { x: -120, y: -4, scale: 0.98 } : false}
                    // While isNew, the row sits 4px higher so it visually
                    // centers with the 64px-tall tab indicator on its left.
                    // When isNew clears (tab retracts), it eases back to y=0.
                    animate={{ x: 0, y: isNew ? -4 : 0, scale: 1 }}
                    transition={{
                      x: { type: 'spring', stiffness: 90, damping: 22 },
                      y: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                      scale: { duration: 0.6 },
                    }}
                  >
                    <ArticleRow article={a} />
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────── Bubble chart ─────────────────────
   Bubbles inside a fixed 1000×600 container. Each is centered
   on its (cx, cy) coords. The green-glow overlay is a sibling
   <div> (not a pseudo-element) so the Tailwind classes that
   describe the animation property are visible to engineers.
   ─────────────────────────────────────────────────────────  */
function BubbleChart({
  glowingTopic,
  topicBumps,
}: {
  glowingTopic: string | null;
  topicBumps: Record<string, number>;
}) {
  // Relax bubble centers whenever a bubble's effective radius changes
  // (i.e. whenever topicBumps changes). The growing bubble stays close to
  // home; neighbors are pushed just far enough that no two bubbles overlap.
  const positions = useMemo(() => relaxBubbles(BUBBLES, topicBumps), [topicBumps]);

  // 24-step sine-wave keyframes — denser than 12 so the linear chords
  // between samples are very short, eliminating perceptible "kinks" that
  // would otherwise show up as text shimmer.
  const SINE_STEPS = 24;
  const sineKF = (amp: number) =>
    Array.from({ length: SINE_STEPS + 1 }, (_, k) =>
      Number((amp * Math.sin((2 * Math.PI * k) / SINE_STEPS)).toFixed(3))
    );
  const FLOAT_AMP = 3;
  const xKeys = sineKF(FLOAT_AMP);
  const yKeys = sineKF(-FLOAT_AMP);

  return (
    <div className="absolute top-24 w-[1000px] h-[600px] left-[calc(25%+32px)]">
      {BUBBLES.map((b, i) => {
        const isGlow = glowingTopic === b.topic;
        const bumps = topicBumps[b.topic] ?? 0;
        const grownSize = b.size + 8 * bumps;
        const { cx, cy } = positions[i];
        // Outer wrapper handles relaxation displacement; inner handles
        // continuous float + scale, so the two transforms compose cleanly.
        const dx = cx - b.cx;
        const dy = cy - b.cy;

        // Per-bubble float — varied duration + negative delay so each bubble
        // is at a different point in its cycle and the cluster never moves
        // in lock-step. SPEED_FACTOR < 1 lengthens each cycle (slower drift).
        const SPEED_FACTOR = 0.9;
        const floatDurX = (5.5 + (i % 4) * 0.6) / SPEED_FACTOR;
        const floatDurY = (6.2 + ((i + 2) % 4) * 0.55) / SPEED_FACTOR;
        const phaseX = -((i * 0.71) % 1) * floatDurX;
        const phaseY = -((i * 1.37) % 1) * floatDurY;

        return (
          <motion.div
            key={`${b.label}-${i}`}
            className="absolute"
            style={{
              width: b.size,
              height: b.size,
              left: b.cx - b.size / 2,
              top: b.cy - b.size / 2,
            }}
            animate={{ x: dx, y: dy }}
            transition={{
              // Underdamped spring → pushed bubbles overshoot their target by
              // a few px, then settle. The growing bubble barely moves (mass
              // weighting in relaxBubbles), so it doesn't visibly bounce.
              x: { type: 'spring', stiffness: 140, damping: 11, mass: 0.7 },
              y: { type: 'spring', stiffness: 140, damping: 11, mass: 0.7 },
            }}
          >
            <motion.div
              className="absolute inset-0 rounded-full border border-white isolate flex items-center justify-center text-center font-jakarta font-bold text-content-secondary whitespace-pre-line select-none shadow-[0_4px_20px_0_var(--color-warm-shadow-1),0_2px_8px_0_var(--color-warm-shadow-2)] will-change-transform [transform:translateZ(0)] [backface-visibility:hidden]"
              style={{
                padding: b.padding,
                fontSize: b.fontSize,
                lineHeight: `${b.lineHeight}px`,
                letterSpacing: `${b.tracking}px`,
                backgroundImage:
                  'linear-gradient(157.17deg, rgba(26, 21, 20, 0.045) 0%, rgba(26, 21, 20, 0) 40%), linear-gradient(90deg, rgb(255, 253, 252) 0%, rgb(255, 253, 252) 100%)',
              }}
              animate={{
                scale: grownSize / b.size,
                // ±3px sine wave — smooth continuous motion, no pause at peaks
                x: xKeys,
                y: yKeys,
              }}
              transition={{
                scale: { duration: 1.2, ease: [0.45, 0, 0.55, 1] },
                // Linear interp between dense sine samples ≈ true sine motion
                x: { repeat: Infinity, duration: floatDurX, ease: 'linear', delay: phaseX },
                y: { repeat: Infinity, duration: floatDurY, ease: 'linear', delay: phaseY },
              }}
            >
              {/* Green radial-gradient overlay — opacity-tweens in/out */}
              <div
                aria-hidden
                className={`absolute inset-0 rounded-full pointer-events-none transition-opacity duration-[1200ms] ease-[cubic-bezier(0.45,0,0.55,1)] ${
                  isGlow ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  backgroundImage: APPLE_GLOW_SVG,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                }}
              />
              <span className="relative z-10">{b.label}</span>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ───────────────────── Bottom timeline ───────────────────── */
function Timeline() {
  return (
    <div className="absolute bottom-6 left-[calc(50%+232px)] w-[332px] flex flex-col gap-3">
      <div className="text-center font-jakarta font-bold text-base leading-[26px] text-content-primary">
        Hottest topics <span className="text-brand">today</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="w-14 text-right font-jakarta text-[10px] leading-4 tracking-[0.1px] text-content-secondary">
          Week ago
        </span>
        <div className="flex-1 flex justify-between items-center h-3.5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="w-1 h-1 rounded-full bg-bg-quaternary" />
          ))}
          <span className="w-6 h-1 rounded-full bg-brand" />
        </div>
        <span className="w-14 font-jakarta text-[10px] leading-4 tracking-[0.1px] text-content-secondary">
          Today
        </span>
      </div>
    </div>
  );
}

/* ───────────────────────── Page ───────────────────────── */
export default function App() {
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [newId, setNewId] = useState<string | null>(null);
  const [glowingTopic, setGlowingTopic] = useState<string | null>(null);
  // Permanent counter per topic — each new article bumps its bubble by 2px in diameter
  const [topicBumps, setTopicBumps] = useState<Record<string, number>>({});
  const holdRef = useRef<number | null>(null);
  const autoRef = useRef<number | null>(null);

  const addArticle = () => {
    const next = makeNewArticle();
    setArticles((prev) => [next, ...prev]);
    setNewId(next.id);
    setGlowingTopic(next.topic);
    setTopicBumps((prev) => ({
      ...prev,
      [next.topic]: (prev[next.topic] ?? 0) + 1,
    }));

    if (holdRef.current) window.clearTimeout(holdRef.current);
    holdRef.current = window.setTimeout(() => {
      // All three transient effects clear together: the article-card "is new"
      // state, the bubble's coral radial glow, and the list row's coral
      // highlight. They all share the same 1200ms ease-in-out fade.
      setNewId(null);
      setGlowingTopic(null);
    }, NEW_ARTICLE_HOLD_MS);
  };

  const reset = () => {
    if (holdRef.current) window.clearTimeout(holdRef.current);
    setArticles(INITIAL_ARTICLES);
    setNewId(null);
    setGlowingTopic(null);
    setTopicBumps({});
  };

  useEffect(() => {
    autoRef.current = window.setInterval(addArticle, AUTO_INTERVAL_MS);
    return () => {
      if (autoRef.current) window.clearInterval(autoRef.current);
      if (holdRef.current) window.clearTimeout(holdRef.current);
    };
  }, []);

  return (
    <div className="relative w-[1440px] mx-auto min-h-[880px]">
      <Nav />
      <LeftColumn articles={articles} newId={newId} />
      <BubbleChart glowingTopic={glowingTopic} topicBumps={topicBumps} />
      <Timeline />

      <div className="fixed bottom-6 left-6 flex gap-2 z-10">
        <button
          onClick={reset}
          className="px-4 py-2.5 rounded-full bg-card-bg text-content-primary border border-line-10 font-jakarta font-bold text-[13px]"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
