import type { RefObject } from "react";

export type TextifyVariant =
  | "typewriter"
  | "stagger"
  | "highlight"
  | "reveal"
  | "none";

export type TextifyTrigger = "scroll" | "mount" | "manual";

export interface TextifyProps {
  content: string;
  variant?: TextifyVariant;
  tag?: keyof HTMLElementTagNameMap;
  className?: string;
  delay?: number;
  duration?: number;
  trigger?: TextifyTrigger;
  highlightColor?: string;
  cursor?: boolean;
  staggerAmount?: number;
  onComplete?: () => void;
}

export interface VariantConfig {
  delay: number;
  duration: number;
  staggerAmount: number;
  highlightColor: string;
  cursor: boolean;
  onComplete?: () => void;
}

export interface VariantResult {
  play: () => void;
  reverse: () => void;
  restart: () => void;
  kill: () => void;
}

export type VariantFactory = (
  el: HTMLElement,
  config: VariantConfig
) => VariantResult;
