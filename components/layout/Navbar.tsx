"use client";

import {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useMemo,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, LayoutGroup } from "framer-motion";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  JOURNEY_EVENT,
  type JourneyDetail,
} from "@/lib/journey";

/** Place your PDF at `public/assets/resume.pdf` — it is served at /assets/resume.pdf and downloaded on click. */
const RESUME_HREF = "/assets/resume.pdf";
const RESUME_DOWNLOAD_NAME = "Debayan_Biswas_Resume.pdf";

const NAV_LINKS = [
  { label: "About", href: "/#about", sectionId: "about" as const },
  { label: "Projects", href: "/#projects", sectionId: "projects" as const },
  { label: "Skills", href: "/#skills", sectionId: "skills" as const },
  { label: "Architecture", href: "/#graph", sectionId: "graph" as const },
  { label: "Blog", href: "/#blog", sectionId: "blog" as const },
  { label: "Contact", href: "/#contact", sectionId: "contact" as const },
] as const;

function useHomeJourney() {
  const pathname = usePathname();
  const [journey, setJourney] = useState<JourneyDetail>({
    activeId: "",
    progress: 0,
  });

  useEffect(() => {
    const onJourney = (e: Event) => {
      const d = (e as CustomEvent<JourneyDetail>).detail;
      if (d) setJourney(d);
    };
    window.addEventListener(JOURNEY_EVENT, onJourney as EventListener);
    return () =>
      window.removeEventListener(JOURNEY_EVENT, onJourney as EventListener);
  }, []);

  const activeSection = pathname === "/" ? journey.activeId : "";
  const scrollProgress = pathname === "/" ? journey.progress : 0;

  return { activeSection, scrollProgress };
}

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { activeSection, scrollProgress } = useHomeJourney();

  const blogActive =
    pathname.startsWith("/blog") ||
    (pathname === "/" && activeSection === "blog");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useLayoutEffect(() => {
    if (reduced || !navRef.current) return;
    const logo = navRef.current.querySelector("[data-nav-logo]");
    const items = navRef.current.querySelectorAll("[data-nav-animate]");
    const all = [logo, ...Array.from(items)].filter(Boolean);

    gsap.set(all, { opacity: 0, y: -10 });
    gsap.to(all, {
      opacity: 1,
      y: 0,
      duration: 0.55,
      stagger: 0.06,
      ease: "power3.out",
      delay: 0.2,
    });
  }, [reduced]);

  const linkIsActive = useMemo(
    () => (sectionId: (typeof NAV_LINKS)[number]["sectionId"]) => {
      if (sectionId === "blog") return blogActive;
      if (pathname !== "/") return false;
      return activeSection === sectionId;
    },
    [pathname, blogActive, activeSection],
  );

  const navLinkClass = (active: boolean) =>
    [
      "relative inline-block text-[13px] font-medium tracking-wide transition-colors duration-200",
      active
        ? "text-[var(--text-primary)]"
        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
    ].join(" ");

  const showProgress = pathname === "/";

  return (
    <header
      ref={navRef}
      className={[
        "fixed top-0 left-0 right-0 z-50 transition-[background,box-shadow,border-color,backdrop-filter] duration-300 ease-out",
        scrolled || mobileOpen
          ? "border-b border-white/[0.06] bg-[var(--bg)]/[0.72] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.03)_inset] backdrop-blur-xl backdrop-saturate-150"
          : "border-b border-transparent bg-transparent",
      ].join(" ")}
    >
      {showProgress && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-0.5 overflow-hidden bg-black/20"
          aria-hidden
        >
          <div
            className="h-full w-full origin-left bg-gradient-to-r from-indigo-400 via-blue-400 to-violet-400 will-change-transform transition-[transform] duration-150 ease-out"
            style={{
              transform: `scaleX(${scrollProgress < 0.003 ? 0 : scrollProgress})`,
            }}
          />
        </div>
      )}

      <div
        className={[
          "pointer-events-none absolute inset-x-0 top-0 h-px transition-opacity duration-300",
          scrolled ? "opacity-100" : "opacity-0",
        ].join(" ")}
        aria-hidden
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.35) 35%, rgba(59,130,246,0.4) 50%, rgba(167,139,250,0.3) 65%, transparent 100%)",
        }}
      />

      <nav className="relative z-[2] mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-3.5 sm:px-6">
        <Link
          href="/"
          data-nav-logo
          className="group relative flex shrink-0 items-baseline gap-0.5"
        >
          <span
            className="bg-gradient-to-r from-[#f4f4f8] via-[#c7d2fe] to-[#a5b4fc] bg-clip-text text-lg font-semibold tracking-tight text-transparent transition-[filter] duration-300 group-hover:drop-shadow-[0_0_14px_rgba(129,140,248,0.45)]"
            style={{ WebkitBackgroundClip: "text" }}
          >
            Debayan
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-[var(--text-muted)] transition-colors duration-200 group-hover:text-[#94a3b8]">
            .dev
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <LayoutGroup id="nav-links">
            <ul className="mr-1 flex items-center gap-0.5">
              {NAV_LINKS.map((link) => {
                const active = linkIsActive(link.sectionId);
                return (
                  <li key={link.href} data-nav-animate>
                    <Link
                      href={link.href}
                      className={`${navLinkClass(active)} rounded-lg px-3 py-2 hover:bg-white/[0.04] hover:shadow-[0_0_20px_-4px_rgba(99,102,241,0.25)]`}
                    >
                      <span className="relative z-10">{link.label}</span>
                      {active && (
                        <motion.span
                          layoutId="nav-underline"
                          className="absolute bottom-0 left-3 right-3 h-[3px] rounded-full bg-gradient-to-r from-indigo-400/90 via-blue-400 to-violet-400/80 shadow-[0_0_14px_rgba(99,102,241,0.55)]"
                          aria-hidden
                          transition={{
                            type: "spring",
                            stiffness: 420,
                            damping: 34,
                          }}
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </LayoutGroup>

          <div
            className="ml-3 border-l border-white/[0.08] pl-4"
            data-nav-animate
          >
            <a
              href={RESUME_HREF}
              download={RESUME_DOWNLOAD_NAME}
              className="group relative inline-flex overflow-hidden rounded-full bg-gradient-to-r from-indigo-500/90 via-blue-500 to-violet-500/95 px-4 py-2 text-[13px] font-semibold text-white shadow-[0_0_24px_-4px_rgba(99,102,241,0.55)] transition-[transform,box-shadow] duration-200 hover:scale-[1.02] hover:shadow-[0_0_32px_-2px_rgba(99,102,241,0.65)] active:scale-[0.98]"
            >
              <span className="relative z-10">Resume</span>
              <span
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/0 via-white/15 to-white/25 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                aria-hidden
              />
            </a>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] md:hidden"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <span
            className={`block h-0.5 w-5 origin-center bg-[var(--text-primary)] transition-transform duration-300 ${
              mobileOpen ? "translate-y-2 rotate-45" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-5 bg-[var(--text-primary)] transition-opacity duration-300 ${
              mobileOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-5 origin-center bg-[var(--text-primary)] transition-transform duration-300 ${
              mobileOpen ? "-translate-y-2 -rotate-45" : ""
            }`}
          />
        </button>
      </nav>

      {mobileOpen && (
        <div
          className="fixed inset-0 top-0 z-40 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-[57px] left-0 max-h-[min(85vh,calc(100dvh-57px))] overflow-y-auto border-b border-white/[0.08] bg-[var(--bg)]/95 px-5 py-8 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.65)] backdrop-blur-2xl">
            <ul className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => {
                const active = linkIsActive(link.sectionId);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={[
                        "flex items-center rounded-xl px-4 py-3.5 text-base font-medium transition-colors",
                        active
                          ? "bg-white/[0.08] text-[var(--text-primary)]"
                          : "text-[var(--text-muted)] hover:bg-white/[0.05] hover:text-[var(--text-primary)]",
                      ].join(" ")}
                    >
                      {active && (
                        <span
                          className="mr-3 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-indigo-400 to-blue-400 shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                          aria-hidden
                        />
                      )}
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-8 border-t border-white/[0.08] pt-8">
              <a
                href={RESUME_HREF}
                download={RESUME_DOWNLOAD_NAME}
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl bg-gradient-to-r from-indigo-500 via-blue-500 to-violet-500 py-3.5 text-center text-base font-semibold text-white shadow-[0_0_28px_-4px_rgba(99,102,241,0.5)]"
              >
                Download resume
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
