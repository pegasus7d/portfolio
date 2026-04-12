import { gsap } from "@/lib/gsap";
import type { VariantFactory, VariantResult } from "../types";

/**
 * Reveal: wipes the entire text block into view using a clip-path animation
 * from left to right (inset rectangle expanding).
 */
export const reveal: VariantFactory = (el, config): VariantResult => {
  gsap.set(el, { clipPath: "inset(0 100% 0 0)" });

  const tl = gsap.timeline({
    paused: true,
    delay: config.delay,
    onComplete: config.onComplete,
  });

  tl.to(el, {
    clipPath: "inset(0 0% 0 0)",
    duration: config.duration,
    ease: "power3.out",
  });

  return {
    play: () => tl.play(),
    reverse: () => tl.reverse(),
    restart: () => tl.restart(),
    kill: () => {
      tl.kill();
      gsap.set(el, { clipPath: "none" });
    },
  };
};
