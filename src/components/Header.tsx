/**
 * Header.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Converted from Header.jsx → TypeScript.
 * Design restyled to match the hero's dark industrial palette:
 *   • Deep space background  #04060c
 *   • Orange accent          #d64fd9
 *   • Amber accent           #b833bb
 *   • Bebas Neue logo
 *   • Barlow Condensed nav + CTAs
 *   • DM Mono labels
 *
 * All original functionality preserved:
 *   • Transparent-on-hero → solid-on-scroll
 *   • Courses mega-dropdown (tier-based)
 *   • Simple child dropdowns (Success, Resources)
 *   • Search overlay with live filtering
 *   • Mobile slide-in panel with nested accordions
 *   • Enroll Now / Book Free Demo CTAs
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  GraduationCap,
  Mail,
  Phone,
  Search,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

// ─── Local data / context stubs ───────────────────────────────────────────────
// Replace these with your real imports once you wire up the full project.

interface Course {
  id: string;
  title: string;
  slug: string;
  tier: string;
  tagline: string;
  duration: string;
}

interface TierMeta {
  color: string;
  emoji: string;
  softBg: string;
  borderColor: string;
}

// ── Stub data — swap with: import { courses, TIERS, coursesByTier, tierMeta } from '../../data/courses'
const TIERS: string[] = ["Foundation", "Professional", "Expert"];

const tierMeta: Record<string, TierMeta> = {
  Foundation:   { color: "#22c55e", emoji: "🌱", softBg: "rgba(34,197,94,0.1)",  borderColor: "rgba(34,197,94,0.3)" },
  Professional: { color: "#d64fd9", emoji: "🔥", softBg: "rgba(214,79,217,0.1)", borderColor: "rgba(214,79,217,0.3)" },
  Expert:       { color: "#b833bb", emoji: "⚡", softBg: "rgba(184,51,187,0.1)",  borderColor: "rgba(184,51,187,0.3)" },
};

const courses: Course[] = [
  { id: "1", title: "Python for AI",          slug: "python-for-ai",          tier: "Foundation",   tagline: "Learn Python", duration: "8 weeks" },
  { id: "2", title: "Machine Learning",       slug: "machine-learning",       tier: "Foundation",   tagline: "Core ML",      duration: "10 weeks" },
  { id: "3", title: "Deep Learning",          slug: "deep-learning",          tier: "Professional", tagline: "Neural nets",  duration: "12 weeks" },
  { id: "4", title: "NLP & LLMs",             slug: "nlp-llms",               tier: "Professional", tagline: "Language AI",  duration: "10 weeks" },
  { id: "5", title: "Computer Vision",        slug: "computer-vision",        tier: "Professional", tagline: "Vision AI",    duration: "10 weeks" },
  { id: "6", title: "MLOps",                  slug: "mlops",                  tier: "Expert",       tagline: "Deploy ML",    duration: "8 weeks" },
  { id: "7", title: "Prompt Engineering",     slug: "prompt-engineering",     tier: "Foundation",   tagline: "Prompt AI",    duration: "6 weeks" },
  { id: "8", title: "Data Analytics",         slug: "data-analytics",         tier: "Foundation",   tagline: "Analyse data", duration: "8 weeks" },
  { id: "9", title: "Generative AI",          slug: "generative-ai",          tier: "Expert",       tagline: "GenAI",        duration: "12 weeks" },
  { id: "10",title: "AI for Cloud",           slug: "ai-for-cloud",           tier: "Expert",       tagline: "Cloud AI",     duration: "10 weeks" },
];

const coursesByTier: Record<string, Course[]> = TIERS.reduce((acc, tier) => {
  acc[tier] = courses.filter((c) => c.tier === tier);
  return acc;
}, {} as Record<string, Course[]>);

// ── Stub branding — swap with: import { BRANDING } from '../../data/branding'
const BRANDING = {
  fullName:  "SCOPE AI HUB",
  shortName: "SCOPE",
  phone:     "+91 98765 43210",
  email:     "hello@scopeaihub.com",
  logoLight: "/Logo_White.webp", // replace with real paths
  logoDark:  "/Logo_White.webp",
};

// ── Stub modal hook — swap with: import { useModal } from '../../context/ModalContext'
function useModal() {
  return { openModal: () => console.log("open modal") };
}

// ─── Design tokens (mirror hero palette) ─────────────────────────────────────

const T = {
  bg:           "#04060c",
  bgScrolled:   "rgba(4,6,12,0.92)",
  border:       "rgba(214,79,217,0.12)",
  borderHover:  "rgba(214,79,217,0.35)",
  orange:       "#d64fd9",
  amber:        "#b833bb",
  white:        "#f5f0ea",
  muted:        "rgba(245,240,234,0.45)",
  faint:        "rgba(245,240,234,0.15)",
  surface:      "rgba(245,240,234,0.04)",
  surfaceHover: "rgba(245,240,234,0.08)",
  grad:         "linear-gradient(135deg,#d64fd9,#b833bb)",
  fontDisplay:  "'Bebas Neue', 'Arial Black', sans-serif",
  fontNav:      "'Barlow Condensed', 'Arial Narrow', sans-serif",
  fontMono:     "'DM Mono', 'Courier New', monospace",
  fontBody:     "'Barlow', sans-serif",
};

// ─── Nav definition ───────────────────────────────────────────────────────────

interface NavChild  { name: string; href: string; }
interface NavItem {
  name: string;
  href: string;
  megaDropdown?: boolean;
  children?: NavChild[];
}

const navigation: NavItem[] = [
  { name: "Home",           href: "/" },
  { name: "Courses",        href: "/courses",         megaDropdown: true },
  { name: "Admissions",     href: "/admissions" },
  { name: "Career Support", href: "/career-support" },
  {
    name: "Success",
    href: "/reviews",
    children: [{ name: "Student Reviews", href: "/reviews" }],
  },
  {
    name: "Resources",
    href: "/careers/trainers",
    children: [
      { name: "Our Trainers",     href: "/careers/trainers" },
      { name: "FAQs",             href: "/faq" },
      { name: "Join as Trainer",  href: "/careers/join-as-trainer" },
    ],
  },
  { name: "Contact", href: "/contact" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Polygon clip-path used by CTA buttons — matches hero button style. */
const CLIP = "polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px))";

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Thin orange line below active nav items. */
function ActiveBar() {
  return (
    <span
      style={{
        position: "absolute",
        bottom: -2,
        left: "50%",
        transform: "translateX(-50%)",
        width: "60%",
        height: 1.5,
        background: T.grad,
        borderRadius: 2,
      }}
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const Header: React.FC = () => {
  const pathname = usePathname();

  const [isOpen,          setIsOpen]          = useState(false);
  const [scrolled,        setScrolled]        = useState(false);
  const [showCourses,     setShowCourses]     = useState(false);
  const [activeDropdown,  setActiveDropdown]  = useState<string | null>(null);
  const [mobileExpanded,  setMobileExpanded]  = useState<string | null>(null);
  const [isSearchOpen,    setIsSearchOpen]    = useState(false);
  const [searchQuery,     setSearchQuery]     = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const { openModal } = useModal();

  const isHomePage    = pathname === "/";
  const isTransparent = isHomePage && !scrolled;

  // ── Scroll detection ────────────────────────────────────────────────────────
  useEffect(() => {
    const handle = () => {
      if (!isHomePage) { setScrolled(window.scrollY > 20); return; }
      const heroEl =
        document.getElementById("hero-scroll") ||
        document.querySelector<HTMLElement>('section[aria-label="Hero animation section"]');
      if (heroEl) {
        const spacer     = heroEl.closest<HTMLElement>(".pin-spacer");
        const boundary   = spacer || heroEl;
        const boundaryY  = boundary.getBoundingClientRect().bottom + window.scrollY;
        setScrolled(window.scrollY >= boundaryY - 80);
      } else {
        setScrolled(window.scrollY > window.innerHeight * 0.9);
      }
    };
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, [isHomePage]);

  // ── Close on route change ───────────────────────────────────────────────────
  useEffect(() => {
    setIsOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  // ── Focus search input when overlay opens ──────────────────────────────────
  useEffect(() => {
    if (isSearchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [isSearchOpen]);

  // ── Active check ────────────────────────────────────────────────────────────
  const isNavActive = (item: NavItem): boolean => {
    if (item.children) return item.children.some((c) => pathname === c.href);
    if (item.megaDropdown) return pathname.startsWith("/courses");
    return pathname === item.href;
  };

  // ── Filtered courses ─────────────────────────────────────────────────────────
  const filteredCourses = searchQuery.trim()
    ? courses.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.tier.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.tagline.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // ─── Header bar styles ─────────────────────────────────────────────────────
  const headerStyle: React.CSSProperties = {
    position:   "fixed",
    top:        0,
    left:       0,
    width:      "100%",
    zIndex:     999,
    height:     72,
    display:    "flex",
    alignItems: "center",
    transition: "background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease",
    background:     isTransparent ? "transparent" : T.bgScrolled,
    backdropFilter: isTransparent ? "none" : "blur(16px) saturate(180%)",
    borderBottom:   `1px solid ${isTransparent ? "transparent" : T.border}`,
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Google Fonts (Bebas Neue + Barlow already loaded in HeroScrollCanvas) */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;600&family=Barlow+Condensed:wght@500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeInDown   { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pageFoldDown {
          from { 
            opacity: 0; 
            transform: perspective(1000px) rotateX(-15deg); 
            transform-origin: top;
          }
          to { 
            opacity: 1; 
            transform: perspective(1000px) rotateX(0deg); 
            transform-origin: top;
          }
        }
      `}</style>

      {/* ════════════════════════════════════════════════════════════════════
          SEARCH OVERLAY
      ════════════════════════════════════════════════════════════════════ */}
      {isSearchOpen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1100,
            display: "flex", alignItems: "flex-start",
            justifyContent: "center", paddingTop: "8rem", padding: "8rem 1rem 0",
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setIsSearchOpen(false)}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(4,6,12,0.88)",
              backdropFilter: "blur(8px)",
            }}
          />

          {/* Panel */}
          <div
            style={{
              position: "relative", width: "100%", maxWidth: 640,
              background: "#0a0f1a",
              border: `1px solid ${T.border}`,
              borderRadius: 4,
              overflow: "hidden",
              animation: "fadeInDown 0.2s ease",
              boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
            }}
          >
            {/* Input row */}
            <div
              style={{
                display: "flex", alignItems: "center",
                padding: "1.25rem 1.5rem",
                borderBottom: `1px solid ${T.border}`,
                gap: "0.75rem",
              }}
            >
              <Search size={18} color={T.orange} />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search programs — NLP, MLOps, Prompt…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  fontFamily: T.fontBody, fontSize: "1rem", fontWeight: 400,
                  color: T.white,
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, padding: 4 }}
                >
                  <X size={16} />
                </button>
              )}
              <button
                onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, padding: 4 }}
              >
                <ChevronDown size={18} style={{ transform: "rotate(90deg)" }} />
              </button>
            </div>

            {/* Results */}
            <div style={{ maxHeight: "55vh", overflowY: "auto", padding: "1rem" }}>
              {!searchQuery.trim() ? (
                <div style={{ padding: "0.5rem" }}>
                  <p style={{
                    fontFamily: T.fontMono, fontSize: "0.6rem", letterSpacing: "0.2em",
                    textTransform: "uppercase", color: T.muted, marginBottom: "0.75rem",
                  }}>
                    Popular Searches
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {["Prompt Engineering", "Python AI", "NLP", "MLOps", "Data Analytics"].map((term) => (
                      <button
                        key={term}
                        onClick={() => setSearchQuery(term)}
                        style={{
                          padding: "0.4rem 0.9rem",
                          background: T.surface,
                          border: `1px solid ${T.faint}`,
                          color: T.muted,
                          fontFamily: T.fontBody, fontWeight: 600, fontSize: "0.8rem",
                          cursor: "pointer", borderRadius: 2,
                          transition: "background 0.15s, color 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = T.surfaceHover;
                          (e.currentTarget as HTMLButtonElement).style.color = T.white;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = T.surface;
                          (e.currentTarget as HTMLButtonElement).style.color = T.muted;
                        }}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              ) : filteredCourses.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem 0" }}>
                  <Search size={32} color={T.muted} style={{ margin: "0 auto 1rem" }} />
                  <p style={{ color: T.white, fontFamily: T.fontBody, fontWeight: 600 }}>
                    No programs found for &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p style={{ color: T.muted, fontSize: "0.85rem", marginTop: "0.25rem" }}>
                    Try NLP, Python, or MLOps
                  </p>
                </div>
              ) : (
                filteredCourses.map((course) => {
                  const meta = tierMeta[course.tier];
                  return (
                    <Link
                      key={course.id}
                      href={`/courses/${course.slug}`}
                      onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }}
                      style={{
                        display: "flex", alignItems: "center", gap: "1rem",
                        padding: "0.85rem 0.75rem",
                        borderRadius: 4,
                        textDecoration: "none",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.background = T.surface}
                      onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.background = "transparent"}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 4, flexShrink: 0,
                        background: T.surface, display: "flex", alignItems: "center", justifyContent: "center",
                        border: `1px solid ${T.faint}`,
                      }}>
                        <GraduationCap size={16} color={T.orange} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <p style={{ color: T.white, fontFamily: T.fontBody, fontWeight: 600, fontSize: "0.9rem" }}>
                            {course.title}
                          </p>
                          <span style={{
                            fontFamily: T.fontMono, fontSize: "0.6rem", letterSpacing: "0.15em",
                            textTransform: "uppercase", padding: "0.2rem 0.5rem", borderRadius: 2,
                            background: meta.softBg, color: meta.color, border: `1px solid ${meta.borderColor}`,
                          }}>
                            {meta.emoji} {course.tier}
                          </span>
                        </div>
                        <p style={{ color: T.muted, fontSize: "0.75rem", marginTop: "0.2rem", fontFamily: T.fontMono }}>
                          {course.duration} · {course.tier}
                        </p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          HEADER BAR
      ════════════════════════════════════════════════════════════════════ */}
      <header style={headerStyle}>
        <div style={{ width: "100%", maxWidth: 1320, margin: "0 auto", padding: "0 1.5rem" }}>
          <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>

            {/* ── Logo ──────────────────────────────────────────────────── */}
            <Link href="/" style={{ textDecoration: "none", flexShrink: 0, display: "flex", alignItems: "center", height: "100%" }}>
              <img 
                src={BRANDING.logoLight} 
                alt={BRANDING.fullName} 
                style={{
                  height: 60,
                  width: "auto",
                  display: "block",
                  transition: "opacity 0.2s",
                }}
              />
            </Link>

            {/* ── Desktop Nav ───────────────────────────────────────────── */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
                 className="header-desktop-nav">
              {navigation.map((item) => {
                const hasDropdown  = !!(item.children?.length);
                const isMegaCourses = !!item.megaDropdown;
                const isActive      = isNavActive(item);

                return (
                  <div
                    key={item.name}
                    style={{ position: "relative" }}
                    onMouseEnter={() => {
                      if (isMegaCourses) setShowCourses(true);
                      if (hasDropdown)   setActiveDropdown(item.name);
                    }}
                    onMouseLeave={() => {
                      if (isMegaCourses) setShowCourses(false);
                      if (hasDropdown)   setActiveDropdown(null);
                    }}
                  >
                    {/* Nav button / link */}
                    {hasDropdown || isMegaCourses ? (
                      <button
                        aria-expanded={isMegaCourses ? showCourses : activeDropdown === item.name}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.2rem",
                          padding: "0.5rem 0.75rem",
                          background: "none", border: "none", cursor: "pointer",
                          fontFamily: T.fontNav, fontWeight: 600, fontSize: "0.9rem",
                          letterSpacing: "0.06em", textTransform: "uppercase",
                          color: isActive
                            ? T.orange
                            : isTransparent ? "rgba(245,240,234,0.8)" : T.muted,
                          transition: "color 0.15s",
                          whiteSpace: "nowrap",
                          position: "relative",
                        }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.color = T.white}
                        onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.color =
                          isActive ? T.orange : isTransparent ? "rgba(245,240,234,0.8)" : T.muted}
                      >
                        {isActive && <ActiveBar />}
                        {item.name}
                        <ChevronDown
                          size={12}
                          style={{
                            transition: "transform 0.25s",
                            transform: (isMegaCourses ? showCourses : activeDropdown === item.name)
                              ? "rotate(180deg)" : "rotate(0deg)",
                          }}
                        />
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        style={{
                          display: "flex", alignItems: "center",
                          padding: "0.5rem 0.75rem",
                          fontFamily: T.fontNav, fontWeight: 600, fontSize: "0.9rem",
                          letterSpacing: "0.06em", textTransform: "uppercase",
                          color: isActive
                            ? T.orange
                            : isTransparent ? "rgba(245,240,234,0.8)" : T.muted,
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                          position: "relative",
                          transition: "color 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.color = T.white}
                        onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.color =
                          isActive ? T.orange : isTransparent ? "rgba(245,240,234,0.8)" : T.muted}
                      >
                        {isActive && <ActiveBar />}
                        {item.name}
                      </Link>
                    )}

                    {/* ── Simple Dropdown ─────────────────────────────── */}
                    {hasDropdown && activeDropdown === item.name && (
                      <div style={{
                        position: "absolute", top: "calc(100% + 8px)", left: 0,
                        width: 220, zIndex: 60,
                        animation: "pageFoldDown 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
                        transformOrigin: "top",
                      }}>
                        <div style={{
                          background: "#0a0f1a",
                          border: `1px solid ${T.border}`,
                          borderRadius: 4,
                          overflow: "hidden",
                          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                          padding: "0.4rem",
                        }}>
                          {item.children!.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              style={{
                                display: "block",
                                padding: "0.65rem 1rem",
                                fontFamily: T.fontNav, fontWeight: 600, fontSize: "0.85rem",
                                letterSpacing: "0.05em", textTransform: "uppercase",
                                color: pathname === child.href ? T.orange : T.muted,
                                textDecoration: "none",
                                borderRadius: 2,
                                transition: "background 0.15s, color 0.15s",
                              }}
                              onMouseEnter={(e) => {
                                const el = e.currentTarget as HTMLAnchorElement;
                                el.style.background = T.surface;
                                el.style.color = T.white;
                              }}
                              onMouseLeave={(e) => {
                                const el = e.currentTarget as HTMLAnchorElement;
                                el.style.background = "transparent";
                                el.style.color = pathname === child.href ? T.orange : T.muted;
                              }}
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Courses Mega Dropdown ────────────────────────── */}
                    {isMegaCourses && showCourses && (
                      <div style={{
                        position: "absolute", top: "calc(100% + 8px)",
                        left: "50%", transform: "translateX(-50%)",
                        width: 740, zIndex: 60,
                        animation: "pageFoldDown 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
                        transformOrigin: "top",
                      }}>
                        <div style={{
                          background: "#0a0f1a",
                          border: `1px solid ${T.border}`,
                          borderRadius: 4,
                          overflow: "hidden",
                          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
                        }}>
                          {/* Header row */}
                          <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "1.5rem 2rem 1rem",
                            borderBottom: `1px solid ${T.border}`,
                          }}>
                            <div>
                              <h3 style={{
                                fontFamily: T.fontDisplay, fontSize: "1.4rem",
                                letterSpacing: "0.05em", color: T.white, lineHeight: 1,
                              }}>
                                Our Programs
                              </h3>
                              <p style={{ fontFamily: T.fontMono, fontSize: "0.65rem", color: T.muted,
                                          letterSpacing: "0.15em", marginTop: "0.25rem" }}>
                                {courses.length} AI programs across {TIERS.length} tiers
                              </p>
                            </div>
                            <Link
                              href="/courses"
                              style={{
                                display: "inline-flex", alignItems: "center", gap: "0.3rem",
                                fontFamily: T.fontNav, fontWeight: 700, fontSize: "0.75rem",
                                letterSpacing: "0.12em", textTransform: "uppercase",
                                color: T.orange, textDecoration: "none",
                                padding: "0.4rem 0.9rem",
                                border: `1px solid rgba(214,79,217,0.3)`,
                                borderRadius: 2,
                                transition: "background 0.15s",
                              }}
                              onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.background = "rgba(214,79,217,0.1)"}
                              onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.background = "transparent"}
                            >
                              View All <ArrowRight size={12} />
                            </Link>
                          </div>

                          {/* Tier columns */}
                          <div style={{
                            display: "grid", gridTemplateColumns: "repeat(3,1fr)",
                            gap: "2rem", padding: "1.5rem 2rem 1.75rem",
                          }}>
                            {TIERS.map((tier) => {
                              const meta = tierMeta[tier];
                              return (
                                <div key={tier}>
                                  <h4 style={{
                                    fontFamily: T.fontMono, fontSize: "0.62rem",
                                    letterSpacing: "0.22em", textTransform: "uppercase",
                                    color: meta.color, marginBottom: "0.75rem",
                                    display: "flex", alignItems: "center", gap: "0.35rem",
                                  }}>
                                    {meta.emoji} {tier}
                                  </h4>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                                    {coursesByTier[tier].map((course) => (
                                      <Link
                                        key={course.id}
                                        href={`/courses/${course.slug}`}
                                        style={{
                                          display: "flex", alignItems: "center", gap: "0.6rem",
                                          padding: "0.5rem 0.6rem",
                                          borderRadius: 3,
                                          textDecoration: "none",
                                          transition: "background 0.15s",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.background = T.surface}
                                        onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.background = "transparent"}
                                      >
                                        <span style={{
                                          width: 5, height: 5, borderRadius: "50%",
                                          background: meta.color, flexShrink: 0,
                                        }} />
                                        <span style={{
                                          fontFamily: T.fontBody, fontWeight: 600,
                                          fontSize: "0.82rem", color: T.muted,
                                          transition: "color 0.15s",
                                        }}
                                          onMouseEnter={(e) => (e.currentTarget as HTMLSpanElement).style.color = T.white}
                                          onMouseLeave={(e) => (e.currentTarget as HTMLSpanElement).style.color = T.muted}
                                        >
                                          {course.title}
                                        </span>
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* CTA bar */}
                          <div style={{
                            background: "linear-gradient(110deg,#d64fd9,#c94d16)",
                            padding: "1.1rem 2rem",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                          }}>
                            <div>
                              <p style={{ color: "rgba(255,255,255,0.92)", fontFamily: T.fontBody,
                                          fontWeight: 600, fontSize: "0.9rem" }}>
                                Not sure which program is right for you?
                              </p>
                              <p style={{ color: "rgba(255,255,255,0.55)", fontFamily: T.fontMono,
                                          fontSize: "0.62rem", letterSpacing: "0.1em", marginTop: "0.15rem" }}>
                                Talk to our career counselors
                              </p>
                            </div>
                            <button
                              onClick={() => openModal()}
                              style={{
                                padding: "0.6rem 1.4rem",
                                background: "rgba(4,6,12,0.85)",
                                border: "none", cursor: "pointer",
                                fontFamily: T.fontNav, fontWeight: 700, fontSize: "0.8rem",
                                letterSpacing: "0.12em", textTransform: "uppercase",
                                color: T.orange,
                                clipPath: CLIP,
                                transition: "opacity 0.15s",
                              }}
                              onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"}
                              onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.opacity = "1"}
                            >
                              Get Guidance
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ── Desktop actions ─────────────────────────────────────── */}
              <div style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                marginLeft: "0.5rem",
                paddingLeft: "1rem",
                borderLeft: `1px solid ${T.border}`,
              }}>
                {/* Search */}
                <button
                  onClick={() => setIsSearchOpen(true)}
                  title="Search Programs"
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: T.muted, padding: "0.5rem",
                    display: "flex", alignItems: "center",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.color = T.white}
                  onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.color = T.muted}
                >
                  <Search size={17} />
                </button>

                {/* Book Free Demo */}
                <Link
                  href="#demo"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.4rem",
                    padding: "0.55rem 1.2rem",
                    border: `1px solid ${T.border}`,
                    color: T.muted,
                    fontFamily: T.fontNav, fontWeight: 700,
                    fontSize: "0.78rem", letterSpacing: "0.1em", textTransform: "uppercase",
                    textDecoration: "none",
                    clipPath: CLIP,
                    transition: "border-color 0.15s, color 0.15s, background 0.15s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.borderColor = T.borderHover;
                    el.style.color = T.white;
                    el.style.background = T.surface;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.borderColor = T.border;
                    el.style.color = T.muted;
                    el.style.background = "transparent";
                  }}
                >
                  Free Demo
                </Link>

                {/* Enroll Now */}
                <button
                  onClick={() => openModal()}
                  style={{
                    display: "inline-flex", alignItems: "center",
                    padding: "0.55rem 1.4rem",
                    background: T.grad,
                    border: "none", cursor: "pointer",
                    fontFamily: T.fontNav, fontWeight: 700,
                    fontSize: "0.78rem", letterSpacing: "0.1em", textTransform: "uppercase",
                    color: "#fff",
                    clipPath: CLIP,
                    boxShadow: "0 4px 18px rgba(214,79,217,0.4)",
                    transition: "opacity 0.15s, transform 0.15s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  }}
                >
                  Enroll Now
                </button>
              </div>
            </div>

            {/* ── Mobile action row ──────────────────────────────────────── */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                 className="header-mobile-nav">
              <button
                onClick={() => setIsSearchOpen(true)}
                style={{ background: "none", border: "none", cursor: "pointer",
                         color: T.muted, padding: "0.5rem" }}
              >
                <Search size={18} />
              </button>
              <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 38, height: 38,
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: 3, cursor: "pointer",
                  color: T.muted,
                  transition: "background 0.15s",
                }}
              >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE PANEL
      ════════════════════════════════════════════════════════════════════ */}
      {isOpen && (
        <div style={{ position: "fixed", inset: 0, top: 0, zIndex: 9999 }}>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }}
          />

          {/* Slide-in panel */}
          <div style={{
            position: "absolute", right: 0, top: 0, bottom: 0,
            width: "85%", maxWidth: 380,
            background: "#07090f",
            borderLeft: `1px solid ${T.border}`,
            display: "flex", flexDirection: "column",
            overflow: "hidden",
            boxShadow: "-24px 0 60px rgba(0,0,0,0.5)",
            animation: "slideInRight 0.3s ease-out",
          }}>
            {/* Panel header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0.75rem 1.5rem",
              borderBottom: `1px solid ${T.border}`,
              height: 72,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", height: "100%" }}>
                <img 
                  src={BRANDING.logoLight} 
                  alt={BRANDING.fullName} 
                  style={{ height: 48, width: "auto", display: "block" }}
                />
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  width: 36, height: 36, borderRadius: 3,
                  background: T.surface, border: `1px solid ${T.border}`,
                  cursor: "pointer", color: T.muted,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.5rem" }}>
              {navigation.map((item, index) => {
                const hasDropdown   = !!(item.children?.length);
                const isMegaCourses = !!item.megaDropdown;
                const isExpanded    = mobileExpanded === item.name;
                const isActive      = isNavActive(item);

                return (
                  <div key={item.name} style={{ borderBottom: `1px solid ${T.border}` }}>
                    {isMegaCourses || hasDropdown ? (
                      <>
                        <button
                          onClick={() => setMobileExpanded(isExpanded ? null : item.name)}
                          style={{
                            width: "100%", display: "flex", alignItems: "center",
                            padding: "1rem 0", background: "none", border: "none", cursor: "pointer",
                          }}
                        >
                          <span style={{
                            fontFamily: T.fontMono, fontSize: "0.55rem",
                            color: "rgba(245,240,234,0.2)", letterSpacing: "0.2em",
                            marginRight: "1rem", minWidth: "1.5rem",
                          }}>
                            0{index + 1}
                          </span>
                          <span style={{
                            flex: 1, textAlign: "left",
                            fontFamily: T.fontNav, fontWeight: 700, fontSize: "1rem",
                            letterSpacing: "0.06em", textTransform: "uppercase",
                            color: isActive ? T.orange : T.muted,
                          }}>
                            {item.name}
                          </span>
                          <ChevronDown
                            size={14}
                            color={isExpanded ? T.orange : T.faint}
                            style={{ transition: "transform 0.25s", transform: isExpanded ? "rotate(180deg)" : "none" }}
                          />
                        </button>

                        {isExpanded && (
                          <div style={{ paddingLeft: "2.5rem", paddingBottom: "0.75rem" }}>
                            {isMegaCourses
                              ? TIERS.map((tier) => {
                                  const meta = tierMeta[tier];
                                  return (
                                    <div key={tier} style={{ marginBottom: "1rem" }}>
                                      <p style={{
                                        fontFamily: T.fontMono, fontSize: "0.6rem",
                                        letterSpacing: "0.2em", textTransform: "uppercase",
                                        color: meta.color, marginBottom: "0.5rem",
                                      }}>
                                        {meta.emoji} {tier}
                                      </p>
                                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                                        {coursesByTier[tier].map((course) => (
                                          <Link
                                            key={course.id}
                                            href={`/courses/${course.slug}`}
                                            onClick={() => setIsOpen(false)}
                                            style={{
                                              fontFamily: T.fontBody, fontWeight: 600, fontSize: "0.75rem",
                                              padding: "0.3rem 0.7rem",
                                              background: T.surface, border: `1px solid ${T.faint}`,
                                              borderRadius: 2, color: T.muted, textDecoration: "none",
                                              transition: "color 0.15s, background 0.15s",
                                            }}
                                            onMouseEnter={(e) => {
                                              (e.currentTarget as HTMLAnchorElement).style.color = T.orange;
                                              (e.currentTarget as HTMLAnchorElement).style.background = "rgba(214,79,217,0.08)";
                                            }}
                                            onMouseLeave={(e) => {
                                              (e.currentTarget as HTMLAnchorElement).style.color = T.muted;
                                              (e.currentTarget as HTMLAnchorElement).style.background = T.surface;
                                            }}
                                          >
                                            {course.title}
                                          </Link>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })
                              : item.children!.map((child) => (
                                  <Link
                                    key={child.href}
                                    href={child.href}
                                    onClick={() => setIsOpen(false)}
                                    style={{
                                      display: "block", padding: "0.55rem 0",
                                      fontFamily: T.fontNav, fontWeight: 600, fontSize: "0.9rem",
                                      letterSpacing: "0.05em", textTransform: "uppercase",
                                      color: pathname === child.href ? T.orange : T.muted,
                                      textDecoration: "none",
                                    }}
                                  >
                                    {child.name}
                                  </Link>
                                ))
                            }
                            {isMegaCourses && (
                              <Link
                                href="/courses"
                                onClick={() => setIsOpen(false)}
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: "0.3rem",
                                  fontFamily: T.fontMono, fontWeight: 700, fontSize: "0.6rem",
                                  letterSpacing: "0.2em", textTransform: "uppercase",
                                  color: T.orange, textDecoration: "none", marginTop: "0.5rem",
                                }}
                              >
                                View All <ArrowRight size={10} />
                              </Link>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        style={{
                          display: "flex", alignItems: "center", padding: "1rem 0",
                          textDecoration: "none",
                        }}
                      >
                        <span style={{
                          fontFamily: T.fontMono, fontSize: "0.55rem",
                          color: "rgba(245,240,234,0.2)", letterSpacing: "0.2em",
                          marginRight: "1rem", minWidth: "1.5rem",
                        }}>
                          0{index + 1}
                        </span>
                        <span style={{
                          fontFamily: T.fontNav, fontWeight: 700, fontSize: "1rem",
                          letterSpacing: "0.06em", textTransform: "uppercase",
                          color: isNavActive(item) ? T.orange : T.muted,
                        }}>
                          {item.name}
                        </span>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Panel footer */}
            <div style={{
              padding: "1.25rem 1.5rem",
              borderTop: `1px solid ${T.border}`,
              display: "flex", flexDirection: "column", gap: "0.75rem",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <a
                  href={`tel:${BRANDING.phone}`}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.4rem",
                    fontFamily: T.fontMono, fontSize: "0.6rem",
                    color: T.muted, textDecoration: "none",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.color = T.orange}
                  onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.color = T.muted}
                >
                  <Phone size={11} /> {BRANDING.phone}
                </a>
                <a
                  href={`mailto:${BRANDING.email}`}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.4rem",
                    fontFamily: T.fontMono, fontSize: "0.6rem",
                    color: T.muted, textDecoration: "none",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.color = T.orange}
                  onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.color = T.muted}
                >
                  <Mail size={11} /> Email Us
                </a>
              </div>
              <button
                onClick={() => { openModal(); setIsOpen(false); }}
                style={{
                  width: "100%", padding: "0.9rem",
                  background: T.grad, border: "none", cursor: "pointer",
                  fontFamily: T.fontNav, fontWeight: 800, fontSize: "0.9rem",
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  color: "#fff",
                  clipPath: CLIP,
                  boxShadow: "0 6px 24px rgba(214,79,217,0.4)",
                }}
              >
                Enroll Now →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Responsive visibility helpers ───────────────────────────────────── */}
      <style>{`
        @media (min-width: 1024px) {
          .header-mobile-nav { display: none !important; }
        }
        @media (max-width: 1023px) {
          .header-desktop-nav { display: none !important; }
        }
      `}</style>
    </>
  );
};

export default Header;