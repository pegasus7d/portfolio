"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger, DEFAULTS } from "@/lib/gsap";
import { useReducedMotion } from "./useReducedMotion";

export interface ScrollTriggerOptions {
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  trigger?: ScrollTrigger.Vars;
  stagger?: number;
  /** @deprecated No longer used — children are always the animation target */
  children?: boolean;
}

const DEFAULT_FROM: gsap.TweenVars = {
  y: 50,
  opacity: 0,
  filter: "blur(4px)",
};

const DEFAULT_TO: gsap.TweenVars = {
  y: 0,
  opacity: 1,
  filter: "blur(0px)",
  duration: 0.8,
  ease: "power3.out",
};

/**
 * Attaches a GSAP ScrollTrigger animation to direct children of the ref.
 *
 * The container itself stays fully visible and occupies layout space,
 * which keeps anchor-link scrolling (#contact, #about, etc.) working.
 */
export function useScrollTrigger<T extends HTMLElement>(
  options: ScrollTriggerOptions = {}
) {
  const ref = useRef<T>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (reduced || !ref.current) return;

    const el = ref.current;
    const targets = el.children;

    const fromVars = { ...DEFAULT_FROM, ...options.from };
    const toVars: gsap.TweenVars = {
      ...DEFAULT_TO,
      ...options.to,
      stagger: options.stagger ?? DEFAULTS.stagger,
      scrollTrigger: {
        trigger: el,
        start: "top 90%",
        end: "bottom 20%",
        toggleActions: "play none none none",
        once: true,
        ...options.trigger,
      },
    };

    gsap.set(targets, fromVars);
    const tween = gsap.to(targets, toVars);

    return () => {
      tween.kill();
      ScrollTrigger.getAll()
        .filter((st) => st.trigger === el)
        .forEach((st) => st.kill());
    };
  }, [reduced, options.stagger]);

  return ref;
}
