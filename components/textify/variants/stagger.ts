import { gsap } from "@/lib/gsap";
import type { VariantFactory, VariantResult } from "../types";

/**
 * Stagger: splits text into words, then fades + translates each word up
 * in sequence with a configurable stagger gap.
 */
export const stagger: VariantFactory = (el, config): VariantResult => {
  const text = el.textContent || "";
  el.textContent = "";

  const words = text.split(/(\s+)/);
  const spans: HTMLSpanElement[] = [];

  for (const word of words) {
    const span = document.createElement("span");
    span.textContent = word;
    span.style.display = "inline-block";
    span.style.opacity = "0";
    span.style.transform = "translateY(20px)";
    if (word.trim() === "") {
      span.style.whiteSpace = "pre";
    }
    el.appendChild(span);
    if (word.trim() !== "") {
      spans.push(span);
    }
  }

  const tl = gsap.timeline({
    paused: true,
    delay: config.delay,
    onComplete: config.onComplete,
  });

  tl.to(spans, {
    opacity: 1,
    y: 0,
    duration: config.duration / Math.max(spans.length, 1),
    stagger: config.staggerAmount,
    ease: "power3.out",
  });

  return {
    play: () => tl.play(),
    reverse: () => tl.reverse(),
    restart: () => tl.restart(),
    kill: () => {
      tl.kill();
      el.textContent = text;
    },
  };
};
