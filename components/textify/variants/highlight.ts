import { gsap } from "@/lib/gsap";
import type { VariantFactory, VariantResult } from "../types";

/**
 * Highlight: text renders instantly, then a colored underline/background
 * sweeps from left to right behind it using a pseudo-element technique
 * (implemented via an injected child span).
 */
export const highlight: VariantFactory = (el, config): VariantResult => {
  const text = el.textContent || "";
  el.textContent = "";
  el.style.position = "relative";
  el.style.display = "inline-block";

  const textSpan = document.createElement("span");
  textSpan.textContent = text;
  textSpan.style.position = "relative";
  textSpan.style.zIndex = "1";

  const bg = document.createElement("span");
  bg.style.position = "absolute";
  bg.style.left = "0";
  bg.style.bottom = "0";
  bg.style.width = "100%";
  bg.style.height = "30%";
  bg.style.backgroundColor = config.highlightColor;
  bg.style.opacity = "0.3";
  bg.style.transformOrigin = "left";
  bg.style.transform = "scaleX(0)";
  bg.style.zIndex = "0";
  bg.style.borderRadius = "2px";

  el.appendChild(bg);
  el.appendChild(textSpan);

  const tl = gsap.timeline({
    paused: true,
    delay: config.delay,
    onComplete: config.onComplete,
  });

  tl.to(bg, {
    scaleX: 1,
    duration: config.duration,
    ease: "power2.inOut",
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
