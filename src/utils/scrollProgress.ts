/**
 * scrollProgress.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure utility functions for translating raw scroll position into a normalised
 * [0, 1] progress value and then into a discrete frame index.
 *
 * Keeping the math isolated here makes it trivial to unit-test and easy to
 * swap in a different easing curve without touching the rendering logic.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScrollMetrics {
  /** Current window.scrollY value (pixels). */
  scrollY: number;
  /**
   * Top offset of the hero section from the document origin (pixels).
   * This is used so the animation starts only once the hero enters the viewport.
   */
  sectionTop: number;
  /**
   * Scrollable height available for the animation.
   * Typically: heroElement.offsetHeight - window.innerHeight
   * i.e. the section height minus one viewport — the range over which the
   * animation should play out.
   */
  scrollableHeight: number;
}

// ─── Core calculations ────────────────────────────────────────────────────────

/**
 * Normalise the current scroll position into a [0, 1] progress value relative
 * to the hero section.
 *
 * • Returns 0 before the section is reached.
 * • Returns 1 once the section is fully scrolled past.
 *
 * @example
 *   // sectionTop = 0, scrollableHeight = 2 * window.innerHeight (250vh − 1vh)
 *   getScrollProgress({ scrollY: 0,    sectionTop: 0, scrollableHeight: 1600 }) // → 0
 *   getScrollProgress({ scrollY: 800,  sectionTop: 0, scrollableHeight: 1600 }) // → 0.5
 *   getScrollProgress({ scrollY: 1600, sectionTop: 0, scrollableHeight: 1600 }) // → 1
 */
export function getScrollProgress(metrics: ScrollMetrics): number {
  const { scrollY, sectionTop, scrollableHeight } = metrics;

  if (scrollableHeight <= 0) return 0;

  const relativeScroll = scrollY - sectionTop;
  const raw = relativeScroll / scrollableHeight;

  // Clamp strictly to [0, 1].
  return Math.max(0, Math.min(1, raw));
}

/**
 * Map a normalised scroll progress value [0, 1] to a discrete frame index
 * [0, totalFrames - 1].
 *
 * The frame index is floored so it always selects a *loaded* frame rather than
 * interpolating between two — interpolation would require two canvas draws per
 * scroll event, which is not warranted at 24 fps source material.
 *
 * @param progress    Normalised scroll value from getScrollProgress().
 * @param totalFrames Total number of frames in the sequence.
 */
export function progressToFrameIndex(
  progress: number,
  totalFrames: number
): number {
  const raw = progress * (totalFrames - 1);
  return Math.min(Math.floor(raw), totalFrames - 1);
}

// ─── Easing (optional) ────────────────────────────────────────────────────────

/**
 * Optional ease-in-out cubic applied to the raw scroll progress before it is
 * mapped to a frame index.  This smooths out the perceived speed of the
 * animation — the opening and closing frames linger slightly longer, matching
 * the cinematic feel of the source material.
 *
 * Pass `eased = true` to getFrameIndexForScroll() to activate.
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Convenience wrapper ──────────────────────────────────────────────────────

/**
 * Single entry point that combines getScrollProgress → (optional ease) →
 * progressToFrameIndex.
 *
 * @param metrics     Raw scroll / layout data.
 * @param totalFrames Total frames in the cache.
 * @param eased       Whether to apply ease-in-out cubic (default: true).
 */
export function getFrameIndexForScroll(
  metrics: ScrollMetrics,
  totalFrames: number,
  eased = true
): number {
  const rawProgress = getScrollProgress(metrics);
  const progress = eased ? easeInOutCubic(rawProgress) : rawProgress;
  return progressToFrameIndex(progress, totalFrames);
}

// ─── Section measurement helper ───────────────────────────────────────────────

/**
 * Derive scrollable height from a section element reference.
 * This is a convenience helper for use inside a ResizeObserver callback.
 *
 * @param el  The hero section HTMLElement.
 */
export function getSectionScrollableHeight(el: HTMLElement): number {
  return Math.max(0, el.offsetHeight - window.innerHeight);
}