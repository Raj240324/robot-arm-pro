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
    </main>
  );
}