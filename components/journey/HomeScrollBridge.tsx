"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  SCROLL_SPY_IDS,
  dispatchJourney,
  type JourneyStepId,
} from "@/lib/journey";

/**
 * Observes home page sections and broadcasts scroll progress + active section
 * for Navbar, JourneyRail, and other listeners.
 */
export default function HomeScrollBridge() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") {
      dispatchJourney({ activeId: "", progress: 0 });
      return;
    }

    const elements = SCROLL_SPY_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (elements.length === 0) return;

    const visibility = new Map<string, number>();

    function updateProgress(activeId: JourneyStepId | "") {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const progress =
        scrollable <= 0 ? 1 : Math.min(1, Math.max(0, window.scrollY / scrollable));
      dispatchJourney({ activeId, progress });
    }

    function pickActive() {
      let bestId: JourneyStepId | "" = "";
      let best = -1;
      for (const id of SCROLL_SPY_IDS) {
        const r = visibility.get(id) ?? 0;
        if (r > best) {
          best = r;
          bestId = id;
        }
      }
      if (best < 0.02) {
        const y = window.scrollY;
        bestId = y < 120 ? "intro" : SCROLL_SPY_IDS[1] ?? "about";
      }
      updateProgress(bestId);
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = (e.target as HTMLElement).id;
          visibility.set(id, e.intersectionRatio);
        }
        pickActive();
      },
      {
        root: null,
        rootMargin: "-12% 0px -55% 0px",
        threshold: [0, 0.08, 0.15, 0.25, 0.4, 0.6, 0.85, 1],
      },
    );

    for (const el of elements) io.observe(el);

    const onScroll = () => {
      pickActive();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    pickActive();

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  return null;
}
