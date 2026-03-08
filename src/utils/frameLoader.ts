/**
 * frameLoader.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles progressive, priority-aware loading of WebP animation frames into an
 * in-memory cache.  Frames are stored as ImageBitmap objects for zero-copy
 * transfer to the canvas — the fastest path available in modern browsers.
 *
 * Strategy
 * ─────────
 * 1.  Immediately load frames 1–EAGER_COUNT (the first visible frames).
 * 2.  Schedule the remaining frames via requestIdleCallback (or setTimeout
 *     fallback) so the main thread stays unblocked during the critical
 *     first-paint window.
 * 3.  Each failed request is retried up to MAX_RETRIES times with exponential
 *     back-off before being silently skipped.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Total frames in the sequence (matches ffmpeg extraction). */
export const TOTAL_FRAMES = 192;; // UPDATE THIS after frame extraction in Step 3

/** Frames loaded synchronously before idle scheduling begins. */
const EAGER_COUNT = 10;

/** Maximum retry attempts per frame on network failure. */
const MAX_RETRIES = 3;

/** Base delay (ms) for exponential back-off: delay = BASE * 2^attempt */
const RETRY_BASE_MS = 200;

// ─── Types ────────────────────────────────────────────────────────────────────

/** Shared mutable frame cache.  Index → ImageBitmap (or null while pending). */
export type FrameCache = Array<ImageBitmap | null>;

/** Progress callback invoked after every successfully loaded frame. */
export type LoadProgressCallback = (loaded: number, total: number) => void;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converts a 1-based frame number to the canonical public path.
 * Frame skipping for mobile (every-other-frame mode) is handled by the caller;
 * this function always maps the *logical* frame to the correct filename.
 */
export function framePath(frameNumber: number): string {
  const padded = String(frameNumber).padStart(4, "0");
  return `/hero-frames/frame_${padded}.webp`;
}

/**
 * Sleep utility used by the retry logic.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Load a single frame by 1-based index with retry + back-off.
 * Returns null (rather than throwing) after all retries are exhausted so the
 * render loop can gracefully skip missing frames.
 */
async function loadFrameWithRetry(
  frameNumber: number,
  signal: AbortSignal
): Promise<ImageBitmap | null> {
  const url = framePath(frameNumber);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (signal.aborted) return null;

    try {
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();
      if (signal.aborted) return null;

      // ImageBitmap decoding is off-main-thread in supporting browsers.
      return await createImageBitmap(blob);
    } catch (err) {
      // AbortError means the component unmounted — stop silently.
      if (signal.aborted) return null;

      const isLastAttempt = attempt === MAX_RETRIES;
      if (!isLastAttempt) {
        await sleep(RETRY_BASE_MS * Math.pow(2, attempt));
      } else {
        console.warn(`[frameLoader] Failed to load frame ${frameNumber}:`, err);
        return null;
      }
    }
  }

  return null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Kick off the two-phase progressive loading pipeline.
 *
 * @param cache         Mutable array pre-filled with nulls (length = TOTAL_FRAMES).
 * @param isMobile      When true, only even-numbered frames are loaded (72 frames).
 * @param onProgress    Optional callback fired after each frame lands in cache.
 * @param signal        AbortSignal so loading can be cancelled on unmount.
 */
export async function startFrameLoading(
  cache: FrameCache,
  isMobile: boolean,
  onProgress?: LoadProgressCallback,
  signal?: AbortSignal
): Promise<void> {
  const abort = signal ?? new AbortController().signal;

  /**
   * Determine which 1-based frame numbers to load.
   * Mobile: frames 1, 3, 5 … (every other) → 72 frames.
   * Desktop: frames 1 – 144 → 144 frames.
   */
  const frameNumbers: number[] = [];
  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    if (isMobile && i % 2 !== 0) continue; // skip odd on mobile
    if (!isMobile || true) frameNumbers.push(i);
  }
  // Rebuild for clarity:
  const targets = isMobile
    ? Array.from({ length: 72 }, (_, k) => k * 2 + 2) // even frames: 2,4,6…144
    : Array.from({ length: TOTAL_FRAMES }, (_, k) => k + 1);

  const total = targets.length;
  let loaded = 0;

  // ── Phase 1: Eager load (first EAGER_COUNT frames, in parallel) ────────────
  const eagerTargets = targets.slice(0, EAGER_COUNT);
  await Promise.all(
    eagerTargets.map(async (frameNum) => {
      if (abort.aborted) return;
      const bitmap = await loadFrameWithRetry(frameNum, abort);
      if (bitmap) {
        cache[frameNum - 1] = bitmap;
        loaded++;
        onProgress?.(loaded, total);
      }
    })
  );

  if (abort.aborted) return;

  // ── Phase 2: Background load (remaining frames via idle callback) ──────────
  const remainingTargets = targets.slice(EAGER_COUNT);

  await new Promise<void>((resolve) => {
    let index = 0;

    const scheduleNext = () => {
      if (abort.aborted || index >= remainingTargets.length) {
        resolve();
        return;
      }

      const scheduleFn =
        typeof requestIdleCallback !== "undefined"
          ? (cb: () => void) => requestIdleCallback(cb, { timeout: 2000 })
          : (cb: () => void) => setTimeout(cb, 16);

      scheduleFn(async () => {
        // Process a small batch per idle slot to balance throughput vs latency.
        const BATCH = 4;
        const batch = remainingTargets.slice(index, index + BATCH);
        index += BATCH;

        await Promise.all(
          batch.map(async (frameNum) => {
            if (abort.aborted) return;
            const bitmap = await loadFrameWithRetry(frameNum, abort);
            if (bitmap) {
              cache[frameNum - 1] = bitmap;
              loaded++;
              onProgress?.(loaded, total);
            }
          })
        );

        scheduleNext();
      });
    };

    scheduleNext();
  });
}

/**
 * Release all ImageBitmaps in the cache to free GPU memory.
 * Must be called when the component unmounts.
 */
export function releaseFrameCache(cache: FrameCache): void {
  for (let i = 0; i < cache.length; i++) {
    cache[i]?.close();
    cache[i] = null;
  }
}