/**
 * HeroScrollCanvas.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Award-quality cinematic scroll-driven hero component.
 *
 * Architecture at a glance
 * ────────────────────────
 *   <HeroSection>          250vh sticky container — gives scroll distance
 *     <StickyViewport>     100vh sticky inner — stays in view while scrolling
 *       <canvas>           GPU-rendered frame sequence (behind text)
 *       <GrainOverlay>     Subtle film-grain SVG filter for cinematic texture
 *       <VignetteOverlay>  Radial-gradient vignette for depth
 *       <HeroContent>      Headline / CTA / progress (layered above canvas)
 *     </StickyViewport>
 *   </HeroSection>
 *
 * Layering (z-index)
 * ──────────────────
 *   canvas          z-0   GPU frame rendering
 *   GrainOverlay    z-10  blended grain — adds texture
 *   VignetteOverlay z-10  radial vignette — adds depth
 *   HeroContent     z-20  text / CTA — always readable
 *
 * Performance guarantees
 * ──────────────────────
 *   • No setState on the scroll/rAF hot path (refs only)
 *   • Passive scroll listener
 *   • IntersectionObserver pauses rAF when off-screen
 *   • ResizeObserver keeps canvas pixel buffer correct
 *   • ImageBitmap for GPU-direct draws
 *   • Reduced-motion: static first-frame + no rAF
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useScrollFrames } from "../hooks/useScrollFrames";
import { TOTAL_FRAMES } from "../utils/frameLoader";
import { framePath } from "../utils/frameLoader";

// ─── Reduced-motion detection ─────────────────────────────────────────────────

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Subtle cinematic film-grain overlay rendered via SVG turbulence filter. */
function GrainOverlay() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        pointerEvents: "none",
        opacity: 0.045,
        mixBlendMode: "overlay",
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "128px 128px",
      }}
    />
  );
}

/** Radial vignette for depth and focus on the centre-frame subject. */
function VignetteOverlay() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        pointerEvents: "none",
        background:
          "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, rgba(0,0,0,0.55) 100%)",
      }}
    />
  );
}

/** Scanline overlay for a subtle CRT / holographic aesthetic. */
function ScanlineOverlay() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        pointerEvents: "none",
        opacity: 0.025,
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 4px)",
      }}
    />
  );
}

/** Animated loading bar — visible while frames are loading. */
interface LoadingBarProps {
  loaded: number;
  total: number;
  hidden: boolean;
}

function LoadingBar({ loaded, total, hidden }: LoadingBarProps) {
  const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;

  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Loading hero animation"
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "2px",
        zIndex: 30,
        opacity: hidden ? 0 : 1,
        transition: "opacity 0.6s ease 0.4s",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background:
            "linear-gradient(90deg, #d64fd9 0%, #b833bb 50%, #d64fd9 100%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s linear infinite",
          transition: "width 0.3s ease",
          boxShadow: "0 0 8px rgba(214,79,217,0.8)",
        }}
      />
    </div>
  );
}

// ─── Scroll-progress indicator ────────────────────────────────────────────────

/** Thin vertical scroll indicator on the right edge — elegant and informative. */
interface ScrollIndicatorProps {
  sectionRef: React.RefObject<HTMLElement | null>;
}

function ScrollIndicator({ sectionRef }: ScrollIndicatorProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const section = sectionRef.current;
    if (!track || !section) return;

    const update = () => {
      const rect = section.getBoundingClientRect();
      const sectionTop = rect.top + window.scrollY;
      const scrollableHeight = section.offsetHeight - window.innerHeight;
      if (scrollableHeight <= 0) return;
      const progress = Math.max(
        0,
        Math.min(1, (window.scrollY - sectionTop) / scrollableHeight)
      );
      track.style.transform = `scaleY(${progress})`;
    };

    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, [sectionRef]);

  return (
    <div className="hero-scroll-indicator">
      <div
        ref={trackRef}
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, #d64fd9, #b833bb)",
          transformOrigin: "top center",
          transform: "scaleY(0)",
          borderRadius: "1px",
          boxShadow: "0 0 6px rgba(214,79,217,0.6)",
        }}
      />
    </div>
  );
}

// ─── Hero content ─────────────────────────────────────────────────────────────

interface HeroContentProps {
  reducedMotion: boolean;
}

function HeroContent({ reducedMotion }: HeroContentProps) {
  const anim = (delay: string) =>
    reducedMotion ? "none" : `fadeSlideUp 0.9s cubic-bezier(.16,1,.3,1) ${delay} both`;

  return (
    <div className="hero-content-wrap">
      {/* Eyebrow */}
      <div
        className="hero-eyebrow"
        style={{ animation: anim("0.1s") }}
      >
        <span style={{
          width: 24, height: 1, flexShrink: 0, display: "inline-block",
          background: "linear-gradient(90deg,#d64fd9,#b833bb)",
        }} />
        Built for the AI Era
      </div>

      {/* Headline */}
      <h1
        className="hero-h1"
        style={{ animation: anim("0.25s") }}
      >
        Dominate<br />
        with{" "}
        <span style={{
          backgroundImage: "linear-gradient(110deg, #d64fd9, #b833bb)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          Intelligence.
        </span>
        <br />
        <span style={{
          WebkitTextStroke: "1.5px rgba(245,240,234,0.3)",
          WebkitTextFillColor: "transparent",
          color: "transparent",
        }}>
          Lead Without
        </span>
        <br />
        Limits.
      </h1>

      {/* Subheadline */}
      <p
        className="hero-sub"
        style={{ animation: anim("0.4s") }}
      >
        Advanced AI and Cloud programs engineered to create fearless
        innovators ready to compete on a global stage.
      </p>

      {/* CTAs */}
      <div
        className="hero-cta-row"
        style={{ animation: anim("0.55s") }}
      >
        <a href="#courses" className="hero-btn-primary">
          Explore Courses
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7h10M8 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
        <a href="#demo" className="hero-btn-ghost">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M5.5 5l3 2-3 2V5z" fill="currentColor" />
          </svg>
          Book Free Demo
        </a>
      </div>

      {/* Scroll hint */}
      <div
        className="hero-scroll-hint"
        style={{
          animation: reducedMotion
            ? "none"
            : "fadeSlideUp 0.8s ease 0.9s both, scrollHintBob 2s ease-in-out infinite 2s",
        }}
      >
        <div style={{
          width: 1, height: 32, flexShrink: 0,
          background: "linear-gradient(to bottom, #d64fd9, transparent)",
        }} />
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "0.58rem",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(214,79,217,0.6)",
        }}>
          Scroll to explore
        </span>
      </div>
    </div>
  );
}

// ─── Reduced-motion fallback ───────────────────────────────────────────────────

function StaticHeroFallback() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        background:
          "radial-gradient(ellipse 80% 80% at 60% 50%, #0a1628 0%, #010408 100%)",
      }}
    >
      <img
        src={framePath(1)}
        alt=""
        aria-hidden="true"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          opacity: 0.7,
        }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * HeroScrollCanvas
 *
 * Drop this component at the top of your page.  It owns the 250vh scroll
 * section; everything below it sits after the hero in normal document flow.
 *
 * @example
 *   // app/page.tsx
 *   import HeroScrollCanvas from "@/components/HeroScrollCanvas";
 *
 *   export default function Page() {
 *     return (
 *       <main>
 *         <HeroScrollCanvas />
 *         <section>... rest of page ...</section>
 *       </main>
 *     );
 *   }
 */
export default function HeroScrollCanvas() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  // Total frames exposed to the loading hook.
  const totalFrames = TOTAL_FRAMES;

  const { loadedCount, isFullyLoaded } = useScrollFrames({
    sectionRef: sectionRef as React.RefObject<HTMLElement | null>,
    canvasRef: canvasRef as React.RefObject<HTMLCanvasElement | null>,
    reducedMotion,
  });

  return (
    <>
      {/* ── Global keyframe + responsive styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:ital,wght@0,300;0,400;0,600;1,300&family=Barlow+Condensed:wght@700;800&family=DM+Mono:wght@400;500&display=swap');

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scrollHintBob {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50%       { transform: translateY(5px); opacity: 0.6; }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Hero content wrapper ── */
        .hero-content-wrap {
          position: absolute;
          inset: 0;
          z-index: 20;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: clamp(1.25rem, 4vw, 3rem);
          padding-top: max(80px, env(safe-area-inset-top, 80px));
          padding-bottom: clamp(1.5rem, 5vw, 3.5rem);
          pointer-events: none;
          overflow: hidden;
        }

        /* ── Eyebrow ── */
        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          font-family: 'DM Mono', 'Courier New', monospace;
          font-size: clamp(0.55rem, 2.2vw, 0.72rem);
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #d64fd9;
          margin-bottom: 0.7rem;
        }

        /* ── Headline ── */
        .hero-h1 {
          font-family: 'Bebas Neue', 'Arial Black', sans-serif;
          font-weight: 400;
          font-size: clamp(2.2rem, 10vw, 6rem);
          line-height: 0.93;
          letter-spacing: 0.02em;
          color: #f5f0ea;
          margin: 0 0 0.75rem;
          text-shadow: 0 4px 40px rgba(0,0,0,0.7);
        }

        /* ── Subheadline ── */
        .hero-sub {
          font-family: 'Barlow', sans-serif;
          font-weight: 300;
          font-style: italic;
          font-size: clamp(0.88rem, 3.2vw, 1.15rem);
          line-height: 1.65;
          color: rgba(245,240,234,0.55);
          max-width: 46ch;
          margin: 0 0 1.4rem;
        }

        /* ── CTA row ── */
        .hero-cta-row {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          pointer-events: auto;
        }

        /* ── Primary button ── */
        .hero-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.8rem 1.8rem;
          background: linear-gradient(110deg, #d64fd9, #b833bb);
          color: #fff;
          font-family: 'Barlow Condensed', 'Arial Narrow', sans-serif;
          font-weight: 700;
          font-size: clamp(0.82rem, 2.5vw, 1rem);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
          box-shadow: 0 4px 28px rgba(214,79,217,0.45);
          transition: opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
          white-space: nowrap;
        }
        .hero-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 36px rgba(214,79,217,0.65);
        }

        /* ── Ghost button ── */
        .hero-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.8rem 1.8rem;
          border: 1px solid rgba(245,240,234,0.2);
          color: #f5f0ea;
          font-family: 'Barlow Condensed', 'Arial Narrow', sans-serif;
          font-weight: 700;
          font-size: clamp(0.82rem, 2.5vw, 1rem);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          backdrop-filter: blur(6px);
          clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
          transition: background 0.2s ease, border-color 0.2s ease;
          white-space: nowrap;
        }
        .hero-btn-ghost:hover {
          background: rgba(214,79,217,0.1);
          border-color: rgba(214,79,217,0.5);
        }

        /* ── Scroll hint ── */
        .hero-scroll-hint {
          margin-top: 1.2rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          opacity: 0;
        }

        /* ── Scroll indicator (right edge) ── */
        .hero-scroll-indicator {
          position: absolute;
          right: 24px;
          top: 50%;
          transform: translateY(-50%);
          width: 2px;
          height: 120px;
          background: rgba(255,255,255,0.12);
          z-index: 20;
          border-radius: 1px;
        }

        /* ── Mobile dark gradient — makes text readable over the robot arm ── */
        .hero-mobile-overlay {
          display: none;
          position: absolute;
          inset: 0;
          z-index: 6;
          pointer-events: none;
          background: linear-gradient(
            to right,
            rgba(4,6,12,0.82) 0%,
            rgba(4,6,12,0.55) 50%,
            transparent 100%
          );
        }

        /* ════════════════════════════════════
           TABLET  ≤ 1024px
        ════════════════════════════════════ */
        @media (max-width: 1024px) {
          .hero-h1 {
            font-size: clamp(2.4rem, 7.5vw, 4rem);
          }
        }

        /* ════════════════════════════════════
           MOBILE  ≤ 768px
        ════════════════════════════════════ */
        @media (max-width: 768px) {
          .hero-mobile-overlay { display: block; }

          .hero-scroll-indicator { display: none; }

          .hero-content-wrap {
            justify-content: flex-end;
            padding: 72px 1.25rem 1.75rem;
          }

          .hero-eyebrow {
            font-size: 0.6rem;
            margin-bottom: 0.6rem;
          }

          .hero-h1 {
            font-size: clamp(2rem, 11vw, 3rem);
            line-height: 0.94;
            margin-bottom: 0.65rem;
          }

          .hero-sub {
            font-size: 0.9rem;
            margin-bottom: 1.2rem;
            max-width: 36ch;
          }

          .hero-cta-row {
            gap: 0.6rem;
          }

          .hero-btn-primary,
          .hero-btn-ghost {
            padding: 0.75rem 1.4rem;
            font-size: 0.82rem;
          }

          .hero-scroll-hint {
            margin-top: 0.9rem;
          }
        }

        /* ════════════════════════════════════
           SMALL MOBILE  ≤ 480px
        ════════════════════════════════════ */
        @media (max-width: 480px) {
          .hero-h1 {
            font-size: clamp(1.8rem, 12vw, 2.6rem);
          }

          .hero-cta-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .hero-btn-primary,
          .hero-btn-ghost {
            width: 100%;
            justify-content: center;
          }
        }

        /* ════════════════════════════════════
           LANDSCAPE MOBILE  (short + wide)
        ════════════════════════════════════ */
        @media (max-height: 500px) and (orientation: landscape) {
          .hero-content-wrap {
            padding-top: 64px;
            padding-bottom: 1rem;
          }
          .hero-h1 { font-size: clamp(1.6rem, 5vh, 3rem); margin-bottom: 0.4rem; }
          .hero-sub { display: none; }
          .hero-scroll-hint { display: none; }
        }

        /* ════════════════════════════════════
           REDUCED MOTION
        ════════════════════════════════════ */
        @media (prefers-reduced-motion: reduce) {
          .hero-eyebrow,
          .hero-h1,
          .hero-sub,
          .hero-cta-row,
          .hero-scroll-hint {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>

      {/*
       * ── Outer scroll section ──────────────────────────────────────────────
       * 250vh tall — provides the scroll distance to drive the animation.
       * position:relative anchors the sticky child.
       */}
      <section
        ref={sectionRef}
        aria-label="Hero animation section"
        style={{
          position: "relative",
          height: "250vh",
          backgroundColor: "#010408", // deep space fallback
        }}
      >
        {/*
         * ── Sticky viewport ───────────────────────────────────────────────
         * 100vh sticky inner — locks to the top of the viewport while the
         * outer section scrolls beneath it.
         */}
        <div
          style={{
            position: "sticky",
            top: 0,
            left: 0,
            right: 0,
            height: "100vh",
            overflow: "hidden",
          }}
        >
          {/* ── Reduced-motion fallback ── */}
          {reducedMotion && <StaticHeroFallback />}

          {/* ── Canvas (z-0, behind everything) ── */}
          {!reducedMotion && (
            <canvas
              ref={canvasRef}
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                zIndex: 0,
                backgroundColor: "#010408",
              }}
            />
          )}

          {/* ── Atmospheric overlays ── */}
          <GrainOverlay />
          <VignetteOverlay />
          <ScanlineOverlay />

          {/* ── Mobile left-side dark gradient (text readability) ── */}
          <div className="hero-mobile-overlay" aria-hidden="true" />

          {/* ── Hero text content (z-20) ── */}
          <HeroContent reducedMotion={reducedMotion} />

          {/* ── Scroll progress indicator ── */}
          {!reducedMotion && <ScrollIndicator sectionRef={sectionRef as React.RefObject<HTMLElement | null>} />}

          {/* ── Frame loading bar (disappears when fully loaded) ── */}
          {!reducedMotion && (
            <LoadingBar
              loaded={loadedCount}
              total={totalFrames}
              hidden={isFullyLoaded}
            />
          )}

          {/* ── Frame counter (debug — remove in production) ── */}
          {process.env.NODE_ENV === "development" && !reducedMotion && (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                zIndex: 30,
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.65rem",
                color: "rgba(255,255,255,0.3)",
                letterSpacing: "0.1em",
              }}
            >
              {loadedCount} / {totalFrames} frames
            </div>
          )}
        </div>

        {/* ── Bottom gradient blending into next section ── */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "20vh",
            background:
              "linear-gradient(to bottom, transparent, #010408)",
            pointerEvents: "none",
            zIndex: 5,
          }}
        />
      </section>
    </>
  );
}