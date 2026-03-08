/**
 * useScrollFrames.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Custom hook that wires together:
 *   • Frame loading (via frameLoader.ts)
 *   • Scroll-to-frame-index mapping (via scrollProgress.ts)
 *   • requestAnimationFrame render loop
 *   • Canvas drawing
 *
 * Design constraints
 * ──────────────────
 * • ZERO React state updates on the hot scroll path — all mutable data lives
 *   in refs so the component never re-renders mid-scroll.
 * • Passive scroll listener to avoid blocking the browser's scroll thread.
 * • IntersectionObserver pauses the rAF loop while the hero is off-screen,
 *   saving battery and GPU cycles.
 * • ResizeObserver keeps the canvas pixel dimensions in sync with the layout.
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  TOTAL_FRAMES,
  type FrameCache,
  startFrameLoading,
  releaseFrameCache,
} from "../utils/frameLoader";
import {
  getFrameIndexForScroll,
  getSectionScrollableHeight,
} from "../utils/scrollProgress";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseScrollFramesOptions {
  /** Ref to the outermost hero section element (provides scroll metrics). */
  sectionRef: React.RefObject<HTMLElement | null>;
  /** Ref to the <canvas> element that will receive drawImage calls. */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** When true the reduced-motion fallback is active; skip rAF entirely. */
  reducedMotion: boolean;
}

export interface UseScrollFramesReturn {
  /** Number of frames loaded so far (for an optional loading indicator). */
  loadedCount: number;
  /** true once all frames have been loaded into cache. */
  isFullyLoaded: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useScrollFrames({
  sectionRef,
  canvasRef,
  reducedMotion,
}: UseScrollFramesOptions): UseScrollFramesReturn {
  // ── Detect mobile once on mount ────────────────────────────────────────────
  const isMobile = useRef(false);
  useEffect(() => {
    isMobile.current =
      /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ||
      window.innerWidth < 768;
  }, []);

  // ── Frame cache (lives outside React state) ────────────────────────────────
  const frameCacheRef = useRef<FrameCache>(
    Array.from({ length: TOTAL_FRAMES }, () => null)
  );

  // ── Scroll / layout state (all refs — never triggers re-renders) ───────────
  const scrollYRef = useRef(0);
  const sectionTopRef = useRef(0);
  const scrollableHeightRef = useRef(0);
  const currentFrameIndexRef = useRef(-1); // -1 = not yet drawn
  const isVisibleRef = useRef(true); // IntersectionObserver flag
  const rafIdRef = useRef<number | null>(null);

  // ── React state (only for progress display, not on hot path) ──────────────
  const [loadedCount, setLoadedCount] = useState(0);
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);

  // ── Canvas drawing ─────────────────────────────────────────────────────────

  /**
   * Draw the frame at `index` onto the canvas.
   * Falls back to the nearest available frame if the exact index is missing.
   */
  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cache = frameCacheRef.current;

    // Find nearest loaded frame (prefer looking backwards for continuity).
    let bitmap: ImageBitmap | null = cache[index] ?? null;
    if (!bitmap) {
      for (let offset = 1; offset < 10; offset++) {
        bitmap = cache[Math.max(0, index - offset)] ?? null;
        if (bitmap) break;
        bitmap = cache[Math.min(TOTAL_FRAMES - 1, index + offset)] ?? null;
        if (bitmap) break;
      }
    }

    if (!bitmap) return;

    // Letterbox / fill: draw the bitmap centred and aspect-ratio-correct.
    const cw = canvas.width;
    const ch = canvas.height;
    const bw = bitmap.width;
    const bh = bitmap.height;

    const scale = Math.max(cw / bw, ch / bh);
    const dw = bw * scale;
    const dh = bh * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(bitmap, dx, dy, dw, dh);
  }, [canvasRef]);

  // ── rAF render loop ────────────────────────────────────────────────────────

  const renderLoop = useCallback(() => {
    if (!isVisibleRef.current) {
      rafIdRef.current = requestAnimationFrame(renderLoop);
      return;
    }

    const totalFrames = isMobile.current
      ? Math.ceil(TOTAL_FRAMES / 2)
      : TOTAL_FRAMES;

    const frameIndex = getFrameIndexForScroll(
      {
        scrollY: scrollYRef.current,
        sectionTop: sectionTopRef.current,
        scrollableHeight: scrollableHeightRef.current,
      },
      totalFrames,
      true // enable ease-in-out
    );

    // Map mobile frame index back to cache index (mobile uses every 2nd frame).
    const cacheIndex = isMobile.current ? frameIndex * 2 : frameIndex;
    const clampedCacheIndex = Math.min(cacheIndex, TOTAL_FRAMES - 1);

    // Only redraw when the frame actually changes.
    if (clampedCacheIndex !== currentFrameIndexRef.current) {
      currentFrameIndexRef.current = clampedCacheIndex;
      drawFrame(clampedCacheIndex);
    }

    rafIdRef.current = requestAnimationFrame(renderLoop);
  }, [drawFrame]);

  // ── Scroll listener ────────────────────────────────────────────────────────

  useEffect(() => {
    if (reducedMotion) return;

    const onScroll = () => {
      scrollYRef.current = window.scrollY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reducedMotion]);

  // ── ResizeObserver — keep canvas size and layout metrics fresh ─────────────

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    const updateMetrics = () => {
      const rect = section.getBoundingClientRect();
      sectionTopRef.current = rect.top + window.scrollY;
      scrollableHeightRef.current = getSectionScrollableHeight(section);

      // Keep canvas pixel buffer in sync with displayed size.
      const { offsetWidth, offsetHeight } = canvas;
      if (
        canvas.width !== offsetWidth ||
        canvas.height !== offsetHeight
      ) {
        canvas.width = offsetWidth;
        canvas.height = offsetHeight;
        // Re-draw current frame at new resolution.
        if (currentFrameIndexRef.current >= 0) {
          drawFrame(currentFrameIndexRef.current);
        }
      }
    };

    updateMetrics();

    const ro = new ResizeObserver(updateMetrics);
    ro.observe(section);
    return () => ro.disconnect();
  }, [sectionRef, canvasRef, drawFrame]);

  // ── IntersectionObserver — pause loop when hero is off-screen ─────────────

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0 }
    );

    io.observe(section);
    return () => io.disconnect();
  }, [sectionRef]);

  // ── Start rAF loop ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (reducedMotion) return;

    rafIdRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    };
  }, [reducedMotion, renderLoop]);

  // ── Frame loading ──────────────────────────────────────────────────────────

  useEffect(() => {
    const controller = new AbortController();
    const cache = frameCacheRef.current;
    const mobile = isMobile.current;
    const total = mobile ? 72 : TOTAL_FRAMES;

    startFrameLoading(
      cache,
      mobile,
      (loaded) => {
        setLoadedCount(loaded);
        if (loaded >= total) setIsFullyLoaded(true);
      },
      controller.signal
    );

    return () => {
      controller.abort();
      releaseFrameCache(cache);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { loadedCount, isFullyLoaded };
}