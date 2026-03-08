/**
 * app/page.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Root page — demonstrates HeroScrollCanvas integrated into a Next.js App
 * Router page.  The hero occupies the first 250vh of document height; the
 * rest of the page content follows in normal flow below it.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import HeroScrollCanvas from "@/components/HeroScrollCanvas";

export default function HomePage() {
  return (
    <main
      style={{
        background: "#010408",
        color: "#fff",
        minHeight: "100vh",
      }}
    >
      {/* Cinematic scroll-driven hero */}
      <HeroScrollCanvas />

      {/* ── Content below hero ─────────────────────────────────────────────── */}
      <section
        id="courses"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "8rem 2rem",
        }}
      >
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.75rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#00d4ff",
            marginBottom: "1rem",
          }}
        >
          Programmes
        </p>
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(2rem, 4vw, 3.5rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            marginBottom: "4rem",
            color: "#fff",
          }}
        >
          What you&apos;ll master.
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {[
            {
              title: "Foundation in AI",
              desc: "Mathematics, probability, and the core building blocks of modern machine learning.",
              tag: "8 weeks",
            },
            {
              title: "Deep Learning & LLMs",
              desc: "Transformers, fine-tuning, RLHF — become fluent in the architecture powering today's AI.",
              tag: "12 weeks",
            },
            {
              title: "Production ML Systems",
              desc: "MLOps, inference optimization, monitoring — ship models that actually run at scale.",
              tag: "10 weeks",
            },
          ].map((course) => (
            <div
              key={course.title}
              style={{
                padding: "2rem",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.02)",
                backdropFilter: "blur(4px)",
              }}
            >
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.65rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#7b61ff",
                  display: "block",
                  marginBottom: "0.75rem",
                }}
              >
                {course.tag}
              </span>
              <h3
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: "1.25rem",
                  marginBottom: "0.75rem",
                  color: "#fff",
                }}
              >
                {course.title}
              </h3>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 300,
                  fontSize: "0.9rem",
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                {course.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}