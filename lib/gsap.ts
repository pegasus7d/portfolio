"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export const DEFAULTS = {
  duration: 0.6,
  ease: "power3.out",
  stagger: 0.08,
} as const;

export { gsap, ScrollTrigger };
