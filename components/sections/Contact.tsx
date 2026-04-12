"use client";

import { useRef, useLayoutEffect, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/icons";
import { SectionWrapper } from "@/components/layout";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { ComponentType, SVGProps } from "react";

const ParticleBgLight = dynamic(
  () => import("@/components/particles/ParticleBgLight"),
  { ssr: false }
);

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
  const spotlightRef = useRef<HTMLDivElement>(null);
  const blobARef = useRef<HTMLDivElement>(null);
  const blobBRef = useRef<HTMLDivElement>(null);
  const [spotlightVisible, setSpotlightVisible] = useState(false);
  const reduced = useReducedMotion();

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (reduced || !spotlightRef.current || !sectionInnerRef.current) return;
      const rect = sectionInnerRef.current.getBoundingClientRect();
      spotlightRef.current.style.left = `${e.clientX - rect.left}px`;
      spotlightRef.current.style.top = `${e.clientY - rect.top}px`;
      if (!spotlightVisible) setSpotlightVisible(true);
    },
    [reduced, spotlightVisible]
  );

  const onMouseLeave = useCallback(() => {
    setSpotlightVisible(false);
  }, []);

  useLayoutEffect(() => {
    if (reduced || !sectionInnerRef.current) return;

    const heading = sectionInnerRef.current.querySelector("[data-contact-heading]");
    const subtitle = sectionInnerRef.current.querySelector("[data-contact-subtitle]");
    const divider = sectionInnerRef.current.querySelector("[data-contact-divider]");
    const links = sectionInnerRef.current.querySelectorAll("[data-contact-link]");

    const all = [heading, subtitle, divider, ...Array.from(links)].filter(Boolean);
    gsap.set(all, { opacity: 0, y: 28 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionInnerRef.current,
        start: "top 85%",
        once: true,
      },
    });

    tl.to([heading, subtitle].filter(Boolean), {
      opacity: 1,
      y: 0,
      duration: 0.7,
      stagger: 0.1,
      ease: "power3.out",
    });

    if (divider) {
      tl.fromTo(
        divider,
        { opacity: 0, scaleX: 0 },
        { opacity: 1, scaleX: 1, duration: 0.5, ease: "power2.out" },
        "-=0.3"
      );
    }

    tl.to(Array.from(links), {
      opacity: 1,
      y: 0,
      duration: 0.55,
      stagger: 0.12,
      ease: "power3.out",
    }, "-=0.2");

    // Primary: gentle vertical breath centered on heading
    if (blobARef.current) {
      gsap.to(blobARef.current, {
        y: -8,
        scale: 1.03,
        duration: 8,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    }
    // Secondary: slow horizontal drift
    if (blobBRef.current) {
      gsap.to(blobBRef.current, {
        x: 15,
        duration: 14,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 2,
      });
    }

    return () => {
      tl.kill();
      ScrollTrigger.getAll()
        .filter((st) => st.trigger === sectionInnerRef.current)
        .forEach((st) => st.kill());
    };
  }, [reduced]);

  return (
    <SectionWrapper id="contact" className="overflow-x-hidden">
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        ref={sectionInnerRef}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className="relative isolate overflow-hidden text-center"
      >
        {/* Decorative layer: clip blur orbs + particles to section width */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden
        >
          <ParticleBgLight />

          {/* Primary light — centered on heading, moderate intensity */}
          <div
            ref={blobARef}
            className="pointer-events-none absolute left-1/2 w-[min(120%,36rem)] max-w-[100vw] -translate-x-1/2 will-change-transform"
            aria-hidden="true"
            style={{
              height: 400,
              top: "-20%",
              filter: "blur(40px)",
              background:
                "radial-gradient(ellipse at center, rgba(59,130,246,0.12) 0%, rgba(59,130,246,0.04) 40%, transparent 70%)",
            }}
          />
          {/* Secondary fill — kept within horizontal bounds */}
          <div
            ref={blobBRef}
            className="pointer-events-none absolute left-0 w-[min(130%,28rem)] max-w-[100vw] will-change-transform"
            aria-hidden="true"
            style={{
              height: 500,
              top: "-5%",
              filter: "blur(50px)",
              background:
                "radial-gradient(ellipse at center, rgba(167,139,250,0.06) 0%, rgba(167,139,250,0.02) 35%, transparent 65%)",
            }}
          />
          {/* Tertiary fill — right side, width capped */}
          <div
            className="pointer-events-none absolute bottom-[-15%] right-0 w-[min(130%,32rem)] max-w-[100vw]"
            aria-hidden="true"
            style={{
              height: 450,
              filter: "blur(50px)",
              background:
                "radial-gradient(ellipse at center, rgba(59,130,246,0.04) 0%, transparent 55%)",
            }}
          />
        </div>

        {/* Cursor-follow spotlight (outside clip layer so it tracks over content) */}
        <div
          ref={spotlightRef}
          className="pointer-events-none absolute hidden md:block"
          aria-hidden="true"
          style={{
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)",
            transform: "translate(-50%, -50%)",
            opacity: spotlightVisible ? 1 : 0,
            transition: "opacity 0.4s",
            zIndex: 1,
          }}
        />

        <h2
          data-contact-heading
          className="relative z-10 inline-block text-3xl font-bold tracking-tight sm:text-4xl text-gradient"
        >
          Get in touch
        </h2>

        <p
          data-contact-subtitle
          className="relative z-10 mt-4 text-[var(--text-muted)]"
        >
          Open to backend, systems, and infrastructure roles. Let&apos;s talk.
        </p>

        {/* Divider */}
        <div
          data-contact-divider
          className="relative z-10 mx-auto mt-8 h-px w-56 origin-center opacity-60"
          style={{
            background: "linear-gradient(90deg, transparent 5%, rgba(59,130,246,0.25) 35%, rgba(167,139,250,0.18) 65%, transparent 95%)",
          }}
        />

        {/* Contact links */}
        <div className="relative z-10 mt-8 flex flex-col items-center gap-1.5">
          {LINKS.map((link, i) => {
            const Icon = link.icon;
            return (
              <a
                key={link.label}
                href={link.href}
                data-contact-link
                target={link.href.startsWith("mailto") ? undefined : "_blank"}
                rel={link.href.startsWith("mailto") ? undefined : "noopener noreferrer"}
                className={`group relative flex w-full max-w-md items-center gap-3 rounded-xl border border-transparent px-4 py-4 text-sm transition-all duration-[350ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-px hover:border-[rgba(42,42,42,0.6)] hover:bg-[rgba(30,30,30,0.5)] hover:shadow-[0_4px_30px_rgba(59,130,246,0.05)] md:hover:translate-x-[5px] sm:gap-4 sm:px-6 ${i === 1 ? "sm:ml-1.5" : ""} ${i === 2 ? "sm:ml-3" : ""}`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[rgba(42,42,42,0.5)] bg-[var(--bg)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.03)] transition-all duration-[350ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.08] group-hover:border-[rgba(59,130,246,0.25)] group-hover:bg-[rgba(30,30,30,0.8)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.1),0_0_8px_rgba(59,130,246,0.06),inset_0_1px_2px_rgba(255,255,255,0.05)]">
                  <Icon
                    size={16}
                    className="text-[var(--text-muted)] transition-all duration-[350ms] group-hover:text-[var(--accent)] group-hover:scale-110"
                  />
                </span>

                <div className="min-w-0 flex flex-col items-start gap-0.5 text-left sm:flex-row sm:items-center sm:gap-3">
                  <span className="shrink-0 font-medium text-[var(--text-primary)] transition-colors duration-[350ms] group-hover:text-[var(--accent)]">
                    {link.label}
                  </span>
                  <span className="relative break-all text-xs text-[var(--text-muted)] transition-colors duration-[350ms] group-hover:text-[var(--text-primary)] sm:break-normal sm:text-sm">
                    {link.display}
                    <span className="absolute bottom-0 left-0 h-px w-0 bg-gradient-to-r from-[var(--accent)]/60 to-[#a78bfa]/40 transition-all duration-[400ms] ease-out group-hover:w-full" />
                  </span>
                </div>

                <span className="ml-auto text-xs text-[var(--text-muted)] opacity-0 -translate-x-2 transition-all duration-[350ms] group-hover:opacity-60 group-hover:translate-x-0" aria-hidden="true">
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
