"use client";

import { useRef, useLayoutEffect } from "react";
import { Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/icons";
import { SectionWrapper } from "@/components/layout";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { ComponentType, SVGProps } from "react";

interface ContactLink {
  label: string;
  href: string;
  display: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
}

const LINKS: ContactLink[] = [
  {
    label: "Email",
    href: "mailto:debayan.iitkgp@gmail.com",
    display: "debayan.iitkgp@gmail.com",
    icon: Mail,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/debayan-biswas",
    display: "linkedin.com/in/debayan-biswas",
    icon: LinkedinIcon,
  },
  {
    label: "GitHub",
    href: "https://github.com/pegasus7d",
    display: "github.com/pegasus7d",
    icon: GithubIcon,
  },
];

export default function Contact() {
  const sectionInnerRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (reduced || !sectionInnerRef.current) return;

    const heading = sectionInnerRef.current.querySelector("[data-contact-heading]");
    const subtitle = sectionInnerRef.current.querySelector("[data-contact-subtitle]");
    const divider = sectionInnerRef.current.querySelector("[data-contact-divider]");
    const links = sectionInnerRef.current.querySelectorAll("[data-contact-link]");

    const all = [heading, subtitle, divider, ...Array.from(links)].filter(Boolean);
    gsap.set(all, { opacity: 0, y: 20 });

    const tween = gsap.to(all, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.08,
      ease: "power3.out",
      scrollTrigger: {
        trigger: sectionInnerRef.current,
        start: "top 85%",
        once: true,
      },
    });

    return () => {
      tween.kill();
      ScrollTrigger.getAll()
        .filter((st) => st.trigger === sectionInnerRef.current)
        .forEach((st) => st.kill());
    };
  }, [reduced]);

  return (
    <SectionWrapper id="contact">
      <div ref={sectionInnerRef} className="relative text-center">
        {/* Radial glow behind heading */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/3 w-[480px] h-[280px]"
          aria-hidden="true"
          style={{
            background: "radial-gradient(ellipse at center, rgba(59,130,246,0.08) 0%, rgba(167,139,250,0.04) 40%, transparent 70%)",
          }}
        />

        <h2
          data-contact-heading
          className="relative inline-block text-3xl font-bold tracking-tight sm:text-4xl bg-gradient-to-r from-[var(--text-primary)] via-[var(--accent)] to-[#a78bfa] bg-clip-text text-transparent"
        >
          Get in touch
        </h2>

        <p
          data-contact-subtitle
          className="mt-4 text-[var(--text-muted)]"
        >
          Open to backend, systems, and infrastructure roles. Let&apos;s talk.
        </p>

        {/* Gradient divider */}
        <div
          data-contact-divider
          className="mx-auto mt-8 h-px w-48"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.3), rgba(167,139,250,0.2), transparent)",
          }}
        />

        {/* Contact links */}
        <div className="mt-8 flex flex-col items-center gap-2">
          {LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.label}
                href={link.href}
                data-contact-link
                target={link.href.startsWith("mailto") ? undefined : "_blank"}
                rel={link.href.startsWith("mailto") ? undefined : "noopener noreferrer"}
                className="group relative flex w-full max-w-md items-center gap-4 rounded-xl border border-transparent px-6 py-4 text-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--border)] hover:bg-[var(--surface)] hover:shadow-[0_4px_24px_rgba(59,130,246,0.06)]"
              >
                {/* Icon */}
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg)] transition-all duration-300 group-hover:border-[var(--accent)]/30 group-hover:shadow-[0_0_10px_rgba(59,130,246,0.12)]">
                  <Icon
                    size={16}
                    className="text-[var(--text-muted)] transition-all duration-300 group-hover:text-[var(--accent)] group-hover:brightness-125"
                  />
                </span>

                {/* Text */}
                <div className="flex flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:gap-3">
                  <span className="font-medium text-[var(--text-primary)] transition-colors duration-300 group-hover:text-[var(--accent)]">
                    {link.label}
                  </span>
                  <span className="relative text-xs text-[var(--text-muted)] transition-colors duration-300 group-hover:text-[var(--text-primary)] sm:text-sm">
                    {link.display}
                    {/* Animated underline */}
                    <span className="absolute bottom-0 left-0 h-px w-0 bg-[var(--accent)] transition-all duration-300 group-hover:w-full" />
                  </span>
                </div>

                {/* Arrow */}
                <span className="ml-auto text-[var(--text-muted)] opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0.5" aria-hidden="true">
                  &rarr;
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </SectionWrapper>
  );
}
