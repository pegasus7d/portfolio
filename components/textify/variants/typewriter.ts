import { gsap } from "@/lib/gsap";
import type { VariantFactory, VariantResult } from "../types";

/**
 * Typewriter: splits text into individual character spans,
 * then reveals them one by one. Optionally shows a blinking cursor.
 */
export const typewriter: VariantFactory = (el, config): VariantResult => {
  const text = el.textContent || "";
  el.textContent = "";
  el.style.position = "relative";

  const chars: HTMLSpanElement[] = [];
  for (const ch of text) {
    const span = document.createElement("span");
    span.textContent = ch;
    span.style.opacity = "0";
    span.style.display = "inline";
    el.appendChild(span);
    chars.push(span);
  }

  let cursorEl: HTMLSpanElement | null = null;
  if (config.cursor) {
    cursorEl = document.createElement("span");
    cursorEl.textContent = "|";
    cursorEl.style.opacity = "1";
    cursorEl.className = "textify-cursor";
    el.appendChild(cursorEl);
  }

  const perChar = config.duration / Math.max(chars.length, 1);

  const tl = gsap.timeline({
    paused: true,
    delay: config.delay,
    onComplete: () => {
      if (cursorEl) {
        gsap.to(cursorEl, {
          opacity: 0,
          repeat: -1,
          yoyo: true,
          duration: 0.5,
          ease: "steps(1)",
        });
      }
      config.onComplete?.();
    },
  });

  chars.forEach((span, i) => {
    tl.to(span, { opacity: 1, duration: 0.01 }, i * perChar);
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
