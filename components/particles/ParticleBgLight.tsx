"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Container, ISourceOptions } from "@tsparticles/engine";

/**
 * Lighter particle background for non-hero sections.
 * Fewer particles, lower opacity, no shadow — still gives
 * the same "alive" quality as the Hero but calmer.
 */
export default function ParticleBgLight() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setReady(true));
  }, []);

  const handleLoaded = useCallback(async (container?: Container) => {
    if (!container) return;

    const onVisibility = () => {
      if (document.hidden) {
        container.pause();
      } else {
        container.play();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
  }, []);

  const options: ISourceOptions = useMemo(
    () => ({
      fullScreen: false,
      fpsLimit: 60,
      particles: {
        number: {
          value: 50,
          density: { enable: true, width: 1920, height: 1080 },
        },
        color: { value: "#3b82f6" },
        opacity: {
          value: { min: 0.12, max: 0.45 },
          animation: {
            enable: true,
            speed: 0.3,
            minimumValue: 0.08,
            sync: false,
          },
        },
        size: {
          value: { min: 1, max: 3 },
        },
        move: {
          enable: true,
          speed: 0.35,
          direction: "none",
          outModes: { default: "out" },
        },
        links: {
          enable: true,
          distance: 150,
          color: "#3b82f6",
          opacity: 0.10,
          width: 1,
        },
        shadow: {
          enable: false,
        },
      },
      interactivity: {
        events: {
          onHover: { enable: true, mode: "grab" },
        },
        modes: {
          grab: { distance: 150, links: { opacity: 0.30 } },
        },
      },
      detectRetina: true,
    }),
    []
  );

  if (!ready) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 min-h-0 min-w-0 overflow-hidden"
      aria-hidden
    >
      <Particles
        id="contact-particles"
        className="h-full w-full max-w-full"
        options={options}
        particlesLoaded={handleLoaded}
      />
    </div>
  );
}
