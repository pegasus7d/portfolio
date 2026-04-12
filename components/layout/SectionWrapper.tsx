"use client";

import { type ReactNode } from "react";
import { useScrollTrigger, type ScrollTriggerOptions } from "@/hooks/useScrollTrigger";

interface SectionWrapperProps {
  id: string;
  children: ReactNode;
  className?: string;
  animation?: ScrollTriggerOptions;
  /** Animate direct children with stagger instead of the section itself */
  staggerChildren?: boolean;
}

export default function SectionWrapper({
  id,
  children,
  className = "",
  animation,
  staggerChildren = false,
}: SectionWrapperProps) {
  const ref = useScrollTrigger<HTMLElement>({
    ...animation,
    children: staggerChildren,
  });

  return (
    <section
      ref={ref}
      id={id}
      className={`mx-auto max-w-5xl px-6 py-24 md:py-32 ${className}`}
    >
      {children}
    </section>
  );
}
