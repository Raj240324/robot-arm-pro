/**
 * app/layout.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Root layout for the Next.js App Router.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Metadata, Viewport } from "next";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "SCOPE AI Hub — Intelligence Engineered by Humans",
  description:
    "Master the full stack of modern AI — from transformer fundamentals to production deployment — in immersive, hands-on cohorts.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#010408",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#010408",
          overscrollBehavior: "none",
        }}
      >
        <Header />
        {children}
      </body>
    </html>
  );
}