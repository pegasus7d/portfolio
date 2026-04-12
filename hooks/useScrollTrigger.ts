"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger, DEFAULTS } from "@/lib/gsap";
import { useReducedMotion } from "./useReducedMotion";

export interface ScrollTriggerOptions {
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  trigger?: ScrollTrigger.Vars;
  stagger?: number;
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
 * Attaches a GSAP ScrollTrigger animation to the given ref.
 *
 * If `options.children` is true, animates direct children with stagger
 * instead of the container itself.
 */
export function useScrollTrigger<T extends HTMLElement>(
  options: ScrollTriggerOptions = {}
) {
  const ref = useRef<T>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (reduced || !ref.current) return;

    const el = ref.current;
    const targets = options.children ? el.children : el;

    const fromVars = { ...DEFAULT_FROM, ...options.from };
    const toVars: gsap.TweenVars = {
      ...DEFAULT_TO,
      ...options.to,
      stagger: options.stagger ?? DEFAULTS.stagger,
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
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
  }, [reduced, options.children, options.stagger]);

  return ref;
}
