"use client";

import { createElement } from "react";
import { useTextify } from "./useTextify";
import type { TextifyProps } from "./types";

/**
 * Textify — animated text rendering component.
 *
 * Usage:
 *   <Textify variant="typewriter" content="Hello world" tag="h1" cursor />
 *   <Textify variant="stagger" content="Fade in word by word" />
 *   <Textify variant="highlight" content="Important" highlightColor="#3b82f6" />
 *   <Textify variant="reveal" content="Clip-path wipe" trigger="scroll" />
 *   <Textify variant="none" content="Static text" />
 */
export default function Textify({
  content,
  variant = "none",
  tag = "span",
  className = "",
  delay = 0,
  duration = 1.2,
  trigger = "mount",
  highlightColor = "var(--accent)",
  cursor = false,
  staggerAmount = 0.06,
  onComplete,
}: TextifyProps) {
  const ref = useTextify<HTMLElement>({
    variant,
    trigger,
    delay,
    duration,
    staggerAmount,
    highlightColor,
    cursor,
    onComplete,
  });

  return createElement(
    tag,
    {
      ref,
      className,
      "data-textify": variant,
    },
    content
  );
}
