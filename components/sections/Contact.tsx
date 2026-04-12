"use client";

import { useRef, useLayoutEffect } from "react";
import { SectionWrapper } from "@/components/layout";
import { Textify } from "@/components/textify";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const LINKS = [
  {
    label: "Email",
    href: "mailto:debayan.iitkgp@gmail.com",
    display: "debayan.iitkgp@gmail.com",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/debayan-biswas",
    display: "linkedin.com/in/debayan-biswas",
  },
  {
    label: "GitHub",
    href: "https://github.com/debayan",
    display: "github.com/debayan",
  },
] as const;

export default function Contact() {
  const linksRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (reduced || !linksRef.current) return;

    const links = linksRef.current.querySelectorAll("[data-contact-link]");
    gsap.set(links, { opacity: 0, y: 15 });

    if (subtitleRef.current) {
      gsap.set(subtitleRef.current, { opacity: 0, y: 10 });
      gsap.to(subtitleRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power3.out",
        scrollTrigger: {
          trigger: subtitleRef.current,
          start: "top 85%",
          once: true,
        },
      });
    }

    const tween = gsap.to(links, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: linksRef.current,
        start: "top 85%",
        once: true,
      },
    });

    return () => {
      tween.kill();
      ScrollTrigger.getAll()
        .filter((st) => st.trigger === linksRef.current || st.trigger === subtitleRef.current)
        .forEach((st) => st.kill());
    };
  }, [reduced]);

  return (
    <SectionWrapper id="contact">
      <div className="text-center">
        <Textify
          variant="highlight"
          content="Get in touch"
          tag="h2"
          className="inline-block text-3xl font-bold tracking-tight sm:text-4xl"
          trigger="scroll"
          highlightColor="var(--accent)"
          duration={0.8}
        />
        <p ref={subtitleRef} className="mt-4 text-[var(--text-muted)]">
          Open to backend, systems, and infrastructure roles. Let&apos;s talk.
        </p>

        <div
          ref={linksRef}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8"
        >
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              data-contact-link
              target={link.href.startsWith("mailto") ? undefined : "_blank"}
              rel={link.href.startsWith("mailto") ? undefined : "noopener noreferrer"}
              className="group flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] transition-all duration-300 hover:text-[var(--accent)] hover:bg-[var(--surface)] hover:shadow-[0_0_20px_rgba(59,130,246,0.08)]"
            >
              <span className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)]">
                {link.label}
              </span>
              <span className="hidden sm:inline">&middot;</span>
              <span className="underline underline-offset-4">
                {link.display}
              </span>
            </a>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
