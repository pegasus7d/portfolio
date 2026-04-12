"use client";

import { useLayoutEffect, useRef } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { typewriter, stagger, highlight, reveal } from "./variants";
import type {
  TextifyVariant,
  TextifyTrigger,
  VariantConfig,
  VariantFactory,
  VariantResult,
} from "./types";

const VARIANT_MAP: Record<string, VariantFactory> = {
  typewriter,
  stagger,
  highlight,
  reveal,
};

interface UseTextifyOptions {
  variant: TextifyVariant;
  trigger: TextifyTrigger;
  delay: number;
  duration: number;
  staggerAmount: number;
  highlightColor: string;
  cursor: boolean;
  onComplete?: () => void;
}

/**
 * Core hook that wires a Textify variant to a DOM element.
 * Handles scroll-trigger registration, mount-based autoplay,
 * and manual control. Returns a ref to attach to the element.
 */
export function useTextify<T extends HTMLElement>(options: UseTextifyOptions) {
  const ref = useRef<T>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (!ref.current || reduced || options.variant === "none") return;

    const factory = VARIANT_MAP[options.variant];
    if (!factory) return;

    const config: VariantConfig = {
      delay: options.delay,
      duration: options.duration,
      staggerAmount: options.staggerAmount,
      highlightColor: options.highlightColor,
      cursor: options.cursor,
      onComplete: options.onComplete,
    };

    const result: VariantResult = factory(ref.current, config);

    if (options.trigger === "mount") {
      result.play();
    } else if (options.trigger === "scroll") {
      ScrollTrigger.create({
        trigger: ref.current,
        start: "top 85%",
        once: true,
        onEnter: () => result.play(),
      });
    }
    // "manual" — caller controls via returned ref; play() not called

    return () => {
      result.kill();
      ScrollTrigger.getAll()
        .filter((st) => st.trigger === ref.current)
        .forEach((st) => st.kill());
    };
  }, [reduced, options.variant, options.trigger]);

  return ref;
}
